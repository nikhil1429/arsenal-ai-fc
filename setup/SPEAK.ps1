# SPEAK.ps1 — the organism's spoken utterance (optional lane; see VOICE_SETUP.md)
# Reads the team sheet's opening lines aloud via Windows TTS. Two sanctioned
# utterances only (bias-to-silence law): morning sheet · full-time bell line.
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = 0
$sheet = "C:\Users\nikhi\GitHub\arsenal-ai-fc\dressing-room\state\team_sheet.md"
$hour = (Get-Date).Hour
if ($hour -ge 20) {
  $s.Speak("Full time, captain. Thirty seconds, then sleep. One result, one signal, one line for tomorrow.")
} elseif (Test-Path $sheet) {
  $lines = (Get-Content $sheet -TotalCount 8) -join ". " -replace '[#*⚪🔴🏆⚽🔋🕐🪑📋🗣️🛟—]', ''
  $s.Speak("Team sheet is up. " + $lines)
} else {
  $s.Speak("No sheet on the wall yet, captain.")
}
$s.Dispose()
