# Moves most of the Windows page file to the E: drive so Node / Vite stop
# running out of memory while C: is nearly full. Run as Administrator.
# Takes effect after a reboot. To undo: System > Advanced > Performance >
# Virtual memory > tick "Automatically manage paging file size for all drives".

$ErrorActionPreference = "Stop"

$E_INITIAL_MB = 8192
$E_MAX_MB = 16384
$C_FIXED_MB = 1024

Write-Host "Turning off automatic page file management..."
Get-CimInstance Win32_ComputerSystem | Set-CimInstance -Property @{ AutomaticManagedPagefile = $false }

$settings = Get-CimInstance Win32_PageFileSetting

$e = $settings | Where-Object { $_.Name -like "E:*" }
if ($e) {
  Write-Host "Resizing existing E: page file..."
  $e | Set-CimInstance -Property @{ InitialSize = $E_INITIAL_MB; MaximumSize = $E_MAX_MB }
} else {
  Write-Host "Creating E:\pagefile.sys ($E_INITIAL_MB MB - $E_MAX_MB MB)..."
  New-CimInstance -ClassName Win32_PageFileSetting -Property @{
    Name = "E:\pagefile.sys"; InitialSize = $E_INITIAL_MB; MaximumSize = $E_MAX_MB
  } | Out-Null
}

$c = $settings | Where-Object { $_.Name -like "C:*" }
if ($c) {
  Write-Host "Shrinking C: page file to a fixed $C_FIXED_MB MB (frees space on C:)..."
  $c | Set-CimInstance -Property @{ InitialSize = $C_FIXED_MB; MaximumSize = $C_FIXED_MB }
} else {
  New-CimInstance -ClassName Win32_PageFileSetting -Property @{
    Name = "C:\pagefile.sys"; InitialSize = $C_FIXED_MB; MaximumSize = $C_FIXED_MB
  } | Out-Null
}

Write-Host ""
Write-Host "New page file settings (apply after reboot):"
Get-CimInstance Win32_PageFileSetting | Format-Table Name, InitialSize, MaximumSize -AutoSize
Write-Host "Done. Restart Windows for this to take effect."
Read-Host "Press Enter to close"
