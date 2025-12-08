# 자동 커밋 및 푸시 스크립트
# 파일 변경을 감지하여 자동으로 커밋하고 푸시합니다.

$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoPath

Write-Host "변경사항 확인 중..." -ForegroundColor Yellow

# 변경사항 확인
$status = git status --porcelain

if ($status) {
    Write-Host "변경사항 발견! 자동 커밋 및 푸시 중..." -ForegroundColor Green
    
    # 모든 변경사항 추가
    git add -A
    
    # 커밋 메시지 생성 (변경된 파일 목록 기반)
    $changedFiles = git diff --cached --name-only
    $commitMessage = "자동 업데이트: " + ($changedFiles -join ", ")
    
    # 커밋
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "커밋 완료! 푸시 중..." -ForegroundColor Green
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ 성공적으로 깃허브에 업데이트되었습니다!" -ForegroundColor Cyan
        } else {
            Write-Host "✗ 푸시 실패" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ 커밋 실패 (변경사항이 없거나 이미 커밋됨)" -ForegroundColor Yellow
    }
} else {
    Write-Host "변경사항이 없습니다." -ForegroundColor Gray
}

