param([ValidateSet('start','stop','status')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$workspace = Split-Path $PSScriptRoot -Parent
$dataDir = Join-Path $workspace '.local/postgres'
if (!(Test-Path -LiteralPath $dataDir)) { throw 'Yerel PostgreSQL kümesi yok. README kurulum adımlarını izleyin veya Docker Compose kullanın.' }
$pgCtl = Join-Path $env:ProgramFiles 'PostgreSQL/18/bin/pg_ctl.exe'
if (!(Test-Path -LiteralPath $pgCtl)) { throw 'PostgreSQL 18 bulunamadı.' }
if ($Action -eq 'start') {
  & $pgCtl -D $dataDir status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Output 'MyMath PostgreSQL zaten çalışıyor.'; exit 0 }
  & $pgCtl -D $dataDir -l (Join-Path $workspace '.local/postgres.log') start
} elseif ($Action -eq 'stop') { & $pgCtl -D $dataDir stop -m fast }
else { & $pgCtl -D $dataDir status }
exit $LASTEXITCODE
