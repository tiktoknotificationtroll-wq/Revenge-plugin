# BadgeForge

BadgeForge is a local-only profile showcase plugin for Revenge.

## Features

- Add custom cosmetic badges to profile badge rows.
- Display a fictional account creation date as a profile badge.
- Display game names and mock playtime as profile badges.
- Edit all values in the plugin's settings page.
- Persist settings on the device with Revenge JSON storage.

All values are local cosmetics. They do not modify Discord account data, grant official Discord badges, change real account creation dates, or publish game activity to other users.

## Install

The packaged plugin ZIP is published by the GitHub Actions release workflow to the `gh-pages` pool. After the release workflow succeeds, add this repository URL in Revenge:

`https://tiktoknotificationtroll-wq.github.io/Revenge-plugin/`

You can also sideload the generated `dev.nichegames.badgeforge@<version>.zip` from the repository's Actions artifact or published pool.

## Build

```sh
bun install
./gradlew packageBadgeforge
```

The installable ZIP is written to `build/dist/`.
