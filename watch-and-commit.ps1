# 파일 변경 감지 및 자동 커밋 스크립트
# 이 스크립트를 실행하면 파일 변경을 감지하여 자동으로 커밋하고 푸시합니다.

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  자동 커밋 및 푸시 감시 모드 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "파일을 저장하면 자동으로 커밋하고 푸시합니다." -ForegroundColor Yellow
Write-Host "종료하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
Write-Host ""

# Git 저장소 확인
if (-not (Test-Path ".git")) {
    Write-Host "✗ Git 저장소가 아닙니다. git init을 먼저 실행하세요." -ForegroundColor Red
    exit 1
}

# FileSystemWatcher 생성
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# 중복 실행 방지를 위한 플래그
$isProcessing = $false
$lastProcessTime = 0

# 변경 이벤트 핸들러
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # .git 폴더, 임시 파일, 로그 파일 제외
    if ($path -notmatch '\.git' -and 
        $path -notmatch '~$' -and 
        $path -notmatch '\.tmp$' -and
        $path -notmatch '\.log$') {
        
        # 중복 실행 방지 (5초 이내 재실행 방지)
        $currentTime = Get-Date
        if ($isProcessing -or ((Get-Date).Ticks - $lastProcessTime) -lt 50000000) {
            return
        }
        
        $isProcessing = $true
        $lastProcessTime = (Get-Date).Ticks
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$changeType] $path" -ForegroundColor Gray
        
        # 3초 대기 (여러 파일이 동시에 변경될 수 있음)
        Start-Sleep -Seconds 3
        
        # 자동 커밋 스크립트 실행
        try {
            & "$repoPath\auto-commit.ps1"
        } catch {
            Write-Host "✗ 오류 발생: $_" -ForegroundColor Red
        } finally {
            $isProcessing = $false
        }
    }
}

# 이벤트 등록
$changedEvent = Register-ObjectEvent $watcher "Changed" -Action $action
$createdEvent = Register-ObjectEvent $watcher "Created" -Action $action
$deletedEvent = Register-ObjectEvent $watcher "Deleted" -Action $action

Write-Host "✓ 파일 감지 시작됨" -ForegroundColor Green
Write-Host ""

# 무한 대기
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "`n중단됨: $_" -ForegroundColor Yellow
} finally {
    # 이벤트 해제
    Unregister-Event -SourceIdentifier $changedEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $createdEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $deletedEvent.Name -ErrorAction SilentlyContinue
    
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host "`n파일 감지 종료" -ForegroundColor Yellow
}


