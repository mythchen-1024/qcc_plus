#!/bin/bash
set -e

echo "=== qcc_plus Entrypoint ==="

if command -v claude >/dev/null 2>&1; then
    if version=$(claude --version 2>&1); then
        echo "✓ Claude Code CLI detected: ${version}"
    else
        echo "✗ Claude Code CLI found but failed to report version"
    fi
else
    echo "✗ Claude Code CLI not found; CLI health check will be unavailable"
fi

echo "=== Starting ccproxy ==="
echo

exec /usr/local/bin/ccproxy "$@"
