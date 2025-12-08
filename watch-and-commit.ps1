# 파일 변경 감지 및 자동 커밋 스크립트
# 이 스크립트를 실행하면 파일 변경을 감지하여 자동으로 커밋하고 푸시합니다.

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

Write-Host "파일 변경 감지 시작... (Ctrl+C로 종료)" -ForegroundColor Cyan
Write-Host "파일을 저장하면 자동으로 커밋하고 푸시합니다." -ForegroundColor Yellow
Write-Host ""

# FileSystemWatcher 생성
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# 변경 이벤트 핸들러
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # .git 폴더는 제외
    if ($path -notmatch '\.git') {
        Write-Host "[$changeType] $path" -ForegroundColor Gray
        
        # 2초 대기 (여러 파일이 동시에 변경될 수 있음)
        Start-Sleep -Seconds 2
        
        # 자동 커밋 스크립트 실행
        & "$repoPath\auto-commit.ps1"
    }
}

# 이벤트 등록
Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null

# 무한 대기
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host "`n파일 감지 종료" -ForegroundColor Yellow
}

