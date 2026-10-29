# Installs what this app needs to build and run on the Android emulator, on Windows 10 or 11.
# Run it with setup-windows.cmd. It's safe to run again: it skips whatever is already there.
#
# - Node.js LTS, Git and JDK 17, with winget.
# - The Android SDK command-line tools, then platform-tools, the emulator, CMake 3.31 and an
#   Android 14 system image, and a virtual device to run it on. Android Studio isn't needed.
# - Windows long paths and the Windows Hypervisor Platform, after one administrator prompt.
# - ANDROID_HOME and JAVA_HOME, then npm install.
#
# It finishes by running the same machine check as run-android.cmd.
#
# Written for Windows PowerShell 5.1, which every Windows 10 and 11 machine has: keep it ASCII.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = Split-Path -Parent $PSScriptRoot
$CmdlineToolsUrl = 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip'
# The default CMake 3.22 ships a ninja that can't use long paths on Windows.
$MinCmake = '3.31'
$CmakePackage = 'cmake;3.31.6'
$SystemImage = 'system-images;android-34;google_apis;x86_64'
$AvdName = 'pixel_6_api_34'
$MinJava = 17

function Write-Step($message) { Write-Host "`n== $message" -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host "   OK  $message" -ForegroundColor Green }
function Write-Note($message) { Write-Host "   $message" }

function Update-SessionPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}

# A native command's stdout and stderr as one string, or '' when it can't run. Windows
# PowerShell turns redirected stderr into errors, which 'Stop' would make fatal.
function Get-Output($command, [string[]]$arguments) {
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { return (& $command @arguments 2>&1 | Out-String) } catch { return '' } finally { $ErrorActionPreference = $previous }
}

function Install-WithWinget($id, $label) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget isn't available. Install 'App Installer' from the Microsoft Store, then run this again."
  }
  Write-Note "Installing $label with winget (Windows may ask for permission)..."
  winget install --id $id --exact --silent --accept-source-agreements --accept-package-agreements
  # -1978335189 (0x8A15002B): already installed, nothing newer.
  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) { throw "winget couldn't install $label (exit code $LASTEXITCODE)." }
  Update-SessionPath
  $script:InstalledSomething = $true
}

function Get-JavaMajor($javaExe) {
  $output = Get-Output $javaExe @('-version')
  if ($output -notmatch 'version "(\d+)(?:\.(\d+))?') { return $null }
  $major = [int]$Matches[1]
  if ($major -eq 1 -and $Matches[2]) { $major = [int]$Matches[2] }
  return $major
}

function Install-SdkPackages([string[]]$packages) {
  if (-not $packages) { return }
  Write-Note "Installing $($packages -join ', ') (this can take a while)..."
  & $sdkManager "--sdk_root=$sdk" @packages
  if ($LASTEXITCODE -ne 0) { throw "sdkmanager couldn't install $($packages -join ', ') (exit code $LASTEXITCODE)." }
}

function Set-UserVariable($name, $value) {
  [Environment]::SetEnvironmentVariable($name, $value, 'User')
  Set-Item "env:$name" $value
  Write-Ok "$name = $value"
}

$script:InstalledSomething = $false
$script:NeedsRestart = $false
$adminCommands = @()

try {
  Write-Step 'Node.js'
  if (Get-Command node -ErrorAction SilentlyContinue) { Write-Ok "Node.js $(node --version)" }
  else { Install-WithWinget 'OpenJS.NodeJS.LTS' 'Node.js LTS'; Write-Ok "Node.js $(node --version)" }

  Write-Step 'Git'
  if (Get-Command git -ErrorAction SilentlyContinue) { Write-Ok (git --version) }
  else { Install-WithWinget 'Git.Git' 'Git'; Write-Ok (git --version) }

  # Gradle uses JAVA_HOME when it's set, and java on PATH otherwise.
  Write-Step "JDK $MinJava"
  $javaMajor = if ($env:JAVA_HOME) { Get-JavaMajor (Join-Path $env:JAVA_HOME 'bin\java.exe') } else { Get-JavaMajor 'java' }
  if ($javaMajor -lt $MinJava) {
    if ($javaMajor) { Write-Note "Found Java $javaMajor, which is too old." }
    Install-WithWinget 'EclipseAdoptium.Temurin.17.JDK' "JDK $MinJava"
    $jdk = Get-ChildItem "$env:ProgramFiles\Eclipse Adoptium" -Directory -Filter "jdk-$MinJava*" -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $jdk) { throw "Couldn't find the JDK $MinJava folder under $env:ProgramFiles\Eclipse Adoptium." }
    Set-UserVariable 'JAVA_HOME' $jdk.FullName
  } else {
    Write-Ok "Java $javaMajor"
    if (-not $env:JAVA_HOME -and (Get-Output 'java' @('-XshowSettings:properties', '-version')) -match 'java\.home = (.+)') {
      Set-UserVariable 'JAVA_HOME' $Matches[1].Trim()
    }
  }

  Write-Step 'Android SDK'
  $sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
  $sdk = $sdk.TrimEnd('\')
  New-Item -ItemType Directory -Force $sdk | Out-Null
  Set-UserVariable 'ANDROID_HOME' $sdk

  # Android Studio keeps the command-line tools in cmdline-tools\latest or a versioned folder.
  $sdkManager = Get-ChildItem (Join-Path $sdk 'cmdline-tools') -Directory -ErrorAction SilentlyContinue |
    Sort-Object { $_.Name -ne 'latest' } | ForEach-Object { Join-Path $_.FullName 'bin\sdkmanager.bat' } |
    Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($sdkManager) {
    Write-Ok 'Command-line tools'
  } else {
    Write-Note 'Downloading the Android SDK command-line tools...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $zip = Join-Path $env:TEMP 'android-cmdline-tools.zip'
    $unpacked = Join-Path $env:TEMP 'android-cmdline-tools'
    Invoke-WebRequest -Uri $CmdlineToolsUrl -OutFile $zip -UseBasicParsing
    if (Test-Path $unpacked) { Remove-Item $unpacked -Recurse -Force }
    Expand-Archive $zip -DestinationPath $unpacked
    New-Item -ItemType Directory -Force (Join-Path $sdk 'cmdline-tools') | Out-Null
    Move-Item (Join-Path $unpacked 'cmdline-tools') (Join-Path $sdk 'cmdline-tools\latest')
    Remove-Item $zip, $unpacked -Recurse -Force
    $sdkManager = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
    Write-Ok 'Command-line tools'
  }

  # Gradle downloads the platform, build-tools and NDK it needs on the first build, once the
  # licenses are accepted.
  Write-Note 'Accepting the Android SDK licenses (read them with: sdkmanager --licenses)...'
  $ErrorActionPreference = 'Continue'
  @('y') * 50 | & $sdkManager "--sdk_root=$sdk" --licenses 2>&1 | Out-Null
  $ErrorActionPreference = 'Stop'

  # Only what's missing: naming an installed package to sdkmanager updates it.
  $missing = @()
  if (-not (Test-Path (Join-Path $sdk 'platform-tools\adb.exe'))) { $missing += 'platform-tools' }
  if (-not (Test-Path (Join-Path $sdk 'emulator\emulator.exe'))) { $missing += 'emulator' }
  $cmake = Get-ChildItem (Join-Path $sdk 'cmake') -Directory -ErrorAction SilentlyContinue |
    Where-Object { $version = $null; [version]::TryParse($_.Name, [ref]$version) -and $version -ge [version]$MinCmake }
  if (-not $cmake) { $missing += $CmakePackage }
  Install-SdkPackages $missing
  Write-Ok 'platform-tools, emulator and CMake'

  Write-Step 'Virtual device'
  $emulator = Join-Path $sdk 'emulator\emulator.exe'
  $avds = (Get-Output $emulator @('-list-avds')) -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[\w.-]+$' }
  if ($avds) {
    Write-Ok "Virtual device: $($avds -join ', ')"
  } else {
    if (-not (Test-Path (Join-Path $sdk ($SystemImage -replace ';', '\')))) { Install-SdkPackages @($SystemImage) }
    $avdManager = Join-Path (Split-Path $sdkManager) 'avdmanager.bat'
    'no' | & $avdManager create avd --name $AvdName --package $SystemImage --device pixel_6 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "avdmanager couldn't create the $AvdName virtual device (exit code $LASTEXITCODE)." }
    Write-Ok "Created the $AvdName virtual device"
  }

  $acceleration = Get-Output $emulator @('-accel-check')
  if ($acceleration -match 'installed and usable') {
    Write-Ok 'Emulator hardware acceleration'
  } else {
    Write-Note 'The emulator has no hardware acceleration yet; turning on the Windows Hypervisor Platform.'
    $adminCommands += 'Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All -NoRestart | Out-Null'
    $script:NeedsRestart = $true
  }

  Write-Step 'Windows long paths'
  $longPaths = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue
  if ($longPaths -and $longPaths.LongPathsEnabled -eq 1) {
    Write-Ok 'Long paths are on'
  } else {
    $adminCommands += "Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -Type DWord"
  }

  if ($adminCommands.Count -gt 0) {
    Write-Note 'Windows will ask for administrator permission to change these system settings.'
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(($adminCommands -join '; ')))
    try {
      $admin = Start-Process powershell -Verb RunAs -Wait -PassThru -ArgumentList '-NoProfile', '-EncodedCommand', $encoded
      if ($admin.ExitCode -eq 0) { Write-Ok 'System settings changed' } else { Write-Note "The administrator step failed (exit code $($admin.ExitCode))." }
    } catch {
      Write-Note 'The administrator step was skipped. Run this script again to retry it.'
    }
  }

  Write-Step 'npm packages'
  if (Test-Path (Join-Path $ProjectDir 'node_modules')) {
    Write-Ok 'Already installed (run-android.cmd reinstalls when package-lock.json changes)'
  } else {
    Push-Location $ProjectDir
    try { npm install; if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit code $LASTEXITCODE)." } } finally { Pop-Location }
    Write-Ok 'npm install'
  }

  Write-Step 'Checking the machine'
  & node (Join-Path $PSScriptRoot 'run-android.js') --check
  $checkExit = $LASTEXITCODE
} catch {
  Write-Host "`n$($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

Write-Host ''
if ($script:NeedsRestart) { Write-Host 'Restart Windows so the emulator can use hardware acceleration.' -ForegroundColor Yellow }
if ($script:InstalledSomething) { Write-Host 'Open a new terminal so it sees the new programs, then run run-android.cmd.' -ForegroundColor Yellow }
elseif ($checkExit -eq 0) { Write-Host 'Done. Run run-android.cmd to build and start the app.' -ForegroundColor Green }
exit $checkExit
