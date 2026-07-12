# ============================================================================
# WALLPAPER.ps1 — the ambient Maidan (THE_ORGANISM §VII.2, First Touch arm b)
# Draws KAL-line + season numbers + verdict band onto a PNG and sets it as the
# desktop wallpaper. The loop's state becomes the thing you see before you can
# decide to see it. RED/miss days show KAL-line + floor only.
#
# Enable (your call — it changes a system setting, so YOU run it):
#   schtasks /Create /F /TN "ArsenalFC-Wallpaper" /TR "powershell -ExecutionPolicy Bypass -File C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\WALLPAPER.ps1" /SC DAILY /ST 22:10
# Disable: schtasks /Delete /F /TN "ArsenalFC-Wallpaper"   (wallpaper: right-click desktop → Personalize)
# ============================================================================
Add-Type -AssemblyName System.Drawing
$repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
$data = Get-Content "$repo\dressing-room\state\wall_data.json" -Raw | ConvertFrom-Json
$W = 1920; $H = 1080
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$bg = [System.Drawing.ColorTranslator]::FromHtml("#0c0e13")
$amber = [System.Drawing.ColorTranslator]::FromHtml("#e8915a")
$body = [System.Drawing.ColorTranslator]::FromHtml("#e9e7e2")
$dim = [System.Drawing.ColorTranslator]::FromHtml("#5a6070")
$g.Clear($bg)
$fBig = New-Object System.Drawing.Font("Segoe UI", 30, [System.Drawing.FontStyle]::Bold)
$fMid = New-Object System.Drawing.Font("Segoe UI", 16)
$fSm = New-Object System.Drawing.Font("Segoe UI", 11)
$bAmber = New-Object System.Drawing.SolidBrush($amber)
$bBody = New-Object System.Drawing.SolidBrush($body)
$bDim = New-Object System.Drawing.SolidBrush($dim)

$g.DrawString("ARSENAL AI FC", $fSm, $bDim, 80, 120)
if ($data.kal_line) { $g.DrawString("KAL  >  " + $data.kal_line, $fBig, $bAmber, 76, 150) }
else { $g.DrawString("KAL  >  one green ball, first thing.", $fBig, $bAmber, 76, 150) }

$verdColor = switch ($data.verdict) { "GREEN" { "#7fb069" } "AMBER" { "#d9b45a" } default { "#c05a5a" } }
$bVerd = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($verdColor))
$g.FillEllipse($bVerd, 80, 240, 18, 18)
$g.DrawString($data.verdict, $fMid, $bBody, 108, 236)

if ($data.verdict -ne "RED") {
  $cons = if ($data.season.weekly_consistency_pct -ne $null) { "$($data.season.weekly_consistency_pct)%" } else { "-" }
  $g.DrawString("matches $($data.season.matches_played)    doubts retired $($data.doubts_retired)    weekly consistency $cons", $fMid, $bBody, 80, 290)
} else {
  $g.DrawString("Rotation day. One five-minute floor-touch is the whole match.", $fMid, $bBody, 80, 290)
}
$g.DrawString("the loop wastes nothing you generate, loses nothing you are", $fSm, $bDim, 80, 990)

$out = "$repo\dressing-room\club\wallpaper.png"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

Add-Type @"
using System.Runtime.InteropServices;
public class WP { [DllImport("user32.dll", SetLastError=true)] public static extern bool SystemParametersInfo(int a, int b, string c, int d); }
"@
[WP]::SystemParametersInfo(20, 0, $out, 3) | Out-Null
Write-Host "ambient Maidan set -> $out"
