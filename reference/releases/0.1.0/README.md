# Daneo 0.1.0 — release candidate

Prepared 2026-10-11. **Not published; clean-install closeout remains open.** These notes describe the staged installers
from source `15a87661e7df634d9d4644af395e132d659d11ad`, built by successful
[CI run 38158221011](https://github.com/nwilliams22/daneo/actions/runs/38158221011).
A later documentation commit does not change these binaries. A release must use
these exact files; rebuilding or signing requires new checksums and acceptance.

## What you get

Daneo is a word-first Korean learning app with 164 modules, five drill areas,
spaced review, a literal-versus-real meaning deck, progress statistics and local
backup/restore. It costs nothing to use: no account, API key or subscription.
Progress stays in this computer's local app storage. Export a backup in Settings
before moving computers or removing app data; there is no server backup or sync.

**The AI translator and tutor are not in this release. There is no model download
and no model is bundled.** Explore explains this and retains saved discoveries.
Earlier plans for a one-time model download do not describe release 0.1.0.
The production frontend excludes AI controls and the development cloud adapter.
Daneo does not upload learner data or contact a Daneo service. The exercised Linux
features worked offline with zero Internet connections in recorded traces.
This is not a claim that the operating system makes no connections: installer
prerequisites and platform security checks can use the network, as noted below.

## Choose the right file

| Platform | File | Exact bytes |
| --- | --- | ---: |
| Linux x86-64 AppImage | `daneo_0.1.0_amd64.AppImage` | 114461176 |
| Linux x86-64 RPM | `daneo-0.1.0-1.x86_64.rpm` | 36988039 |
| Windows x64 NSIS installer | `daneo_0.1.0_x64-setup.exe` | 33831896 |
| macOS Apple Silicon | `daneo_0.1.0_aarch64.dmg` | 36867326 |

There is no Intel Mac or Windows ARM installer in this set. The macOS bundle
configures a minimum system version of 11.0; that is not runtime acceptance.
Linux AppImage was built on Ubuntu 22.04/glibc 2.35 and checked for that baseline.
The RPM was built on Ubuntu 24.04 and does not inherit the AppImage baseline.

## Verify before opening

Get `SHA256SUMS` from the same trusted repository revision as these notes.
A matching checksum detects changed bytes; it is **not** a publisher signature
or proof that a file is safe. If the hash differs, do not run the file.

In the directory containing your downloaded file:

- Linux: `sha256sum daneo_0.1.0_amd64.AppImage` (or the RPM filename).
- macOS: `shasum -a 256 daneo_0.1.0_aarch64.dmg`.
- Windows PowerShell: `Get-FileHash .\daneo_0.1.0_x64-setup.exe -Algorithm SHA256`.

Compare all 64 hexadecimal characters with that filename's entry in
[SHA256SUMS](SHA256SUMS). Windows may display uppercase; letter case is immaterial.
With all four files present on Linux, `sha256sum -c SHA256SUMS` must print four OKs.

## Installation and security warnings

These installers have **no verified publisher signing certificate**; the Mac app
has no Developer ID signing/notarization. Platform warnings are real trust
warnings. Proceed only if you trust the source and verified the checksum.
The Windows and macOS instructions below follow vendor guidance; they have not
been exercised on those operating systems for these artifacts.

### Linux

For the AppImage, run `chmod +x daneo_0.1.0_amd64.AppImage`, then
`./daneo_0.1.0_amd64.AppImage`. It needs a desktop session, working FUSE support
and host graphics libraries. Ordinary FUSE launch reached onboarding on Ubuntu
22.04.5 using software rendering. The tested host included `libfuse2`, `fuse3`,
`libegl1`, `libgbm1`, `libgl1`, `libharfbuzz0b` and `dbus-x11`; installing missing
system packages can require network access. Physical GPU rendering is unverified.

On an RPM-based distribution, use its package manager to install the local RPM
(for example `sudo dnf install ./daneo-0.1.0-1.x86_64.rpm`). Dependencies and package
trust policy can prevent installation. Actual RPM installation has not been
verified; no distribution-wide compatibility claim is made.

### Windows

Windows needs Microsoft Edge WebView2. This installer uses Tauri's default
WebView2 bootstrapper behavior: if the runtime is missing, setup can download it.
An offline install therefore requires WebView2 already present. This prerequisite
is not a model download. See [Tauri's Windows installer documentation](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options).

Open the verified `.exe`. SmartScreen can display **Windows protected your PC**
with an unrecognized-app warning. Select **More info**, check that the app is the
expected installer (the publisher is unverified), then select **Run anyway** if
you choose to proceed. Follow the setup prompts. An elevation prompt, if shown,
can also identify the publisher as unknown.

If Run anyway is unavailable, stop: managed policy or Windows Smart App Control
can block unsigned software. Do not disable system protection to force it.
Signing would establish a publisher identity but would not guarantee removal of
SmartScreen warnings for a new download. See [Microsoft's SmartScreen guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

### macOS

Open the verified `.dmg`, copy `daneo.app` to Applications and try to open it.
Gatekeeper may say the developer cannot be verified or Apple cannot check the app
for malicious software. Daneo has not been notarized by Apple.

After that attempt, open **System Settings → Privacy & Security**, scroll to the
security warning for Daneo and select **Open Anyway**. Confirm **Open** in the
next warning; authenticate if requested. This adds an exception for this app.
If policy prevents the exception, stop. A warning about damaged software or known
malware is not the unidentified-developer warning; do not bypass it using these
instructions. See [Apple's instructions and warning descriptions](https://support.apple.com/en-lamr/102445).

## What was verified

The Linux acceptance record covers onboarding, learned-word unlock, the exercised
drill paths, Review/Stats persistence and real backup export/fresh-profile restore.
All 164 module resources and content validation (16/16 tests) were checked; this
is not manual completion of every module. The earlier feature-test source and
this candidate have identical `src`, `src-tauri`, `package.json` and lockfile.
The replacement AppImage passed its own ordinary-launch and ELF portability checks:
171 ELF files, no requirements above GLIBC_2.35, no GNU2 TLS. Its measured SHA-256
matches the value in this directory.

Windows and macOS bundles passed CI build/resource checks, **not runtime tests**.
Korean speech (requires an available OS voice), physical GPU rendering and actual
RPM installation remain unverified. No new GUI test was run while preparing these
notes. Do not describe all three platforms as acceptance-tested.

### Closeout attempt, 2026-10-11

The staged manifest was rechecked: all four files returned `OK`. The exact
AppImage (SHA-256 `c7431957768557348535b185c5b67062fe165ad659355781f7ad4e197792adbd`)
was launched with empty learner storage and a cleared environment on the current
Ubuntu 24.04.5 runner. It exited 127 before opening a window:
`error while loading shared libraries: libharfbuzz.so.0: cannot open shared object file`.
This runner also has no desktop display or Xvfb; Docker access is denied.
This is an environment failure, not a new installation pass, and does not replace
the earlier Ubuntu 22.04 acceptance record.

A clean-environment module completion, drill and review session still need to be
recorded for the closeout, including Explore's AI-absence notice and absent tutor
controls. Windows and macOS remain unverified until their installers are used on
real machines. No curriculum gate changed in this documentation sweep.

## Reproduce the manifest / release operator record

Artifacts are staged locally at
`src-tauri/target/release-staging/38158221011/installers/` (ignored build storage,
not committed). Original CI resource reports and launch evidence are retained in
the parent staging directory. Downloads used:

```sh
gh run download 38158221011 --pattern 'daneo-*' --dir src-tauri/target/release-staging/38158221011
```

The four installer files were copied unchanged into `installers/`. From that
directory the manifest was produced with:

```sh
sha256sum daneo-0.1.0-1.x86_64.rpm daneo_0.1.0_aarch64.dmg daneo_0.1.0_amd64.AppImage daneo_0.1.0_x64-setup.exe > /srv/projects/daneo/reference/releases/0.1.0/SHA256SUMS
sha256sum -c /srv/projects/daneo/reference/releases/0.1.0/SHA256SUMS
```

The proposed release is `v0.1.0` at source commit `15a87661e7df634d9d4644af395e132d659d11ad`,
with these four files, this manifest and these notes. Tagging and publication
require a separate approval. No tag, release or public download has been created
by this preparation. Optional signing costs are recorded in the release task;
choosing signing would change the bytes and require replacing this manifest.
