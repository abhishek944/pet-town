# Onboarding

**User goal:** Move Pet Town into Applications, understand its companions, choose scenery, prepare Herdr, and see a real agent become a desktop pet.

The installer has a 660×400 Finder background behind native app and Applications drag targets. The first-run welcome window has 880×688 content, approximately 880×720 including native chrome. Its eight screens are welcome, agent states, scenery, Herdr readiness, coding tool, first companion, tips, and optional Mayor.

## Entry and saved progress

Release builds launched outside `/Applications` or `~/Applications` show move-to-Applications guidance before dependency work. Debug builds allow development launch. Returning-user detection runs before preferences load; first-run admission is persisted before any onboarding scenery save. Existing preferences with no onboarding file identify a returning user and suppress automatic enrollment.

`~/.pet-town/onboarding.json` stores progress separately from preferences with private permissions and atomic replacement. Closing and reopening resumes the current screen. Explore-first and Continue later retain the skipped step for reopening through **Settings → General → Open setup**, the Pet Town menu, or **Help → Welcome & setup**. Help includes the tips within the welcome flow. Scenery previews do not save until Keep this look. Corrupt or unavailable progress is preserved and writes fail with recovery guidance.

## Herdr and tool readiness

Herdr checks distinguish a missing executable, supported launch capabilities, and a ready host. Existing unready installations get an Open Herdr/repair path; they are never overwritten. Only the explicit **Install Herdr** action downloads the official stable macOS asset for the current architecture, validates the official release URL, size and SHA-256, and installs without replacing an existing executable. It uses `~/.local/bin`, without sudo or shell-profile changes.

The six coding tool choices are Codex, Claude Code, Pi, OpenCode, Cursor and Factory Droid. Unsupported Herdr launch kinds are hidden. Executable discovery is separate from sign-in readiness. Supported read-only sign-in checks exist for Codex, Claude Code and Cursor. Pi, OpenCode and Droid currently have no reliable automated sign-in check here: their automatic sample is disabled, and the user can start an agent manually in Herdr. No global hooks, authentication imports or account creation happen in this flow.

## First real companion

Visiting Test never launches an agent. Explicit Test uses the selected ready tool, a unique private `~/.pet-town/onboarding-demo/<token>` folder, and one app-owned Herdr workspace. The fixed prompt asks for a one-sentence hello and prohibits file inspection, commands or additional agents. The screen discloses possible model usage before launch. Tool trust and approval prompts remain enabled.

Creation, launch and prompt attempts are persisted before their effects. Retrying validates the workspace, pane, session and original foreground process identity including its birth time. Uncertain outcomes fail closed instead of creating a second sample or resending a prompt. A prompt is sent only to an idle or done sample. Stop validates ownership before closing the workspace; it removes only an empty owned demo directory. User-added files remain. An uncertain resource can be managed manually in Herdr before clearing the saved attempt.

**Start my own agent** opens Herdr and observes new real broker records relative to a saved baseline. It does not create an agent. A previous sample remains separately available as Stop previous sample. Before either observation path, Pet Town makes Pet Street visible and asks the user to close Settings or leave an active Pet Town window when necessary.

Arrival needs a matching real session, working or done activity, and a recent visible-pet report from the actual desktop renderer. Process startup alone cannot produce success. Blocked means Needs your input, using the blocked artwork. Waiting, blocked and error states retain skip/recovery actions. Open in Herdr uses the existing validated pet focus helper; see [pet focus](pet-focus.md). Generic Herdr opening runs in a separate main-thread helper for macOS activation.

## Completion and access boundaries

Finish saves completion, reveals Pet Street and closes welcome. Optional Mayor setup opens the existing Settings flow; it does not enable voice, import a key, request the microphone or start Firstmate. A new detailed voice wizard remains deferred.

Privileged commands require the local onboarding window and exact local route. Only the trusted main renderer can acknowledge visible pet IDs. Public onboarding state contains safe labels, normalized states and opaque IDs; private sockets, pane routes, process output and folder paths stay native. Update installation and setup operations share admission guards to prevent interruption of active setup.

## Owning files

| Boundary                               | Files                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Installer                              | `apps/pet-town/src-tauri/dmg-background.html`, generated `.png`, existing DMG configuration                       |
| Native entry, persistence and commands | `apps/pet-town/src-tauri/src/onboarding/`, `app_commands.rs`, `lib.rs`, `main.rs`, `app_menu.rs`, `app_events.rs` |
| Scoped permissions                     | `src-tauri/permissions/onboarding.toml`, `capabilities/onboarding.json`, existing main/desktop capabilities       |
| Interface, recovery and previews       | `apps/pet-town/onboarding.html`, `src/onboarding/`, `public/onboarding/`, Vite input                              |
| Desktop presence and reentry           | `src/main.ts`, `settings.html`, `src/settings.ts`                                                                 |
| Update admission                       | `src-tauri/src/app_updates/install.rs`                                                                            |

## User-owned live acceptance checks

Static renderer captures, builds and source review do not establish installed-app behavior. Use a signed packaged build on a disposable macOS user profile for first-run cases. Preserve the current user's preferences.

1. Open the DMG: confirm native drag targets, copy into Applications, and launch. Launch from the mounted image first and confirm it offers move guidance without installing dependencies. Confirm ordinary macOS first-open behavior.
2. Advance welcome/states/scenery; test keyboard focus, text scaling, screen reader and reduced motion. Change scenery, close before committing, reopen, then Keep this look and confirm Pet Street changes.
3. Exercise missing Herdr, offline installation, verified successful installation, existing ready Herdr, and an installed but unready host. Confirm existing installations stay intact. Close/reopen during recovery and confirm progress survives.
4. Select installed/signed-in Codex, Claude or Cursor, then a missing or signed-out tool. Confirm setup/recheck guidance and no automatic paid task. For Pi/OpenCode/Droid use the explicit manual Herdr path.
5. Choose Test; complete any normal trust/approval prompt in Herdr. Confirm exactly one owned sample workspace, a real pet in Pet Street, truthful blocked/working/done transitions, and arrival only after visibility. Retry during a delayed/uncertain result and confirm no duplicate agent or prompt. Stop only the sample, preserving unrelated workspaces and any added demo files.
6. Start your own agent with an older sample still present. Confirm the new pet is observed, no sample retry targets it, and Stop previous sample affects only the older owned workspace. Exit Pet Town/close Settings as instructed and confirm Pet Street becomes visible.
7. Click Open in Herdr and the actual pet once. Confirm a direct transition to its exact existing pane, without an intermediate Pet Town/default-desktop jump. Preserve drag and context-menu behavior.
8. Use Continue later/Explore first, finish, restart, and reopen setup from Settings and Help. Confirm skipped work resumes and returning users retain their settings. Confirm an app update cannot install while setup is open or busy.
9. Open and dismiss the Mayor invitation; confirm no key import, microphone prompt, voice enable or Firstmate launch. Open Mayor Settings only when intentionally chosen.

Design evidence and captured implementation comparisons are in `var/onboarding/ui-ux-grill-me/2026-10-02-arrival/` and `var/onboarding/implement-details/visual/`.
