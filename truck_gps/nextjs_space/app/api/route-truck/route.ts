
import { NextRequest, NextResponse } from 'next/server';
import type { RouteRequest, RouteResult, RoutePoint, RouteInstruction } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request?.json?.();

    const { origin, destination, truckSpecs } = body ?? {};

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HERE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HERE Maps API key not configured' },
        { status: 500 }
      );
    }

    // First, geocode the origin and destination
    const originCoords = await geocodeAddress(origin, apiKey);
    const destCoords = await geocodeAddress(destination, apiKey);

    if (!originCoords || !destCoords) {
      return NextResponse.json(
        { error: 'Could not geocode addresses. Please check your inputs.' },
        { status: 400 }
      );
    }

    // Convert truck specs to HERE Maps format
    const heightMeters = (
      ((truckSpecs?.heightFeet ?? 0) * 12 + (truckSpecs?.heightInches ?? 0)) * 0.0254
    );
    const weightKg = (truckSpecs?.weightPounds ?? 0) * 0.453592;
    const lengthMeters = (truckSpecs?.lengthFeet ?? 0) * 0.3048;

    // Build HERE Maps routing URL
    const routingUrl = new URL('https://router.hereapi.com/v8/routes');
    
    routingUrl.searchParams.append('transportMode', 'truck');
    routingUrl.searchParams.append('origin', `${originCoords?.lat ?? 0},${originCoords?.lng ?? 0}`);
    routingUrl.searchParams.append('destination', `${destCoords?.lat ?? 0},${destCoords?.lng ?? 0}`);
    routingUrl.searchParams.append('return', 'polyline,summary,actions,instructions');
    routingUrl.searchParams.append('apiKey', apiKey);

    // Add truck dimensions
    if (heightMeters > 0) {
      routingUrl.searchParams.append('vehicle[height]', heightMeters?.toFixed?.(2) ?? '0');
    }
    if (weightKg > 0) {
      routingUrl.searchParams.append('vehicle[grossWeight]', weightKg?.toFixed?.(0) ?? '0');
    }
    if (lengthMeters > 0) {
      routingUrl.searchParams.append('vehicle[length]', lengthMeters?.toFixed?.(2) ?? '0');
    }

    // Add hazmat if not none
    if (truckSpecs?.hazmatClass && truckSpecs?.hazmatClass !== 'none') {
      routingUrl.searchParams.append('vehicle[shippedHazardousGoods]', truckSpecs?.hazmatClass ?? '');
    }

    // Make routing request
    const routingResponse = await fetch(routingUrl?.toString?.() ?? '', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!routingResponse?.ok) {
      const errorText = await routingResponse?.text?.();
      console.error('HERE Maps routing error:', errorText);
      return NextResponse.json(
        { error: 'Routing service error. Please verify your addresses and truck specifications.' },
        { status: 500 }
      );
    }

    const routingData = await routingResponse?.json?.();

    // Parse the response
    const route = routingData?.routes?.[0];
    if (!route) {
      return NextResponse.json(
        { error: 'No route found for the given parameters' },
        { status: 404 }
      );
    }

    const section = route?.sections?.[0];
    const summary = section?.summary;

    // Decode polyline
    const polyline = decodePolyline(section?.polyline ?? '');

    // Parse instructions
    const instructions: RouteInstruction[] = (section?.actions ?? [])?.map?.((action: any) => ({
      instruction: action?.instruction ?? '',
      distance: action?.length ?? 0,
      duration: action?.duration ?? 0,
    })) ?? [];

    const result: RouteResult = {
      distance: ((summary?.length ?? 0) / 1609.34), // Convert meters to miles
      duration: ((summary?.duration ?? 0) / 60), // Convert seconds to minutes
      polyline: polyline ?? [],
      instructions: instructions ?? [],
      summary: `${((summary?.length ?? 0) / 1609.34)?.toFixed?.(1) ?? 0} miles in ${Math.round((summary?.duration ?? 0) / 60)} minutes`,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

// Geocode an address using HERE Geocoding API
async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const geocodeUrl = new URL('https://geocode.search.hereapi.com/v1/geocode');
    geocodeUrl.searchParams.append('q', address);
    geocodeUrl.searchParams.append('apiKey', apiKey);

    const response = await fetch(geocodeUrl?.toString?.() ?? '');
    if (!response?.ok) return null;

    const data = await response?.json?.();
    const position = data?.items?.[0]?.position;

    if (!position) return null;

    return {
      lat: position?.lat ?? 0,
      lng: position?.lng ?? 0,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Decode HERE Maps flexible polyline
function decodePolyline(encoded: string): RoutePoint[] {
  if (!encoded) return [];

  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded?.length) {
    let result = 0;
    let shift = 0;
    let byte;

    // Decode latitude
    do {
      byte = encoded?.charCodeAt?.(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    result = 0;
    shift = 0;

    // Decode longitude
    do {
      byte = encoded?.charCodeAt?.(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    points?.push?.({
      lat: lat / 100000,
      lng: lng / 100000,
    });
  }

  return points;
}
