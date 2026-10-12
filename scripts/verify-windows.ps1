# [INPUT]: release 脚本生成的当前用户 NSIS 安装器。
# [OUTPUT]: 同一安装器在 Windows runner 上安装、启动、卸载成功的验证结果。
# [POS]: 打包之外的运行时验收；进程立即退出或找不到可执行文件即阻止发布。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
$ErrorActionPreference = 'Stop'
$installer = @(Get-ChildItem releases/*-setup.exe)
if ($installer.Count -ne 1) { throw 'Expected one installer' }
$installDir = Join-Path $env:LOCALAPPDATA 'DeepRant-verification'
try {
    $process = Start-Process $installer[0].FullName -ArgumentList @('/S', "/D=$installDir") -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Install failed: $($process.ExitCode)" }
    $exe = Join-Path $installDir 'DeepRant.exe'
    if (-not (Test-Path $exe)) { throw 'Installed executable is missing' }
    $app = Start-Process $exe -PassThru
    Start-Sleep -Seconds 8
    if ($app.HasExited) { throw "Application failed to start: $($app.ExitCode)" }
    Stop-Process -Id $app.Id -Force
    Write-Output 'Current-user install and real application startup passed'
} finally {
    $uninstaller = Join-Path $installDir 'uninstall.exe'
    if (Test-Path $uninstaller) {
        $uninstall = Start-Process $uninstaller -ArgumentList '/S' -Wait -PassThru
        if ($uninstall.ExitCode -ne 0) { throw "Uninstall failed: $($uninstall.ExitCode)" }
        for ($attempt = 0; $attempt -lt 10 -and (Test-Path $exe); $attempt++) { Start-Sleep -Seconds 1 }
        if (Test-Path $exe) { throw 'Uninstall left the application executable installed' }
        $entries = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue
        if ($entries | Where-Object { $_.InstallLocation -eq $installDir -or $_.UninstallString -like "*$installDir*" }) {
            throw 'Uninstall left its current-user registration behind'
        }
    }
    Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
}
