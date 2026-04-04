# Migration Strategy: Community-Hosted to Self-Hosted

## Background

Share Space was originally designed around a community-hosted backend at `share.webosarchive.org`. That service ran for several years but became costly and risky to maintain long-term. The 2.0.0 release shifts the model to self-hosted only — the community server will shut down in 2026. This document captures the strategy, decisions, and lessons learned from that transition.

---

## Goals

- Make self-hosting accessible to hobbyists (Raspberry Pi, basic Docker knowledge)
- Keep the app usable on the community server through shutdown so users can migrate their content
- Warn users clearly about the shutdown without blocking them
- Avoid breaking existing clients or requiring manual settings migration

---

## What Changed in 2.0.0

### Backend (`sharing-service`)
- Added Docker support: `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`
- Entrypoint generates random credentials on first run, prints them to logs, persists to `data/.credentials`
- Added `config.php` options: `allow_new_users`, `site_name`, `welcome_message`
- `index.php` detects the community hostname and shows deprecation messaging; self-hosted instances show configurable branding
- Added `ping.php` for unauthenticated health checks (used by the app's Test Connection button)
- Added Cloudflare Tunnel compose file (`docker-compose.cloudflare.yml`) for internet access without port forwarding

### Frontend (`webos-sharespace`)
- Version bumped to 2.0.0
- `ForceHTTP` setting inverted and renamed to `ForceHTTPS` (HTTP is now default; HTTPS opt-in)
- Server settings moved to top of Preferences with a dedicated drawer for self-hosting options
- Added Test Connection button in Preferences (pings `ping.php`)
- Added endpoint status line in Preferences showing which server is in use
- Added deprecation banner on main screen (community server users only, dismissable per session)
- `newuser-assistant.js` now shows a friendly error when account creation is disabled on the server
- Settings migration cleans up the old `ForceHTTP` key and backfills any new defaults

---

## Key Decisions

### HTTP as default, not HTTPS
Hobbyists running on a LAN (Raspberry Pi at `raspberrypi.local`) don't have TLS certificates. Defaulting to HTTPS would break the most common self-hosting setup. `ForceHTTPS` is available as an opt-in for users running through a reverse proxy or Cloudflare Tunnel.

This also required inverting the old `ForceHTTP` boolean — old saved settings with `ForceHTTP: true` would behave incorrectly if naively renamed. The settings migration deletes the old key entirely and defaults the new one to `false`.

### No forced setup screen
An early approach routed first-time users (no username, no custom endpoint) to a setup wizard scene. This broke community server users who had logged out — they were sent to setup instead of being allowed to log back in. The setup scene was removed from the launch path entirely. The deprecation banner and welcome prompt message carry the informational load instead.

### Dismissable banner resets each launch
The banner dismiss was initially persisted to settings (keyed by app version), intended to re-appear on the next app update. This was changed: the dismiss state is now stored in memory only (`appModel.DeprecationDismissed`), so the banner returns on every app launch. For a time-limited deprecation window, per-launch visibility is more appropriate than per-version visibility — users should be reminded regularly, not just once per release.

### No migration tooling
The service stores files by GUID. There is no practical way to migrate content between servers automatically from the client side. The strategy is to document the shutdown timeline clearly and encourage users to re-share content on their own server. The deprecation banner links to Preferences so users can configure their own endpoint.

### `allow_new_users` is opt-out, not opt-in
The config flag defaults to `true` (permissive) when absent. All three enforcement points — the API (`new-user.php`), the web agreement page (`web-agreement.php`), and the web form (`web-new-user.php`) — use `isset($config['allow_new_users']) && $config['allow_new_users'] === false`. This means existing `config.php` files without the key continue to allow registration, and the community server can block new accounts without requiring client changes.

---

## Settings Migration Pattern

When loading saved settings from the cookie, the app runs a migration step before using them:

1. Delete any keys that have been renamed or removed (e.g., `ForceHTTP`)
2. Backfill any new keys that are missing with their defaults

This is done in `AppModel.prototype.loadCookieIntoCurrent` in `app-model.js`. Any new persistent setting added in the future should have a default in `AppSettingsDefaults` — the backfill loop handles the rest automatically.

---

## webOS-Specific Constraints

- **No ES6**: All JavaScript must be ES5. No `const`, `let`, arrow functions, template literals, destructuring, or `class` syntax. Use `var`, `.bind(this)`, and `prototype`-based OOP throughout.
- **No modern CSS**: CSS2.1 only. No flexbox, grid, CSS variables, `border-radius`, `transform`, or media queries.
- **`sources.json` is critical**: Every scene assistant file must have an entry in `sources.json`. Missing entries do not produce a build error but cause the scene to be absent from the packaged `.ipk`, crashing the app on device when that scene is pushed.
- **Duplicate prototype methods silently overwrite**: JavaScript allows redefining `Foo.prototype.method` without error. The second definition wins. This caused a bug where a duplicate `activate` method in `setup-assistant.js` made the first one unreachable. Always grep for duplicate prototype assignments when debugging unexpected scene behavior.

---

## Credential Precedence in `docker-entrypoint.sh`

The entrypoint supports three credential sources, in priority order:
1. Explicit environment variable (e.g., `CLIENT_ID=myid docker compose up`)
2. Persisted credentials file (`data/.credentials`, generated on first run)
3. Randomly generated value (first run only)

A subtle bug: if env vars are captured after sourcing the credentials file, the file silently overrides them. The fix is to save the env var values to temporaries before sourcing the file, then restore them if non-empty:

```bash
_ENV_CLIENT_ID="$CLIENT_ID"
source data/.credentials
if [ -n "$_ENV_CLIENT_ID" ]; then CLIENT_ID="$_ENV_CLIENT_ID"; fi
```

---

## Files Added or Significantly Changed

| File | Change |
|------|--------|
| `appinfo.json` | Version 2.0.0, updated startup message |
| `sources.json` | Added setup scene entry |
| `app/models/app-model.js` | Added `ForceHTTPS`, `DeprecationDismissed`; removed `ForceHTTP`, `DeprecationNoticedVersion`; added migration logic |
| `app/models/shareservice-model.js` | `ForceHTTP` → `ForceHTTPS`, inverted URL rewrite logic |
| `app/assistants/app-assistant.js` | Removed forced setup-screen routing |
| `app/assistants/main-assistant.js` | Added deprecation banner, updated welcome prompt |
| `app/assistants/preferences-assistant.js` | Server section rewrite, Test Connection, endpoint status |
| `app/assistants/newuser-assistant.js` | Graceful handling of `allow_new_users` error |
| `app/assistants/download-assistant.js` | `ForceHTTP` → `ForceHTTPS` |
| `app/assistants/setup-assistant.js` | New (accessible but not forced on launch) |
| `app/views/setup/setup-scene.html` | New |
| `app/views/main/main-scene.html` | Added deprecation banner div |
| `app/views/preferences/preferences-scene.html` | Server section rewrite |
