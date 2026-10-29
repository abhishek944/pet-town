# Optional Pet Town download

## User flow

The Mac app starts with **Pet Street** and Settings. Godot and the 3D world are not
inside the host installer. **Settings → App → Download Pet Town** installs the
optional world for the current app version and Mac architecture. It remains part
of the same app experience, not a separate application to install or manage.
The overall host bundle is still **Pet Town.app** with its existing identifier.

Opening Settings only checks local installation state. Downloading begins after
an explicit button click and reports progress, cancellation and retry. Installation
is immediate, independent of preference drafts and Apply. Close the running world
before replacing or removing its download. Removal keeps the native user directory,
world/care data, battle history, photos and host preferences. No saved-game migration
or native/browser save conversion is performed.

Application, menu-bar/tray and desktop Dock Town actions are absent until a usable
component is installed. Successful installation/removal refreshes menus without a
restart. Launch commands, including `--open-town`, use the same native resolver;
they do not bypass installation checks or silently download missing files.
Onboarding's **Explore Pet Street first** works without Town, and its tips contain
no Town launch promotion. Settings is the optional component's discovery surface.

Pet Town remains a separately launched internal Godot process, using the existing
host-owned authenticated bridge. Installing it does not run it or change Dock
ownership. Pet Street's hide/return behavior and the focus helper remain unchanged;
see [pet focus](pet-focus.md).

## Compatibility and updates

The initial contract binds Town to the **exact host release version** and native
architecture. This avoids sending incompatible agent/terminal/voice messages across
the bridge. A host update never fetches Town. After updating the app, Settings may
show **Update Pet Town** for the matching download; saved worlds remain untouched.
This intentionally favors a small explicit contract over independent engine updates
or protocol negotiation. Old release URLs remain pinned, not resolved through latest.

Host replacement and component mutation share native admission guards. A host
update cannot interrupt an installation/removal, and component operations cannot
start while host installation prepares. A running Town must close before its files
are removed/replaced. The existing host-update save/close handshake still applies.

## Release artifact contract

CI builds the ordinary host DMG/updater archives and optional world archives for
Apple Silicon and Intel. There is no Town-specific DMG or public second-app flow.
The host's resource allowlist excludes Godot even if stale assets remain staged.
The separate private Node/Pi voice runtime is not changed by this split.

The release-pinned `town-component.json` describes both `darwin-aarch64` and
`darwin-x86_64` with version, exact asset URL, compressed size, SHA-256 and the
Tauri/minisign archive signature. Assets are named
`Pet-Town-World-macOS-Apple-Silicon.tar.gz` and
`Pet-Town-World-macOS-Intel.tar.gz`, with `.sig` companions. The archive contains
`Pet Town.app` and a signed embedded `town-component.json` binding product version,
architecture and `dev.pet.town.native`. The Godot engine version is not used as
the component's product version.

The native app is Developer-ID signed, notarized and stapled independently before
archiving. The final compressed archive is signed with the existing updater key.
The installer verifies the trusted signature, metadata, expected executable/world,
architecture and signing identity before publishing staged files in user app data,
outside the signed host bundle. Archives cannot escape the staging directory or
install links/special files. Installation failures leave no newly usable component.

Owners:

- `src-tauri/src/town_install/`: scoped Settings commands, status, download,
  verification, local resolution and installation/removal.
- `src-tauri/src/godot_bridge/`: existing process, bridge and focus lifecycle.
- `src-tauri/src/app_menu.rs`, `dock_menu.rs`: availability-based menu presentation.
- `src/settings-town-install*.ts`: Settings state/progress/actions.
- `scripts/package-town-component.sh`, `town-component-archive.py`,
  `create-update-manifest.mjs`, `.github/workflows/release.yml`: delivery contract.

Desktop paths above are relative to `apps/pet-town/`. Development retains the
repository project's existing branded runtime path rather than requiring a released
download. See [development](development.md).

## User-owned release verification

Source checks and builds do not establish installed-app or Gatekeeper behavior.
Before publishing a release, verify on disposable Apple Silicon and Intel accounts:

1. Inspect the host DMG for absence of Godot/world data and compare compressed and
   installed sizes against a comparable combined build. Do not present local staged
   resource sizes as measured DMG savings.
2. Launch Street offline. Settings, onboarding skip and companions work; no Town
   actions appear outside Settings, and no Town download or engine starts.
3. Download from Settings. Check progress/cancel/retry, interruption, unavailable
   release, insufficient space and invalid signature/architecture handling. No partial
   download becomes launchable. Closing/reopening Settings reflects the native state.
4. After verified installation, all menus update immediately. Open/close/reopen Town
   through Settings, application menu, tray, Dock and CLI. Agent, terminal and voice
   connections retain their existing authentication and user permissions.
5. Close Town, remove the download, and reinstall. Menus hide/show immediately and
   the saved world, care, battle history, photos and settings survive.
6. Update the host with and without Town installed. Street-only stays Street-only;
   incompatible Town prompts for a matching download. Concurrent component and host
   replacement is rejected without partial publication or lost unsaved state.
7. Check macOS signing/notarization/first-open prompts on actual downloaded artifacts.
   Do not strip quarantine or bypass security prompts to claim success.
8. Check native Dock ownership, fullscreen Spaces, Street hide/return and direct
   pet-to-agent focus. Preserve the user-confirmed behavior in [pet focus](pet-focus.md).
