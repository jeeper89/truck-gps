#!/usr/bin/env bash
# Project SessionStart hook.
#
# Two of the installed skills cannot rely on description matching alone:
#   - superpowers      : upstream ships this injection in its plugin hook
#   - task-observer    : its SKILL.md asks for a session-start hook by name
#
# Adapted from obra/superpowers hooks/session-start to resolve paths from the
# project checkout instead of CLAUDE_PLUGIN_ROOT, since these are installed as
# project skills under .claude/skills/ rather than as a plugin.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SKILLS_DIR="${PROJECT_ROOT}/.claude/skills"

using_superpowers_content=$(cat "${SKILLS_DIR}/using-superpowers/SKILL.md" 2>/dev/null || echo "Error reading using-superpowers skill")

# Escape for JSON embedding. Each ${s//old/new} is a single C-level pass.
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

using_superpowers_escaped=$(escape_for_json "$using_superpowers_content")

observer_notice=$(escape_for_json "This project has the 'task-observer' skill installed. If this session is task-oriented — you are about to use tools to produce deliverables — invoke it via the Skill tool before starting. Its observation log lives at ${PROJECT_ROOT}/skill-observations/log.md, which is committed to the repo so it survives ephemeral checkouts.")

session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n---\n\n${observer_notice}\n</EXTREMELY_IMPORTANT>"

# Claude Code reads hookSpecificOutput.additionalContext; other harnesses read
# additional_context / additionalContext. Emit only the field this one consumes.
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context" | cat
elif [ -n "${COPILOT_CLI:-}" ]; then
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context" | cat
else
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context" | cat
fi

exit 0
