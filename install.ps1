# Nyx Panel Automated Windows Server Installer
# Developed by Cynet Security Team (https://cynetx.ir)

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Nyx Panel Windows Server Installation..." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

# Check Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Error: Please run PowerShell as Administrator!" -ForegroundColor Red
    Exit
}

Write-Host ""
Write-Host "----------------------------------------------------" -ForegroundColor Yellow
Write-Host "🔑 Admin Account & Port Setup (تنظیمات ورود ادمین):" -ForegroundColor Yellow
Write-Host "----------------------------------------------------" -ForegroundColor Yellow

$adminUser = Read-Host "👤 Admin Username [default: admin]"
if ([string]::IsNullOrWhiteSpace($adminUser)) { $adminUser = "admin" }

$adminPass = Read-Host "🔐 Admin Password [default: nyx2026!]"
if ([string]::IsNullOrWhiteSpace($adminPass)) { $adminPass = "nyx2026!" }

$panelPort = Read-Host "🌐 Web Panel Port [default: 3000]"
if ([string]::IsNullOrWhiteSpace($panelPort)) { $panelPort = "3000" }

$installDir = "C:\Nyx"
Write-Host ""
Write-Host "📂 Installing Nyx Panel to $installDir..." -ForegroundColor Cyan

if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir | Out-Null
}

Set-Location $installDir

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Node.js LTS for Windows..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v18.19.1/node-v18.19.1-x64.msi"
    $nodeMsi = "$env:TEMP\node_installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Copy or Sync files
$sourceDir = Get-Location
Write-Host "⚙️ Setting up backend and frontend dependencies..." -ForegroundColor Cyan

# Create backend .env
$envContent = @"
PORT=$panelPort
SERVER_IP=127.0.0.1
ADMIN_USER=$adminUser
ADMIN_PASS=$adminPass
DATABASE_URL=file:./dev.db
"@

Set-Location "$installDir\backend"
$envContent | Out-File -FilePath ".env" -Encoding utf8

Write-Host "📦 Installing backend packages..." -ForegroundColor Yellow
npm install --loglevel=error
npx prisma db push --skip-generate
npx prisma generate
npm run build

Set-Location "$installDir\frontend"
Write-Host "📦 Installing frontend packages and building assets..." -ForegroundColor Yellow
npm install --loglevel=error
npm run build

Set-Location $installDir

# Create Windows Service / Scheduled Task for Nyx Startup
Write-Host "🔒 Registering Nyx Service in Windows Task Scheduler..." -ForegroundColor Cyan
$taskName = "NyxPanelService"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute "node.exe" -Argument "$installDir\backend\dist\index.js" -WorkingDirectory "$installDir\backend"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal | Out-Null
Start-ScheduledTask -TaskName $taskName

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "✅ Nyx Panel Successfully Installed on Windows Server!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "🌐 Web Panel URL:  http://localhost:$panelPort" -ForegroundColor Cyan
Write-Host "👤 Admin Username: $adminUser" -ForegroundColor White
Write-Host "🔐 Admin Password: $adminPass" -ForegroundColor White
Write-Host "⚙️ Service Name:   $taskName (Auto-starts on Windows Boot)" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
