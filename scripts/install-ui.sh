#!/bin/sh
# Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE.
set -eu
destination=${1:?Usage: install-ui.sh /absolute/existing/ui-directory [v0.3.1]}
version=${2:-v0.3.1}
case "$destination" in /*) ;; *) echo 'Use an absolute UI directory.' >&2; exit 1;; esac
[ "$destination" != / ] && [ -d "$destination" ] || { echo 'The existing UI directory is required.' >&2; exit 1; }
printf '%s\n' "$version" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' || { echo 'Use an explicit release tag, such as v0.3.1.' >&2; exit 1; }
temporary=$(mktemp -d)
trap 'rm -f "$temporary/slskprime-ui.tar.gz" "$temporary/SHA256SUMS"; rmdir "$temporary"' EXIT HUP INT TERM
base="https://github.com/moskwen/slskprime/releases/download/$version"
curl -fL --retry 3 "$base/slskprime-ui.tar.gz" -o "$temporary/slskprime-ui.tar.gz"
curl -fL --retry 3 "$base/SHA256SUMS" -o "$temporary/SHA256SUMS"
(cd "$temporary" && sha256sum -c SHA256SUMS)
if tar -tzf "$temporary/slskprime-ui.tar.gz" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo 'Unsafe archive paths; installation cancelled.' >&2; exit 1
fi
backup="${destination%/}.backup-$(date -u +%Y%m%dT%H%M%SZ)"
[ ! -e "$backup" ] || { echo 'Backup path already exists; retry later.' >&2; exit 1; }
cp -a "$destination" "$backup"
tar -xzf "$temporary/slskprime-ui.tar.gz" -C "$destination"
printf '%s\n' "$version" > "$destination/.slskprime-version"
printf 'Installed %s. Backup: %s\n' "$version" "$backup"
printf 'Keep your existing container, downloads and mounts. No restart is needed when the UI path is unchanged.\n'
