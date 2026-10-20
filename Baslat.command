#!/bin/zsh
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
PERFUZYON_NODE="$(command -v node)"
if [[ -z "$PERFUZYON_NODE" ]]; then
 PERFUZYON_NODE="/Users/kberkaybilgenn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
"$PERFUZYON_NODE" scripts/start.mjs
if [[ $? -ne 0 ]]; then
 read "?Kapatmak için Enter'a bas…"
fi
