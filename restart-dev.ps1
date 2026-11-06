Stop-ScheduledTask -TaskName "XYZW Dev Server" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-ScheduledTask -TaskName "XYZW Dev Server"
Write-Host "XYZW dev server restarted."
