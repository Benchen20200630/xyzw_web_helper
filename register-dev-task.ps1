$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-WindowStyle Hidden -ExecutionPolicy Bypass -File "D:\VScodefiles\XYZW\xyzw_web_helper\start-dev.ps1"'
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName "XYZW Dev Server" -Action $action -Trigger $trigger -Settings $settings -Description "XYZW game manager dev server, port 3000" -Force | Out-Null
Write-Host "Registered: XYZW Dev Server"
