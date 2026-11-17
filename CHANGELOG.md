# Changelog

## 0.7.0 — 2026-11-17

- Group transfers by user and album/folder, with per-group selection, progress, retry, cancel and confirmed list clearing. Group actions cover matching files across pagination.
- Add context menus to transfers and contacts, with peer browsing, user information, contacts and an explicit private-message composer.
- Restore search filters, sorting, pagination and scroll position; retain transfer filters/collapsed groups and per-user folder-tree and file-browser state in the browser session.
- Replace the default technical Options screen with a settings form for download directories, organization, transfer limits and shared folders. Shared folders can also be managed directly on the Shares tab.
- Preserve comments, credentials and unrelated YAML keys; validate on the server and detect concurrent edits before saving form changes.
- Keep the technical editor under Advanced configuration and correct its validation race.
- Align the System toolbar item with the other utility controls.

## 0.6.0 — 2026-11-17

- Add a keyboard-accessible search result context menu for downloads, browsing the exact containing folder, saving users and viewing user information.
- Support Ctrl/Cmd multi-selection and Shift range selection in search results.
- Add numeric/text column sorting and browser-persisted, mouse/keyboard column widths to search and browse tables.
- Keep remote folders and files in side-by-side panels on desktop, with a stacked layout on narrow screens.
- Keep browsed users in session tabs, preserving their folder and file selection while switching users.
- Preserve existing download paths, backend configuration and private imported contacts.

## 0.5.0 — 2026-11-17

- Return to a classic client workflow: horizontal primary tabs, a tab per search, compact result rows and compact download/upload tables. Saved-search tools are collapsed by default; large summary cards and per-folder action panels are removed from the transfer workflow.
- Select rows or checkboxes, download a selection, double-click a result to download it, or request and enqueue a complete remote folder. Locked results remain visible and cannot be queued by selection.
- Replace transfer action dropdowns with direct Retry selected, Cancel selected, Clear selected, Clear completed, Clear queue and Clear all commands. Actions immediately refresh the table and show request errors instead of swallowing them.
- Clear completed uses the backend bulk operation. Queue/all clearing verifies removal over a longer cancellation window, reports server failures and retains transfers added after confirmation. Disk files and storage configuration are unchanged.
- Fix error reporting when closing a search tab, suppress connection errors from intentional tab teardown, and open new result tabs without waiting for a live-update event. Use one Search button and request timeouts for transfers, results and remote folder requests.
- Regression tests cover actual enqueue arguments, complete-folder requests, filtered lists, immediate clearing and visible server errors. A disposable official-backend test also verified removal of completed, failed, queued and stuck-active records without a Soulseek login or production mounts.


## 0.4.0 — 2026-11-07

- Add Clear all at the top of Downloads, independent of filters and pagination.
- Confirmation shows the full record count and warns when queued or active downloads will be cancelled. Completed and partial files and storage paths are kept.
- Clear only the confirmed snapshot, preserving downloads added later. Requests use bounded concurrency and verify removal; unresolved records are reported instead of claiming success.
- Protect the refreshed list against stale polling responses and translate the new controls in all ten languages.


## 0.3.1 — 2026-11-05

- Replace the native language dropdown with a modal containing ten explicit language buttons. The picker stays open during pointer movement and parent updates; selecting the current language closes it without reloading.
- Stop the Search page from focusing its input during every render. Initial focus happens on mount; live search updates no longer steal focus from language selection or other controls.
- Add regression coverage for pointer movement, parent refreshes, live search updates, persisted selection and no-op selection.


## 0.3.0 — 2026-11-05

- Language selector on the sidebar and sign-in screen, with ten bundled catalogs: English, Simplified Mandarin Chinese, Hindi, Spanish, Arabic, French, Bengali, Brazilian Portuguese, Indonesian and Urdu.
- More than 330 interface messages localized across navigation, search, transfers, contacts, appearance, backups and system controls. User content and backend protocol values are preserved.
- Browser-local language persistence, locale-aware number/date display, right-to-left direction for Arabic and Urdu, and language preference backup/restore compatible with older backups.
- Translation catalogs are local assets, with English fallback for future messages and no translation service contacted at runtime. Initial machine-assisted translations include a Brazilian Portuguese terminology pass; community corrections are welcome.


## 0.2.0 — 2026-11-05

- Optional repeating saved searches: every 30 minutes, one hour or three hours, while the app is open and connected. Manual mode remains the default. In-app alerts link to completed results; no automatic downloads.
- Browser-local scheduling uses a cross-tab lease, records attempts before requests, applies request timeouts, and backs off after failures.
- Preferences backup and import: contacts, notes, saved searches, hidden sources, appearance and filter defaults. Imports are validated before writing, merge contacts and searches, retain existing notes and start newly imported searches in manual mode. Tokens, passwords and server configuration are excluded.
- Search result filters support quoted phrases and exclusions, for example `islossless "deluxe edition" -"live at"`.
- Minimum quality filters reject files with unknown required metadata. A minimum-files filter now clears both public and locked result counts correctly.
- Transfer usernames open profiles; a Browse files shortcut opens the peer's shared library from uploads or downloads.
- Network errors retain their original error instead of being masked by a missing response object.
- CI now runs the entire frontend test suite.

### Community requests consulted

- [Wishlist #957](https://github.com/slskd/slskd/issues/957) and [wishlist / user list #1611](https://github.com/slskd/slskd/issues/1611). This frontend implements browser-session scheduling; it is not an always-on server scheduler.
- [Upload hyperlinks #1652](https://github.com/slskd/slskd/issues/1652): implemented profile and peer-library shortcuts. Opening a specific shared folder directly is not included.

## 0.1.0

Initial public release: English UI, independent logo, four palettes, self-hosted fonts, contact browsing and notes, saved searches and filter defaults, source tools, and transfer filtering and pagination.

Requires the unmodified official slskd 0.26.2 backend. No personal contacts, credentials, media library or downloaded files are included.
