#!/usr/bin/env bash
# claude-mem installer — RUN THIS ON YOUR LOCAL MACHINE, not in a web session.
#
# claude-mem cannot be vendored into this repo the way the other skills were.
# It is a runtime system, not a document: it stores its knowledge graph in a
# SQLite DB at ~/.claude-mem, registers hooks in ~/.claude, and runs a
# background worker that compresses session transcripts.
#
# In Claude Code on the web the container is ephemeral and reclaimed after
# inactivity, so ~/.claude-mem is destroyed between sessions — which removes
# the only thing claude-mem exists to provide. Install it locally instead.
#
# Docs:   https://docs.claude-mem.ai/introduction
# Source: https://github.com/thedotmack/claude-mem  (Apache-2.0)

set -euo pipefail

echo "Installing claude-mem..."
echo
echo "Note: 'npm install -g claude-mem' installs the SDK only and does NOT"
echo "register the plugin hooks or the worker service. Use the installer."
echo

npx claude-mem install

echo
echo "Done. Restart Claude Code — prior-session context is injected automatically."
echo
echo "Alternative, from inside Claude Code:"
echo "  /plugin marketplace add thedotmack/claude-mem"
echo "  /plugin install claude-mem"
