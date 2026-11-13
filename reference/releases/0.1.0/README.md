# Daneo 0.1.0 — release candidate

Prepared 2026-10-11; acceptance updated 2026-10-20. **Not published; Linux clean-profile installer closeout passed.** These notes describe the staged installers
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

The Mac app is **unsigned** in the Apple sense: it carries only an ad-hoc
signature, with no Developer ID and no notarization, by owner decision of
2026-11-11. On first launch use **System Settings → Privacy & Security → Open
Anyway** as above. Since macOS 15, right-click → **Open** no longer bypasses
Gatekeeper, so that older shortcut will not work.

**Known defect in the staged 0.1.0 DMG.** The DMG in this manifest (and every
build before the fix for BAD-384) signs only the binary, not the `.app` bundle.
A browser-downloaded copy is therefore reported as **"daneo is damaged and can't
be opened"**, with no Open Anyway path. Builds from that fix onward ad-hoc sign the
whole bundle, and CI rejects a bundle that fails `codesign --verify --deep --strict`.
Shipping a fixed Mac build changes the DMG bytes, so it needs a new checksum and
its own acceptance; the staged files above are unchanged.

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
RPM installation remain unverified. The 2026-10-20 closeout below adds a GUI test of the exact AppImage. Do not describe all three platforms as acceptance-tested.

### Closeout attempt, 2026-10-11

The staged manifest was rechecked: all four files returned `OK`. The exact
AppImage (SHA-256 `c7431957768557348535b185c5b67062fe165ad659355781f7ad4e197792adbd`)
was launched with empty learner storage and a cleared environment on the current
Ubuntu 24.04.5 runner. It exited 127 before opening a window:
`error while loading shared libraries: libharfbuzz.so.0: cannot open shared object file`.
This runner also has no desktop display or Xvfb; Docker access is denied.
This is an environment failure, not a new installation pass, and does not replace
the earlier Ubuntu 22.04 acceptance record.

### Closeout pass, 2026-10-20

The same AppImage, SHA-256
`c7431957768557348535b185c5b67062fe165ad659355781f7ad4e197792adbd`,
now opens through ordinary FUSE launch on Ubuntu 24.04.5 with Xvfb and software
rendering. The host now has Xvfb, xdotool, libharfbuzz and EGL available. A new,
empty HOME and XDG config/data/cache profile supplied the clean learner
environment; this was not a newly installed operating system. No development
server, rebuilt binary, injected learner data or model was used.

Observed through screenshots and keyboard/mouse input:

- Brand-new onboarding and Module 1 opened normally. All 37 vocabulary boxes
  were checked through the UI; the module list showed 37/37.
- The first mixed module test finished at 8/17 (47%), with deliberately wrong
  choices exercising the missed-item path. Its nine misses appeared in Review.
- The confusables quiz accepted the correct `wae` answer for ㅙ.
- The nine-item daily review reached **Session Complete**, 3/9 correct; misses
  were rescheduled. This was a completed review flow, not a mastery claim.
- A second Module 1 test covered vocabulary, the on-screen Korean keyboard,
  sentence meanings and role labels: **17/17, 100%, passed**.
- After terminating and reopening the same AppImage with the same profile,
  onboarding stayed complete and Module 1 retained **37/37 and 100%**.
- Explore displayed **The AI translator and tutor are not in this release.**
  Navigation had no tutor; Settings had no model controls. Translation/tutor
  success is not claimed for this AI-off release.
- Settings reported speech synthesis unavailable on this host. GPU device
  access warnings occurred; software rendering still displayed the UI.

Linux AppImage end-to-end acceptance is now recorded. Windows x64, Apple Silicon
macOS and RPM installation remain **unverified**. Nick must run each matching
installer on a real machine for that platform, record its checksum, install
warnings and module/drill/review results before changing its verdict. Physical
GPU rendering and Korean speech remain unverified. The earlier offline tracing
record is preserved; this run did not repeat network tracing.

The six-document sweep is reconciled; CURRICULUM §4 is unchanged because no
curriculum gate changed. Tagging/publication still requires its separate approval.

## Owner platform verification — Windows x64, Apple Silicon macOS, RPM

Nick chose this work on 2026-10-22. The Windows x64, macOS Apple Silicon and RPM
runtime checks below use CI builds, not the hash-pinned 0.1.0 installers. The
Windows verdict was run on the shared Windows 11 test VM; the staged 0.1.0
installer remains untested.

### Step 0 — copy the files, do not rebuild

**The accepted installers exist on one machine.** CI kept artifacts for seven days
when this release was built, so run `38158221011`'s are deleted
(`gh api repos/nwilliams22/daneo/actions/runs/38158221011/artifacts` reports
`total_count: 0`) and there is nothing to download. Retention was raised to the
90-day maximum on 2026-10-24, but that applies to **later** builds only and does
not bring these bytes back — and a rebuild produces **different bytes**, which
voids `SHA256SUMS` in this directory *and* the 2026-10-20 Linux acceptance
recorded against those hashes. Copy, never rebuild.

On the build host the verified copies are in `.release-staging/0.1.0/`
(git-ignored) alongside their `SHA256SUMS`. Copy the whole directory to a USB
stick or a share, then on each target machine confirm the file's hash **before
installing it**:

| Platform | File | SHA-256 |
| --- | --- | --- |
| Windows x64 | `daneo_0.1.0_x64-setup.exe` | `9482e7895a28b0d0ee0387ce7e91ac76c58fc09bfcc2597fbf69a2836d23f032` |
| macOS Apple Silicon | `daneo_0.1.0_aarch64.dmg` | `c0207b092b118a6f37a21d2f143270da5349d018371ba75260b0902addc9ff03` |
| RPM Linux x86-64 | `daneo-0.1.0-1.x86_64.rpm` | `bf94b9079b1ebf62ff975bad0e563074a284dc1aced3a285b6a277c8848083f6` |

- Windows PowerShell: `Get-FileHash .\daneo_0.1.0_x64-setup.exe -Algorithm SHA256`
- macOS: `shasum -a 256 daneo_0.1.0_aarch64.dmg`
- RPM host: `sha256sum -c SHA256SUMS` (reports the files present)

**A hash that does not match is a stop, not a warning.** Do not install it and
say so on the ticket; it means the copy is damaged or is not this release.

### Step 1 — install, and expect a warning

The installers are **unsigned** — that is known and is not a fault in the build.
§*Installation and security warnings* above has the exact dialogs and the
click-through for each platform. Record what you actually saw; the wording is part
of the verdict, because it is what another person would meet.

Windows may need **WebView2**, which the installer fetches if it is missing. That
is the one place release one can touch the network, and it is an operating-system
prerequisite rather than Daneo contacting a Daneo service.

### Step 2 — run the same seven checks Linux passed

Use a **new user profile or a machine that has never had Daneo**, so onboarding is
genuinely first-run. These are the checks the 2026-10-20 Linux closeout passed, in
the same order, so the three verdicts are comparable with it rather than being a
different test each time.

1. **Onboarding and Module 1 open.** Work through Module 1's vocabulary in the UI
   until the module list shows **37/37**.
2. **The mixed module test runs**, scores, and its misses appear in **Review**.
3. **A drill accepts a correct answer** — the confusables quiz is the quickest.
4. **A review session reaches Session Complete** and reschedules its misses.
5. **A second Module 1 test reaches 17/17, 100%, passed** — vocabulary, the
   on-screen Korean keyboard, sentence meanings and role labels.
6. **Progress survives a restart.** Quit, reopen the same install with the same
   profile, and confirm Module 1 still shows 37/37 and 100%.
7. **Explore shows the AI-absence notice**, navigation has no tutor, and Settings
   has no model controls. This release has no translator and no model by design.

Two further things to note rather than pass or fail, because the Linux host could
not test them: whether **Settings reports Korean speech synthesis as available**
(it needs an OS Korean voice installed), and whether the UI renders on the real
**GPU** without the software-rendering fallback the Linux run used.

### Step 3 — record the verdict

Fill one row per platform. A row is `pass` only if all seven checks passed on that
platform; anything else is `fail` with the step number and what happened. An
unattempted platform stays `unverified` — an untested platform is never a pass.

| Platform | Hash matched | Install warning seen | Checks 1–7 | Korean speech | GPU render | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Windows x64 | yes — CI run `43160748097`, `0a99594`; SHA-256 `11e3df855bf5d0f0e8a8d100a61b80a4d854192363542bcbae6ee30506ef590e` | not exercised — copied by SCP; SmartScreen not shown | 1–3 pass; 4 fail (correct answer absent); 5 fail (retake 16/17 after QA role-label error); 6 incomplete (progress remained after restart, but 37/37 and 100% were not rechecked); 7 pass | unavailable — no Korean voice found | unverified — software only; VM reports no GPU | **fail** — CI build, not 0.1.0 installer |
| macOS Apple Silicon | n/a — CI builds, not the 0.1.0 DMG (see note) | `06f0a54`: "damaged", no Open Anyway; `84968f0`: "can't be verified", opened via Open Anyway (2026-11-11) | 1–7 pass on `06f0a54`, quarantine removed by hand (2026-11-11) | unverified — not checked | unverified — not checked | **runtime pass; first launch fixed from `84968f0`** — 0.1.0 DMG itself untested |
| RPM Linux x86-64 | n/a — CI build, not the 0.1.0 RPM (see note) | `dnf`: "skipped OpenPGP checks for 1 package from repository: @commandline" (2026-10-25) | 1–7 pass on `75f79d7` (2026-10-25); check 2's Review link re-checked on `93c2978` (2026-10-26) | available — speech plays | real GPU (RTX 5090), no software fallback seen | **pass on `75f79d7`** — 0.1.0 RPM itself untested |
| Linux AppImage | yes | n/a — no OS gate | 1–7 pass (2026-10-20) | unavailable on host | software rendering | **pass** |

**Windows x64 row, run on Windows 11 Enterprise LTSC evaluation VM (2026-11-13).**
The CI artifact `Daneo-Windows-X64` from run `43160748097` (`0a9959443fd93f1b6cddb20d96d4921fb382e648`) was downloaded and its SHA-256 matched on Linux and Windows. Silent `/S` installation succeeded and the app launched on the visible desktop. This is not the staged 0.1.0 installer. Checks 1–3 passed (Module 1 reached 37/37, the mixed test and Review queue worked, and a confusables answer scored 1/1). Check 4 failed twice: the first Review prompt was `자다` (“to sleep”), absent from both four-choice sets. Check 5 reached 17/17 once; the required retake did not: later attempts scored 16/17 due to QA input/role-label mistakes. After restart, the Learn page retained progress (Ring 1 showed 1 of 33 done), but Module 1's 37/37 and 100% were not confirmed there, so check 6 is incomplete. Check 7 passed: Explore stated it works offline with no AI, download, key or account; Settings reported “No Korean voice found on this system.” The VM had no GPU, so GPU rendering is unverified. SmartScreen was not exercised because the installer was copied by SCP. Screenshots and detailed reproduction are attached to BAD-393. Review defect follow-up: BAD-404.

**macOS row, from Nick's reports on BAD-268 and BAD-384 (Apple Silicon, macOS 27.2.1).**
Neither build tested is the hash-pinned 0.1.0 DMG. The CI DMG from run `42924234402`
(`06f0a54`, SHA-256 `0fbb2edc…0a2d`) installed, but a browser download failed at
first launch as "damaged" (the BAD-384 defect above). With `xattr -dr
com.apple.quarantine` run by hand it launched and passed checks 1–7. The CI DMG from
run `43157319010` (`84968f0`, bundle ad-hoc signed), downloaded through a browser,
showed the ordinary unverified-developer warning and opened through Privacy &
Security → Open Anyway. That second result is Nick's report of the dialog he saw;
`xattr -p com.apple.quarantine` output was not captured, though Gatekeeper only
warns on quarantined apps. Checks 1–7 were not re-run on `84968f0`, whose change
from `06f0a54` is signing configuration only. The staged 0.1.0 DMG predates the fix
and keeps the known defect, so a Mac release needs a rebuilt DMG.

**RPM row, from Nick's reports on BAD-268 and BAD-278 (nobara-pc: Nobara 43, Fedora 44
base, KDE Plasma 6 Wayland, NVIDIA RTX 5090).** The bytes tested are the CI RPM from run
`40136294877` (`75f79d7`, SHA-256 `8945022b…5d52d`), not the hash-pinned 0.1.0 RPM.
`dnf install` completed and pulled in nothing beyond `webkit2gtk-4.1` and `gtk3`, which
were already installed — so the Ubuntu-built package resolves on a Fedora base. The
profile was not pristine: leftover dev-build storage had onboarding marked done, so
check 1 ran through Settings → Run again rather than on first launch; learner progress
was otherwise empty. On 2026-10-26 he reinstalled the RPM from run `40247106419`
(`93c2978`) and confirmed the Test Complete screen and the module test card both link
misses to Review; the other checks were not re-run on that build.

There is **no Intel Mac and no Windows ARM installer** in this set, so neither has
a row. Publication is a separate approval and nothing here grants it; the point of
these verdicts is that the release notes can say which platforms were actually run
instead of implying all four were.

## Reproduce the manifest / release operator record

Artifacts are staged locally at
`src-tauri/target/release-staging/38158221011/installers/` (ignored build storage,
not committed). Original CI resource reports and launch evidence are retained in
the parent staging directory. Downloads used:

```sh
gh run download 38158221011 --pattern 'daneo-*' --dir src-tauri/target/release-staging/38158221011
```

**That download no longer works, and these four files now exist only on this build
host (2026-10-22).** This repository's Actions artifacts are retained for seven
days, so run 38158221011's artifacts expired and were deleted:
`gh api repos/nwilliams22/daneo/actions/runs/38158221011/artifacts` reports
`total_count: 0`. The accepted binaries are therefore irreplaceable — a fresh CI
build produces different bytes, which voids this manifest and the 2026-10-20
clean-profile acceptance recorded against it. Because `src-tauri/target` is a
build directory that `cargo clean` empties, a verified copy of all four installers
and this manifest is kept at `.release-staging/0.1.0/` (also ignored, and
re-verified with `sha256sum -c` after copying). Publishing the release is what
makes these bytes durable; until then they live on one machine.

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
