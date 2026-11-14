# Desktop-session input for UI tests on win11-test. Run it ON the desktop via gui-run.ps1 -Wait;
# output goes to -Out (UTF-8) because gui-run cannot return stdout.
#   -Dump                    write the window's UI Automation tree (control type | name | value | rect)
#   -ClickName 'text'        click the centre of the first element whose Name matches (exact, then substring)
#   -ClickXY 'x,y'           click screen coordinates
#   -Paste 'text'            Set-Clipboard in this session, then Ctrl+V into the focused control
#   -Keys '{ENTER}'          SendKeys string, sent last
#   -PasteB64 '...'          like -Paste, but base64 UTF-8, so Hangul survives the ssh quoting
#
# Verified 2026-11-14 on win11-test with the Daneo 0.1.0 x64 installer: name clicks advance
# onboarding and navigate, and Hangul pasted into a focused Edit reads back as typed.
#   scp scripts/win11-desktop-input.ps1 win11-test:C:/Users/baddong/desktop-input.ps1
#   ssh win11-test "C:\ProgramData\EvalBuild\gui-run.ps1 powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\baddong\desktop-input.ps1 -ClickName Learn -Dump' -Wait -TimeoutSec 120"
#   B64=$(printf '안녕하세요' | base64)    # 7JWI64WV7ZWY7IS47JqU
#   ssh win11-test "C:\ProgramData\EvalBuild\gui-run.ps1 powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\baddong\desktop-input.ps1 -ClickXY 442,248 -PasteB64 $B64 -Dump' -Wait -TimeoutSec 120"
#   scp win11-test:C:/Users/baddong/desktop-input.txt .   # read it here: the ssh console mangles Hangul to '?'
# -ClickName on a Hyperlink navigates; a raw -ClickXY on the nav bar did not. Screen coords are
# physical pixels from -Dump; the desktop is 1280x800.
#
# Module 1 at 37/37 from a clean install, through the app's own UI (no database or state edits).
# Verified 2026-11-14 on a freshly reset win11-test, CI run 43529864078 (06d0af3): one call made
# 38 clicks and the Learn page then read "1 From Letters to Your First Sentences 37/37 test due".
# The checklist rows are Buttons named "<ko> <rom> <en>"; "<rom> <en>" is ASCII and unique, so it
# survives ssh quoting. Romanization shows after "I'm brand new". Build the list from content:
#   M1=$(python3 -c 'import json;m=[x for x in json.load(open("src/content/modules.json")) if x["id"]=="m1"][0];w={x["id"]:x for x in json.load(open("src/content/words.json"))};print(";;".join(w[i]["rom"]+" "+w[i]["en"] for i in m["wordIds"]))')
#   ARGS="-ClickName \"I''m brand new;;Learn;;From Letters;;$M1\" -Dump"
#   ssh win11-test "C:\ProgramData\EvalBuild\gui-run.ps1 powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\Users\baddong\desktop-input.ps1 $ARGS' -Wait -TimeoutSec 600"
# Each click toggles, so on a partly ticked list click only the unticked rows (screenshot first):
# the tick is aria-hidden and does not appear in -Dump. Afterwards -ClickName
# 'Learn;;Everything before here' -Dump shows the Module 1 row with its n/37.
# The placement quiz ("I know some — place me") also pre-ticks all 37, but only when hangul >= 4/5
# and vocab >= 5/6 are answered correctly; the checklist route has no such dependency.
param(
    [string]$ProcessName = 'daneo',
    [switch]$Dump,
    [string]$ClickName,
    [string]$ClickXY,
    [string]$Paste,
    [string]$PasteB64,
    [string]$Keys,
    [string]$Out = 'C:\Users\baddong\desktop-input.txt'
)
$ErrorActionPreference = 'Stop'
$log = New-Object System.Collections.Generic.List[string]
try {
    Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms
    Add-Type @'
using System; using System.Runtime.InteropServices;
public class DIn {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern void keybd_event(byte v, byte s, uint f, UIntPtr e);
  public static void Click(int x, int y) { SetCursorPos(x, y); System.Threading.Thread.Sleep(100);
    mouse_event(2,0,0,0,UIntPtr.Zero); mouse_event(4,0,0,0,UIntPtr.Zero); }
  public static void CtrlV() { keybd_event(0x11,0,0,UIntPtr.Zero); keybd_event(0x56,0,0,UIntPtr.Zero);
    keybd_event(0x56,0,2,UIntPtr.Zero); keybd_event(0x11,0,2,UIntPtr.Zero); }
}
'@
    [DIn]::SetProcessDPIAware() | Out-Null
    $p = Get-Process $ProcessName | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1
    if (-not $p) { throw "$ProcessName has no visible window" }
    $h = $p.MainWindowHandle
    [DIn]::ShowWindow($h, 3) | Out-Null   # maximize: an unmaximized window runs under the taskbar
    # Tap Alt so Windows allows the foreground change from a background task
    [DIn]::keybd_event(0x12,0,0,[UIntPtr]::Zero); [DIn]::keybd_event(0x12,0,2,[UIntPtr]::Zero)
    [DIn]::SetForegroundWindow($h) | Out-Null
    Start-Sleep -Milliseconds 500
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($h)
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)

    # -ClickName takes one name, or several separated by ';;' (clicked in order, each scrolled into view)
    if ($ClickName) { foreach ($want in ($ClickName -split ';;')) {
        # Retry for up to ~8 s: after a navigating click the next page may not be rendered yet.
        $pat = '*' + [WildcardPattern]::Escape($want) + '*'
        $el = $null
        for ($try = 0; $try -lt 16 -and -not $el; $try++) {
            if ($try) { Start-Sleep -Milliseconds 500 }
            $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
            $els = @($all | Where-Object { $_.Current.Name -eq $want })
            if (-not $els) { $els = @($all | Where-Object { $_.Current.Name -like $pat }) }
            $el = $els | Where-Object { -not $_.Current.BoundingRectangle.IsEmpty } | Select-Object -First 1
        }
        if (-not $el) { throw "no element named '$want'" }
        # WebView2 content rarely offers ScrollItemPattern; focusing the element makes Chromium
        # scroll it into view, which is what keeps a long page (Module 1's checklist) clickable.
        try { $el.GetCurrentPattern([System.Windows.Automation.ScrollItemPattern]::Pattern).ScrollIntoView() } catch {}
        try { $el.SetFocus() } catch {}
        # Chromium scrolls smoothly: wait until the element's rectangle stops moving, or the click
        # lands on whatever row was there mid-scroll (BAD-418: 20 of 37 checklist clicks missed).
        $r = $el.Current.BoundingRectangle
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Milliseconds 250
            $r2 = $el.Current.BoundingRectangle
            if ($r2.Y -eq $r.Y -and $r2.X -eq $r.X) { break }
            $r = $r2
        }
        $w = $root.Current.BoundingRectangle
        $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea   # excludes the taskbar
        $bottom = [Math]::Min($w.Y + $w.Height, $wa.Y + $wa.Height)
        if ($r.IsEmpty -or [double]::IsNaN($r.X) -or $r.Y -lt $w.Y -or ($r.Y + $r.Height) -gt $bottom) {
            throw "'$($el.Current.Name)' is outside the window after scrolling ($r)"
        }
        $x = [int]($r.X + $r.Width / 2); $y = [int]($r.Y + $r.Height / 2)
        [DIn]::Click($x, $y)
        $log.Add("clicked '$($el.Current.Name)' [$($el.Current.ControlType.ProgrammaticName)] at $x,$y")
        Start-Sleep -Milliseconds 500
    } }
    if ($ClickXY) {
        $x, $y = $ClickXY -split ',' | ForEach-Object { [int]$_ }
        [DIn]::Click($x, $y); $log.Add("clicked $x,$y"); Start-Sleep -Milliseconds 600
    }
    if ($PasteB64) { $Paste = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($PasteB64)) }
    if ($Paste) {
        Set-Clipboard -Value $Paste
        $log.Add("clipboard now: '$(Get-Clipboard)'")
        [DIn]::CtrlV(); $log.Add('sent Ctrl+V'); Start-Sleep -Milliseconds 600
    }
    if ($Keys) { [System.Windows.Forms.SendKeys]::SendWait($Keys); $log.Add("sent keys $Keys"); Start-Sleep -Milliseconds 800 }

    if ($Dump) {
        $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
        foreach ($e in $all) {
            $c = $e.Current
            $v = ''
            try { $vp = $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern); $v = $vp.Current.Value } catch {}
            try { $tp = $e.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern); $v = "$v toggle=$($tp.Current.ToggleState)" } catch {}
            if ($c.Name -or $v) {
                $r = $c.BoundingRectangle
                $log.Add(("{0} | {1} | val={2} | focus={3} | {4},{5} {6}x{7}" -f $c.ControlType.ProgrammaticName.Replace('ControlType.',''), $c.Name, $v, $c.HasKeyboardFocus, [int]$r.X, [int]$r.Y, [int]$r.Width, [int]$r.Height))
            }
        }
    }
    $log.Add('ok')
} catch {
    $log.Add("ERROR: $($_.Exception.Message)")
}
[IO.File]::WriteAllLines($Out, $log, (New-Object Text.UTF8Encoding $false))
