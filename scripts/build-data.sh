#!/usr/bin/env bash
# Snapshot the org's public repos into data/repos.json (fallback when the
# browser hits the GitHub API rate limit). Public + non-archived only (forks included).
set -euo pipefail

ORG="${ORG:-game-design-projects}"
OUT="${1:-data/repos.json}"
mkdir -p "$(dirname "$OUT")"

auth=()
[ -n "${GITHUB_TOKEN:-}" ] && auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")

raw="$(mktemp)"
trap 'rm -f "$raw"' EXIT
# type=public: private repos are never requested, so they cannot leak.
curl -fsS ${auth[@]+"${auth[@]}"} -H "Accept: application/vnd.github+json" \
  "https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&sort=pushed" > "$raw"

jq --arg org "$ORG" '{
  generated_at: (now | todate),
  repos: [ .[]
    | select(.private == false and .archived == false and .disabled == false)
    | select(.name != ".github" and .name != ($org + ".github.io"))
    | { name, description, html_url, homepage, language, topics, pushed_at, stargazers_count } ]
  | map({ name, description: (.description // ""), url: .html_url, homepage: (.homepage // ""),
          language: (.language // ""),
          topics: ((.topics // []) - ["itch-io","itch-io-game","itchio","game"]),
          pushed: .pushed_at, stars: .stargazers_count })
  | sort_by(.pushed) | reverse
}' "$raw" > "$OUT"

echo "[build-data] wrote $OUT ($(jq '.repos|length' "$OUT") repos)"
