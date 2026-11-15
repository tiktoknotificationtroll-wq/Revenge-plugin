#!/usr/bin/env bash
# Shared helpers for pool workflows.

# Branch holding the pool and the index. Set the POOL_BRANCH repository variable to move it.
POOL_BRANCH="${POOL_BRANCH:-gh-pages}"
# Working copy of that branch.
POOL_CHECKOUT="${POOL_CHECKOUT:-published}"

# Prints the URL the pool is served from without a trailing slash.
pages_base_url() {
    if [ -n "${PAGES_BASE_URL:-}" ]; then
        printf '%s' "${PAGES_BASE_URL%/}"
        return
    fi

    local owner="${GITHUB_REPOSITORY%%/*}"
    local repo="${GITHUB_REPOSITORY#*/}"
    owner="${owner,,}"

    # User and organization sites serve from the domain root.
    # Serve directly from the public gh-pages branch, so GitHub Pages setup is not required.
    local base="https://raw.githubusercontent.com/${owner}/${repo}/${POOL_BRANCH}"

    printf '%s' "$base"
}

# Commits staged pool changes and pushes them. Skips if nothing is staged.
commit_pool() {
    if git -C "$POOL_CHECKOUT" diff --cached --quiet; then
        echo "$1"
        return 0
    fi

    git -C "$POOL_CHECKOUT" commit -m "$2"
    git -C "$POOL_CHECKOUT" push origin "$POOL_BRANCH"
}
