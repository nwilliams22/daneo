param(
    [Parameter(Mandatory)][string]$BundleRoot
)
$ErrorActionPreference = 'Stop'

# Inspect the extracted installer, not just the pre-bundle executable. The build
# runner has the redistributable installed, which can hide a clean-host failure.
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$installation = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $installation) { throw 'Visual C++ inspection tools not found' }
$dumpbin = Get-ChildItem "$installation\VC\Tools\MSVC\*\bin\Hostx64\x64\dumpbin.exe" |
    Sort-Object FullName -Descending | Select-Object -First 1
if (-not $dumpbin) { throw 'dumpbin.exe not found' }

$binaries = @(Get-ChildItem $BundleRoot -Recurse -File | Where-Object { $_.Extension -in '.exe', '.dll' })
if (-not ($binaries | Where-Object Name -eq 'daneo.exe')) { throw 'Extracted daneo.exe not found' }
foreach ($binary in $binaries) {
    $imports = & $dumpbin.FullName /DEPENDENTS $binary.FullName
    if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $($binary.FullName)" }
    # /DEPENDENTS includes ordinary and delay-loaded dependencies. Windows 11's
    # system UCRT (api-ms-win-crt-*) is allowed; VC++ redistributable DLLs are not.
    $dlls = @($imports | ForEach-Object {
        if ($_ -match '^\s+([^\s]+\.dll)\s*$') { $Matches[1] }
    })
    if ($dlls.Count -eq 0) { throw "No DLL dependencies parsed for $($binary.FullName)" }
    Write-Output "$($binary.Name): $($dlls -join ', ')"
    $externalCrt = @($dlls | Where-Object { $_ -match '^(msvcp\d|msvcr\d|vcruntime\d|concrt\d|vcomp\d)' })
    if ($externalCrt.Count) {
        throw "$($binary.Name) requires the Visual C++ redistributable: $($externalCrt -join ', ')"
    }
}
Write-Output 'Windows runtime check passed: no Visual C++ redistributable imports.'
