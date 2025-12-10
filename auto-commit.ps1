# 자동 커밋 및 푸시 스크립트
# 파일 변경을 감지하여 자동으로 커밋하고 푸시합니다.

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 변경사항 확인 중..." -ForegroundColor Yellow

# 현재 브랜치 이름 가져오기
$currentBranch = git rev-parse --abbrev-ref HEAD
if (-not $currentBranch) {
    Write-Host "✗ Git 저장소가 초기화되지 않았습니다." -ForegroundColor Red
    exit 1
}

Write-Host "현재 브랜치: $currentBranch" -ForegroundColor Cyan

# 변경사항 확인
$status = git status --porcelain

if ($status) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 변경사항 발견! 자동 커밋 및 푸시 중..." -ForegroundColor Green
    
    # 모든 변경사항 추가
    git add -A
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ git add 실패" -ForegroundColor Red
        exit 1
    }
    
    # 커밋 메시지 생성 (변경된 파일 목록 기반)
    $changedFiles = git diff --cached --name-only
    $fileCount = ($changedFiles | Measure-Object).Count
    
    # 파일 목록이 너무 길면 요약
    if ($fileCount -gt 5) {
        $fileList = ($changedFiles | Select-Object -First 3) -join ", "
        $commitMessage = "자동 업데이트: $fileList 외 $($fileCount - 3)개 파일"
    } else {
        $commitMessage = "자동 업데이트: " + ($changedFiles -join ", ")
    }
    
    # 커밋
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 커밋 완료! 푸시 중..." -ForegroundColor Green
        
        # 원격 저장소 확인
        $remoteExists = git remote | Select-String -Pattern "origin"
        if (-not $remoteExists) {
            Write-Host "✗ 원격 저장소(origin)가 설정되지 않았습니다." -ForegroundColor Red
            exit 1
        }
        
        # 푸시 (브랜치 자동 감지)
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✓ 성공적으로 깃허브에 업데이트되었습니다! (브랜치: $currentBranch)" -ForegroundColor Cyan
        } else {
            Write-Host "✗ 푸시 실패 (에러 코드: $LASTEXITCODE)" -ForegroundColor Red
            Write-Host "힌트: git push origin $currentBranch 를 수동으로 실행해보세요." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "✗ 커밋 실패 (변경사항이 없거나 이미 커밋됨)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 변경사항이 없습니다." -ForegroundColor Gray
}


