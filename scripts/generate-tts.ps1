param([string]$Subject = "all")

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$projectRoot = Split-Path -Parent $PSScriptRoot
$lectureRoot = Join-Path $projectRoot "public\content\lectures"
$outputRoot = Join-Path $projectRoot "public\audio\lectures"
$tempRoot = Join-Path $projectRoot ".tts-temp"
$subjects = @("chinese", "english", "math-a", "math-b", "history", "geography", "civics", "physics", "chemistry", "biology", "earth-science")

if ($Subject -ne "all") {
  if ($subjects -notcontains $Subject) { throw "Unknown subject: $Subject" }
  $subjects = @($Subject)
}

New-Item -ItemType Directory -Force -Path $outputRoot, $tempRoot | Out-Null

foreach ($id in $subjects) {
  $markdownPath = Join-Path $lectureRoot "$id.md"
  $wavPath = Join-Path $tempRoot "$id.wav"
  $mp3Path = Join-Path $outputRoot "$id.mp3"
  $text = Get-Content -Raw -LiteralPath $markdownPath
  $text = [regex]::Replace($text, "(?s)^---.*?---\s*", "")
  $text = [regex]::Replace($text, "(?m)^#+\s+", "")

  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  if ($id -eq "english") {
    $synth.SelectVoice("Microsoft Zira Desktop")
    $synth.Rate = -1
  } else {
    $synth.SelectVoice("Microsoft Hanhan Desktop")
    $synth.Rate = -1
  }
  $synth.Volume = 100
  $synth.SetOutputToWaveFile($wavPath)
  $synth.Speak($text)
  $synth.Dispose()

  & ffmpeg -hide_banner -loglevel error -y -i $wavPath -codec:a libmp3lame -b:a 128k -ar 44100 $mp3Path
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $id" }
  Write-Output "Generated $mp3Path"
}

Remove-Item -Recurse -Force -LiteralPath $tempRoot
