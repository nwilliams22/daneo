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
    [DIn]::ShowWindow($h, 9) | Out-Null
    # Tap Alt so Windows allows the foreground change from a background task
    [DIn]::keybd_event(0x12,0,0,[UIntPtr]::Zero); [DIn]::keybd_event(0x12,0,2,[UIntPtr]::Zero)
    [DIn]::SetForegroundWindow($h) | Out-Null
    Start-Sleep -Milliseconds 500
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($h)
    $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)

    # -ClickName takes one name, or several separated by ';;' (clicked in order, each scrolled into view)
    if ($ClickName) { foreach ($want in ($ClickName -split ';;')) {
        $all = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
        $els = @($all | Where-Object { $_.Current.Name -eq $want })
        if (-not $els) { $els = @($all | Where-Object { $_.Current.Name -like "*$want*" }) }
        $el = $els | Where-Object { -not $_.Current.BoundingRectangle.IsEmpty } | Select-Object -First 1
        if (-not $el) { throw "no element named '$want'" }
        try { $el.GetCurrentPattern([System.Windows.Automation.ScrollItemPattern]::Pattern).ScrollIntoView(); Start-Sleep -Milliseconds 1200 } catch {}
        $r = $el.Current.BoundingRectangle
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
