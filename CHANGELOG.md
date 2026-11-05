# Changelog

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
