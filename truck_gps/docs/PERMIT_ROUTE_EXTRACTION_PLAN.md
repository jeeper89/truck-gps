# Permit Route Extraction & Navigation — Implementation Plan

Turn an uploaded oversize/overweight permit (PDF or photo) into a geolocated,
navigable route that follows the *exact* path authorized on the permit, with
turn-by-turn guidance.

Reference documents analyzed: two CT DOT "Oversize/Overweight Single Trip
Permit" PDFs (CT-Connect output, image-only scans — no text layer). Their
route sections look like:

```
Trip Origin:        NY LINE
Trip Destination:   HARTFORD
Authorized Routes:  84E-691E-91N--EXIT 27 BRAINARD RD- AIRPORT RD -
                    WETHERSFIELD AVE- WYLLYS ST -JEFFERSON ST-80 SEYMOUR ST;
                    ENDING AT 80 SEYMOUR ST HARTFORD CT
```
```
Trip Origin:        WATERFORD
Trip Destination:   GROTON
Authorized Routes:  850 HARTFORD TURNPIKE; 85S-95N-12S-349S 75 EASTERN POINT RD
```

The core problem decomposes into five stages, each independently testable:

```
upload → (A) extract → (B) parse route grammar → (C) geolocate waypoints
       → (D) build constrained route → (E) navigate turn-by-turn
```

---

## Stage A — Document ingestion & structured extraction

**Input:** PDF (often image-only scan) or phone photo(s). Possibly multiple
pages/photos per permit.

**Approach:**

1. **Upload & storage.** `POST /api/permits/upload` accepts PDF/JPEG/PNG/HEIC,
   stores the original in S3 (`@aws-sdk/client-s3` is already a dependency),
   creates a `Permit` row with status `uploaded`, and kicks off an async
   extraction job (status polled by the client).
2. **Normalization.** PDF pages rendered to images (~200 DPI). Photos get
   EXIF rotation applied; no heavy preprocessing — the vision model handles
   skew/lighting far better than classical OCR pipelines.
3. **Vision-LLM structured extraction.** Send page images to the Claude API
   with a strict JSON schema (tool-use / structured output). Permit layouts
   vary by state and template-based OCR (Tesseract + regex zones) breaks on
   every new format; a vision model generalizes and reads the route string in
   context. Extract:
   - Permit metadata: permit number, issuing state/agency, effective dates,
     carrier, USDOT #, fees.
   - Vehicle/load: dimensions (L/W/H), overhangs, axle count, weights,
     axle spacings, tractor/trailer plates & VINs.
   - **Route block (verbatim):** trip origin, trip destination, authorized
     route text — extracted character-for-character, no interpretation yet.
   - Restrictions: daylight-only, M-F only, no-weekend, lane restrictions,
     flag/sign requirements, etc. (as a typed list + verbatim text).
   - Per-field `confidence` so the review UI can flag low-confidence fields.
4. **Cheap-path fallback.** If the PDF has a real text layer, extract text
   directly and skip image inference for everything except verification.

**Key principle:** extraction produces *raw structured data* + verbatim route
text. Interpretation (parsing/geocoding) is a separate stage so errors can be
attributed and corrected independently.

---

## Stage B — Route-grammar parsing

The authorized-route string is an ordered list of road segments. The truck
stays on each named road **until the next token's junction is reached** — the
tokens are not stopovers, they are "turn here onto this" instructions.

**Token types observed (CT), to be modeled as a discriminated union:**

| Token | Meaning | Parsed form |
|---|---|---|
| `84E` | Interstate 84 eastbound | `{type: highway, ref: "84", dir: "E"}` |
| `691E`, `91N` | I-691 E, I-91 N | same |
| `12S`, `349S` | CT-12 S, CT-349 S (state routes) | same (class resolved later) |
| `EXIT 27` | leave current highway at exit 27 | `{type: exit, number: "27"}` |
| `BRAINARD RD` | named surface street | `{type: street, name}` |
| `80 SEYMOUR ST` | street address (terminal or origin) | `{type: address}` |
| `850 HARTFORD TURNPIKE` | origin address before `;` | `{type: address}` |
| `NY LINE` | state-border origin | `{type: state_line, state: "NY"}` |
| `ENDING AT …` | terminal clause | destination confirmation |

**Parsing strategy — LLM parse + deterministic validation:**

1. An LLM call (schema-constrained) converts the verbatim string into the
   ordered token list. This handles the messy separators: `-`, `--`, `;`,
   inconsistent spacing, and hyphens *inside* street names.
2. A deterministic validator then normalizes and sanity-checks:
   - Numeric refs are ambiguous (`84` = I-84; `12` = CT-12; could be US-x).
     Resolve against a per-state route registry (I-/US-/state route lists)
     **plus a connectivity check** in Stage C — the correct candidate is the
     one that actually intersects the previous segment.
   - Directions must alternate plausibly (a road token must carry or inherit
     a travel direction).
   - `EXIT n` must follow a highway token.
   - First/last tokens must be resolvable as origin/destination anchors.
3. Anything the validator can't resolve is flagged for human review rather
   than guessed.

Unit-test this stage heavily with a growing corpus of real permit strings —
it is pure text-to-JSON and cheap to regression-test.

---

## Stage C — Geolocating the waypoint chain

Convert the token list into an ordered list of coordinates that pin the route
to the road network. The waypoints are the **junctions between consecutive
segments**, plus origin and destination:

For permit 1: NY-line crossing of I-84 → I-84/I-691 interchange → I-691/I-91
interchange → I-91 Exit 27 ramp → Brainard Rd/Airport Rd junction → Airport
Rd/Wethersfield Ave → … → 80 Seymour St, Hartford.

**Data sources (hybrid):**

- **OpenStreetMap (Overpass API)** — the workhorse for junction resolution:
  - Route relations (`route=road`, `ref=I 84`) give full way geometry for
    each highway, filtered to the correct carriageway by direction.
  - Exit nodes: `highway=motorway_junction` with `ref=27` on the I-91
    relation → exact off-ramp coordinate. (Caution: CT renumbered many exits
    to milepost-based numbers; verify against permit issue date and keep a
    CT exit-number crosswalk table.)
  - Street-to-street junctions: shared node of two named ways within the
    expected corridor.
  - Interchange of two highways: nearest connection between their relations.
- **HERE Geocoding & Search** (already integrated) — addresses
  (`80 Seymour St Hartford CT`), place names (`WATERFORD`), and fallback
  street lookups.
- **State-line origins** (`NY LINE`): intersect the first highway's OSM
  geometry with the state boundary polygon → the I-84 crossing point at the
  NY/CT line.

**Ambiguity handling:** every junction lookup is scoped to a corridor around
the previous segment's geometry (search along the road, not statewide).
When multiple candidates survive, choose by graph connectivity and ordering
(each junction must lie *downstream* of the previous one in the travel
direction); if still ambiguous, flag for review.

**Output:** `Waypoint[]` — `{seq, lat, lng, kind: origin|junction|exit|dest,
label, snappedRoadRef, confidence}`.

---

## Stage D — Building the constrained route (the compliance guarantee)

The route handed to the driver must traverse *exactly* the permitted roads.
A normal A→B router will happily "improve" the path, which is a permit
violation. Two mechanisms, used together:

1. **Via-waypoint routing (primary).** HERE Routing v8 with the full ordered
   waypoint list as pass-through `via` points (`passThrough=true`, so they
   are not treated as stops), `transportMode=truck`, and the permit's vehicle
   dimensions. Request `return=polyline,summary,actions,instructions,spans`
   with `spans=streetAttributes,routeNumbers,streetNames`.
2. **Verify-and-densify loop (the guarantee).** After routing, walk the
   returned spans and check that each leg's road name/route number matches
   the expected segment from Stage B. If any leg deviates (router shortcut),
   sample additional shape points from that segment's OSM way geometry
   (midpoints), insert them as extra via points, and re-route. Iterate until
   every span matches or a hard conflict is found (e.g., the router refuses a
   road due to a truck restriction — which itself is a red flag worth
   surfacing, since the state authorized it but the map data disagrees).
   Cap iterations; on failure, mark segments `unverified` for human review.

**Fallback for stubborn segments:** build the polyline directly from the OSM
way geometry between the two junctions and run it through a map-matching
endpoint (HERE Route Matching) to produce a routable, navigable result. This
is exact by construction and a good escape hatch.

**Output stored per permit:** final polyline (encoded + GeoJSON), ordered
maneuver list, distance/duration, and a per-segment verification report
(`matched | densified | unverified`).

---

## Stage E — Turn-by-turn navigation

Two delivery modes, both from the same stored route:

1. **In-app navigation (recommended primary).** The route is fixed and
   pre-computed, which makes in-app guidance simpler than general nav:
   - Leaflet map (already in the stack) with the route polyline, current
     position via `watchPosition`, wake-lock, and big-type maneuver banner
     ("Exit 27 in 0.8 mi → Brainard Rd").
   - Voice prompts via the Web Speech API at distance thresholds.
   - **Off-route detection is a compliance feature:** if GPS position leaves
     the route corridor (~50 m), alarm immediately and guide the driver back
     to rejoin at the nearest *forward* point on the permitted path. Never
     silently reroute onto unpermitted roads.
   - Restriction awareness from Stage A: warn when approaching sunset
     (daylight-only permits), weekends, etc.
2. **Export.** GPX route + track export for dedicated truck nav devices/apps
   that accept imported routes. (A Google Maps deep link cannot be trusted
   here — waypoint limits and its own rerouting make it non-compliant — but
   can be offered with a warning for preview purposes.)

---

## Data model (Prisma)

```prisma
model Permit {
  id              String   @id @default(cuid())
  permitNumber    String
  issuingState    String            // "CT"
  carrier         String?
  usdotNumber     String?
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  loadDescription String?
  dimensions      Json?             // L/W/H, overhangs, axles, weights, spacings
  restrictions    Json?             // typed list + verbatim
  sourceFiles     Json              // S3 keys, page count, mime types
  rawExtraction   Json              // full LLM output incl. confidences
  status          PermitStatus      // uploaded|extracted|parsed|routed|verified|failed
  route           PermitRoute?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PermitRoute {
  id                  String  @id @default(cuid())
  permitId            String  @unique
  permit              Permit  @relation(fields: [permitId], references: [id])
  originText          String            // "NY LINE"
  destinationText     String            // "HARTFORD"
  authorizedRouteText String            // verbatim from permit
  segments            Json              // parsed token list (Stage B)
  waypoints           Json              // ordered geolocated junctions (Stage C)
  polyline            String?           // encoded; GeoJSON derivable
  maneuvers           Json?             // turn-by-turn actions (Stage D)
  distanceMiles       Float?
  durationMinutes     Float?
  verification        Json?             // per-segment match report
  reviewedBy          String?           // human sign-off before navigation
  reviewedAt          DateTime?
}
```

---

## API surface

| Endpoint | Purpose |
|---|---|
| `POST /api/permits/upload` | store file(s), create Permit, enqueue extraction |
| `GET  /api/permits/:id` | permit + route + pipeline status (client polls) |
| `POST /api/permits/:id/extract` | (re)run Stage A |
| `POST /api/permits/:id/route/build` | run Stages B–D |
| `PUT  /api/permits/:id/route` | save human corrections (edited tokens / dragged waypoints), trigger rebuild |
| `POST /api/permits/:id/route/approve` | reviewer sign-off; unlocks navigation |
| `GET  /api/permits/:id/route/gpx` | GPX export |

---

## Human review UI (non-negotiable for a compliance product)

A permit review screen showing, side by side:

- The document image with the route block highlighted.
- Extracted fields with confidence badges; low-confidence fields editable.
- The parsed token chain rendered as chips (`I-84 E → I-691 E → I-91 N →
  Exit 27 → Brainard Rd → …`) — editable/reorderable.
- The map with the built route, each segment colored by verification status;
  waypoints draggable (drag snaps to nearest road node and triggers rebuild).
- An **Approve** action that locks the route for navigation.

Automated extraction is never trusted blind: a wrong turn on an OS/OW load is
a legal violation and a safety issue. The pipeline's job is to make review
take 30 seconds, not to remove it.

---

## Edge cases to design for

- **Return trips** (permit 2 is "with oversize return"): generate the reverse
  route as a second navigable route; reverse ≠ mirrored (one-ways, divided
  highways, exits differ). Parse the return authorization separately.
- **State-line origins/destinations** (`NY LINE`) — border-crossing point of
  the first/last highway.
- **Origin given as bare address** (`850 HARTFORD TURNPIKE` with town only in
  `Trip Origin: WATERFORD`) — geocode with town context.
- **CT exit renumbering** — maintain old→new exit crosswalk keyed by highway.
- **Ambiguous numeric refs** (I- vs US- vs CT-) — registry + connectivity.
- **Hyphenated street names** vs `-` separators — LLM parse + validator.
- **Multi-photo uploads**, glare/skew, cropped edges — per-field confidence
  and review flags rather than hard failures.
- **Map data disagrees with permit** (router says road is truck-restricted) —
  surface loudly; the permit overrides the map, but the driver should know.

---

## Phasing

**Phase 1 — Extraction & review (CT format).**
Upload endpoint + S3 storage; PDF→image; Claude structured extraction;
Prisma models + migrations; permit list/detail UI with document-vs-fields
review. *Exit criterion: both sample permits extract with every field
correct.*

**Phase 2 — Route parsing & geolocation.**
Token grammar + LLM parse + validator; OSM/Overpass junction resolver; HERE
geocoding integration; waypoint chain on the map; token-chip editor.
*Exit criterion: both sample routes produce correct waypoint chains without
manual fixes.*

**Phase 3 — Constrained route building.**
Via-waypoint routing + verify-and-densify loop; map-matching fallback;
verification report UI; approval flow; GPX export.
*Exit criterion: built polylines traverse exactly the permitted roads
(hand-verified against the two samples + a held-out set).*

**Phase 4 — Navigation.**
In-app turn-by-turn (position tracking, maneuver banners, voice, wake-lock);
off-route alerting with rejoin guidance; restriction warnings (daylight/M-F).

**Phase 5 — Generalization.**
Additional state permit formats (extraction prompt + grammar variants per
state), multi-page permits, batch upload, route history.

---

## Testing strategy

- **Golden corpus:** real permit PDFs/photos (start with these two, grow per
  state). Snapshot tests: document → expected extraction JSON → expected
  token list → expected waypoint chain.
- **Parser unit tests** on route strings (pure function, cheap, run in CI).
- **Route verification harness:** compare built polylines against
  hand-traced reference GeoJSON (Hausdorff distance < threshold).
- **Live-API tests** behind a flag (HERE + Overpass are external).

## Dependencies / keys

- `HERE_MAPS_API_KEY` (already used) — geocoding, truck routing, spans,
  route matching.
- `ANTHROPIC_API_KEY` — vision extraction + route-string parsing
  (structured outputs).
- Overpass API (free; self-host or rate-limit + cache OSM responses —
  junction lookups are highly cacheable per road pair).
- S3 credentials for document storage.
