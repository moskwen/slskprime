# slskprime

<p align="center"><img src="slskprime-logo.svg" alt="slskprime" width="520"></p>

<p align="center"><strong>Your music hunt, refined.</strong><br>A compact, customizable web interface for the Soulseek network.</p>

<p align="center">
  <a href="https://github.com/moskwen/slskprime/releases"><img src="https://img.shields.io/github/v/release/moskwen/slskprime?color=75d8b7&amp;label=release" alt="Latest release"></a>
  <a href="https://github.com/moskwen/slskprime/actions/workflows/ci.yml"><img src="https://github.com/moskwen/slskprime/actions/workflows/ci.yml/badge.svg" alt="Build and test"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3%20%2B%20Additional%20Terms-8899aa" alt="AGPLv3 with Additional Terms"></a>
</p>

<p align="center"><a href="https://github.com/moskwen/slskprime/releases/latest"><strong>Download</strong></a> · <a href="#existing-installation">Install on your server</a> · <a href="#new-docker-compose-installation">Docker Compose</a> · <a href="https://github.com/moskwen/slskprime/issues">Feedback &amp; ideas</a></p>

Find a rare album. Browse a collector's shared files. Keep your favorite sources close. slskprime brings those everyday Soulseek tasks into a clean web interface with smaller typography, useful filters and a choice of themes.

This is a modified version of slskd. It is not maintained by, endorsed by, or affiliated with the slskd project or its author(s).

slskprime is an independent frontend based on the slskd 0.26.2 web interface. It works with a separately installed, unmodified official backend. It does not implement a Soulseek network client or redistribute a modified backend.

## Features

| Area | What you get |
| --- | --- |
| **Make it yours** | Jade, Midnight, Plum and Paper themes; three text sizes; locally hosted Inter, Manrope and IBM Plex Sans, plus your system font. |
| **Find better sources** | Quality shortcuts, saved filter defaults, available-slot filtering and source ranking. |
| **Keep your people close** | Contact list, presence checks, direct browsing of shared files, personal notes and contact export. |
| **Download with less friction** | Visible folder-download actions, selection tools and a manual search for another source. |
| **Stay organized** | Saved searches, hidden sources, transfer filters, pagination and album progress. |
| **Run it yourself** | Prebuilt frontend download, checksummed installer with backup, and Docker Compose for a new installation. |

The interface is in English. Fonts are bundled with the app; no font service is contacted while you use it.

Contacts, notes, searches and preferences are browser-local. There is no scheduled wishlist or automatic source replacement. No personal contacts are included in the repository or releases.

## Choose your installation

| Your setup | Start here |
| --- | --- |
| You already run slskd | [Install the frontend](#existing-installation). Keep your existing backend, account, downloads and mounts. |
| You are starting fresh | [Use Docker Compose](#new-docker-compose-installation). Set your own paths and credentials. |
| You want to change the code | [Build and test locally](#build-and-test). Contributions and reproducible bug reports are welcome. |

## Existing installation

Download the prebuilt UI and checksum from [Releases](https://github.com/moskwen/slskprime/releases). If your backend already serves a custom UI directory, clone this repository and run:

```sh
sh scripts/install-ui.sh /absolute/path/to/existing/ui-directory v0.1.0
```

The installer verifies the checksum, backs up the UI directory and installs without deleting existing files. It preserves local installation contacts. It does not touch the container, credentials, downloads or shares. No restart is needed when the content path is unchanged.

For a first-time switch, extract the release into an empty `ui-slskprime` directory inside your application data directory. With application data mounted at `/app` in the official container, merge this into your existing YAML and restart once:

```yaml
web:
  content_path: ../app/ui-slskprime
```

Keep your authentication settings. Do not start another backend with the same Soulseek account. Roll back by restoring the UI backup or previous content path. Downloads are not migrated or deleted.

## New Docker Compose installation

Compose builds a one-shot frontend exporter, then starts the official, unmodified backend separately. The exporter exits after copying the UI into a volume. No modified backend image is published by this project.

```sh
git clone https://github.com/moskwen/slskprime.git
cd slskprime
git checkout v0.1.0
cp .env.example .env
mkdir -p appdata downloads/complete downloads/incomplete
```

Edit `.env`: set your web username, a strong web password, and your verified absolute `MEDIA_PATH`. Set `PUID` and `PGID` to your host user IDs. The created folders must be writable by that user. For LAN access, set `WEB_BIND_ADDRESS` to your server's LAN address; the default is localhost.

```sh
docker compose up -d --build
```

Open `http://YOUR_BIND_ADDRESS:5030`. Add your Soulseek credentials through **System → Options → Edit** in the private YAML:

```yaml
soulseek:
  username: your-soulseek-username
  password: your-soulseek-password
```

The web login and Soulseek account are separate. To share your mounted media directory, add the following to your private configuration and request a share scan:

```yaml
shares:
  directories:
    - '[MEDIA]/media'
```

Verify the directory contents before sharing them. Media is mounted read-only; completed and incomplete downloads use separate writable directories.

## Build and test

Requires Node.js 24 and pnpm 11.25.0. Docker uses the same toolchain.

```sh
cd web
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec semantic-ui-css-patch
CI=true pnpm exec craco test --watchAll=false --runInBand --runTestsByPath src/lib/appearance.test.js src/lib/studio.test.js src/lib/installationContacts.test.js src/components/StudioFavorites.test.jsx src/components/Search/Response.studio.test.jsx src/components/Transfers/TransferList.studio.test.jsx
DISABLE_ESLINT_PLUGIN=true GENERATE_SOURCEMAP=false pnpm run build
```

The inherited CRA ESLint webpack integration is disabled for production builds because its plugin configuration does not resolve reliably. Behavior tests run separately in CI. The upstream dependency stack is retained; validate compatibility before upgrading beyond backend 0.26.2.

Optional `installation-contacts.json` can contain a JSON array of usernames beside `index.html`. It seeds contacts when the browser has no saved list. It is a static asset, not a secret store; never put credentials in it. It is excluded from Git, Docker builds and releases.

## Questions

**Is slskprime an official Soulseek or slskd release?** No. It is an independently modified frontend, with its own branding and source repository.

**Does it replace the backend?** No. The official, unmodified slskd backend handles the Soulseek connection, authentication, file transfers and storage.

**Will installing the frontend move my downloads?** No. The existing-installation method updates web files only and creates a backup first. Keep your existing storage configuration.

**Can I share an idea or report a problem?** Yes. [Open an issue](https://github.com/moskwen/slskprime/issues/new/choose). Include the frontend and backend versions, steps to reproduce and the browser you used. Leave out passwords, tokens and private configuration.

## License and origin

Origin: [slskd 0.26.2 frontend](https://github.com/slskd/slskd/tree/0.26.2/src/web), JP Dillingham and contributors. Modifications: slskprime contributors, 2026.

Licensed under **AGPL-3.0-only with the upstream Additional Terms**, reproduced completely in [LICENSE](LICENSE). Retain license, attribution and modification notices. Font licenses are in `third-party-licenses/`. The interface links to its corresponding source. This is not an official Soulseek or slskd product, and neither project endorses it.
