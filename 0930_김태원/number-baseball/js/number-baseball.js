// ==============================
// 숫자 야구 게임 JavaScript코드 (다중 플레이어 지원)
// ==============================

// DOM 요소 선택 - HTML 에서 필요한 요소들을 가져옴
const input = document.querySelector("#input"); // 사용자 입력 필드
const form = document.querySelector("#form"); // 폼 요소(제출 버튼 포함)
const logs = document.querySelector("#logs"); // 결과를 표시할 로그 영역
const playerSetup = document.querySelector("#player-setup"); // 플레이어 설정 영역
const playerStatus = document.querySelector("#player-status"); // 플레이어 상태 영역
const gameArea = document.querySelector("#game-area"); // 게임 영역
const playerCountSelect = document.querySelector("#player-count"); // 플레이어 수 선택
const startGameBtn = document.querySelector("#start-game"); // 게임 시작 버튼
const playersInfo = document.querySelector("#players-info"); // 플레이어 정보 표시
const resetGameBtn = document.querySelector("#reset-game"); // 게임 리셋 버튼

// 점수판 요소들
const player1Score = document.querySelector("#player1-score");
const player2Score = document.querySelector("#player2-score");
const player3Score = document.querySelector("#player3-score");
const player4Score = document.querySelector("#player4-score");
const additionalPlayers = document.querySelector("#additional-players");
const totalAttempts = document.querySelector("#total-attempts");

// ==============================
// 정답 생성 (중복 없는 4자리 숫자)
// ==============================

const answer = new Set();
while (answer.size < 4) {
    const randomNumber = Math.floor(Math.random() * 9) + 1;
    answer.add(randomNumber);
}

const answerArray = Array.from(answer);
console.log(answerArray);

// 개발용 정답 표시
document.getElementById('answer-text').textContent = answerArray.join('');

// ==============================
// 게레이어 및 게임 상태관리
// ==============================

let players = []; // 플레이어 배열
let currentPlayerIndex = 0; // 현재 플레이어 인덱스
let gameStarted = false; // 게임 시작 여부
let gameEnded = false; // 게임 종료 여부
let currentInning = 1; // 현재 회차
let currentTurn = 0; // 현재 턴 (플레이어들이 한 번씩 돌면 1회 증가)
const tries = []; // 전체 시도 기록

// ==============================
// 플레이어 관리 함수들
// ==============================

// 플레이어 초기화
function initializePlayers(playerCount) {
    players = [];
    for (let i = 1; i <= playerCount; i++) {
        players.push({
            id: i,
            name: `플레이어 ${i}`,
            attempts: [],
            isWinner: false,
            isEliminated: false
        });
    }
    currentPlayerIndex = 0;
    gameStarted = true;
    gameEnded = false;
    tries.length = 0; // 배열 초기화
}

// 플레이어 상태 업데이트
function updatePlayerStatus() {
    playersInfo.innerHTML = '';
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.style.cssText = `
            padding: 10px; 
            margin: 5px 0; 
            border: 2px solid ${index === currentPlayerIndex ? '#ff9800' : '#e0e0e0'}; 
            border-radius: 5px; 
            background-color: ${index === currentPlayerIndex ? '#fff3e0' : '#f5f5f5'};
            font-weight: ${index === currentPlayerIndex ? 'bold' : 'normal'};
        `;
        
        let statusText = '';
        if (player.isWinner) {
            statusText = '🏆 승리!';
        } else if (player.isEliminated) {
            statusText = '❌ 탈락';
        } else if (index === currentPlayerIndex) {
            statusText = '👤 현재 턴';
        } else {
            statusText = '⏳ 대기중';
        }
        
        playerDiv.innerHTML = `
            <strong>${player.name}</strong> - ${statusText}<br>
            시도 횟수: ${player.attempts.length}회
        `;
        playersInfo.appendChild(playerDiv);
    });
}

// 홈런 연출
function showHomeRunAnimation() {
    const field = document.querySelector('.field');
    const batter = document.querySelector('.batter');
    const pitcher = document.querySelector('.pitcher');
    const crowd = document.querySelector('.crowd');
    const sceneText = document.querySelector('.scene-text');
    
    // 홈런 연출 시작
    field.style.background = 'radial-gradient(circle, #FFD700 0%, #FFA500 100%)';
    batter.style.fontSize = '32px';
    batter.style.transform = 'translateX(-50%) rotate(-45deg)';
    pitcher.style.opacity = '0.3';
    crowd.textContent = '🎉🎉🎉';
    sceneText.textContent = 'HOMERUN!!! 🏆';
    sceneText.style.color = '#FFD700';
    sceneText.style.fontSize = '18px';
    sceneText.style.fontWeight = 'bold';
    
    // 공이 날아가는 애니메이션
    const ball = document.createElement('div');
    ball.innerHTML = '⚾';
    ball.style.position = 'absolute';
    ball.style.fontSize = '20px';
    ball.style.left = '50%';
    ball.style.top = '30%';
    ball.style.transform = 'translateX(-50%)';
    ball.style.zIndex = '10';
    ball.style.animation = 'flyAway 2s ease-out forwards';
    field.appendChild(ball);
    
    // 3초 후 원래 상태로 복구
    setTimeout(() => {
        field.style.background = 'radial-gradient(circle, #228B22 0%, #32CD32 100%)';
        batter.style.fontSize = '24px';
        batter.style.transform = 'translateX(-50%) rotate(0deg)';
        pitcher.style.opacity = '1';
        crowd.textContent = '👥👥👥';
        sceneText.textContent = '야구 경기 중...';
        sceneText.style.color = 'white';
        sceneText.style.fontSize = '14px';
        sceneText.style.fontWeight = 'bold';
        // DOM 요소가 존재하는지 확인 후 제거
        if (field.contains(ball)) {
            field.removeChild(ball);
        }
    }, 3000);
}

// BSO 전광판 업데이트
function updateBSODisplay() {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.attempts.length === 0) {
        // 현재 플레이어가 없거나 시도가 없으면 모든 LED 끄기
        resetBSODisplay();
        return;
    }
    
    const lastAttempt = currentPlayer.attempts[currentPlayer.attempts.length - 1];
    const balls = lastAttempt.ball;
    const strikes = lastAttempt.strike;
    
    // 볼 LED 업데이트 (녹색)
    updateLEDDisplay('balls-display', balls, 'led-balls');
    
    // 스트라이크 LED 업데이트 (노란색)
    updateLEDDisplay('strikes-display', strikes, 'led-strikes');
    
    // 아웃 시스템 제거됨
}

// LED 디스플레이 업데이트
function updateLEDDisplay(containerId, count, ledClass) {
    const container = document.getElementById(containerId);
    const leds = container.querySelectorAll('.led');
    
    leds.forEach((led, index) => {
        led.className = 'led';
        if (index < count) {
            led.classList.add(ledClass);
        } else {
            led.classList.add('led-off');
        }
    });
}

// BS 전광판 리셋
function resetBSDisplay() {
    updateLEDDisplay('balls-display', 0, 'led-balls');
    updateLEDDisplay('strikes-display', 0, 'led-strikes');
}

// 아웃 시스템 제거됨 - 더 이상 필요하지 않음

// 다음 플레이어로 이동
function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    currentTurn++;
    
    // 모든 플레이어가 한 번씩 돌았으면 회차 증가
    if (currentPlayerIndex === 0) {
        currentInning++;
    }
    
    updatePlayerStatus();
}

// 게임 시작
function startGame() {
    const playerCount = parseInt(playerCountSelect.value);
    
    // 플레이어 수 유효성 검사
    if (isNaN(playerCount) || playerCount < 1 || playerCount > 4) {
        alert('플레이어 수는 1-4명 사이로 선택해주세요.');
        return;
    }
    
    initializePlayers(playerCount);
    updatePlayerStatus();
    updateScoreboard(); // 점수판 초기화
    
    if (playerSetup) playerSetup.style.display = 'none';
    if (playerStatus) playerStatus.style.display = 'block';
    if (gameArea) gameArea.style.display = 'block';
    
    if (logs && players[currentPlayerIndex]) {
        logs.innerHTML = `<strong>${players[currentPlayerIndex].name}의 턴입니다!</strong><br>`;
    }
}

// 점수판 업데이트
function updateScoreboard() {
    let totalStrikeCount = 0;
    let totalBallCount = 0;
    let totalAttemptCount = 0;
    
    // 모든 플레이어의 시도 기록에서 통계 계산
    players.forEach(player => {
        player.attempts.forEach(attempt => {
            totalStrikeCount += attempt.strike;
            totalBallCount += attempt.ball;
            totalAttemptCount++;
        });
    });
    
    // 점수판 업데이트 (totalStrikes와 totalBalls는 BSO 전광판으로 대체됨)
    if (totalAttempts) {
        totalAttempts.textContent = totalAttemptCount;
    }
    
    // 회차 업데이트
    const inningElement = document.querySelector('.current-inning');
    
    if (inningElement) {
        inningElement.textContent = `${currentInning}회`;
    }
    
    // 플레이어별 점수 표시
    const playerCount = players.length;
    
    // 점수판 레이아웃 조정
    const firstScoreSection = document.querySelector('.score-section');
    const vsElement = firstScoreSection ? firstScoreSection.querySelector('.vs') : null;
    
    if (playerCount === 1) {
        // 1인: 플레이어1만 표시
        const firstTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:first-child') : null;
        const secondTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:last-child') : null;
        
        if (firstTeam) {
            const nameEl = firstTeam.querySelector('.team-name');
            const scoreEl = firstTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어1';
            if (scoreEl) scoreEl.textContent = players[0] ? players[0].attempts.length : '0';
        }
        
        if (secondTeam) {
            const nameEl = secondTeam.querySelector('.team-name');
            const scoreEl = secondTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '';
            if (scoreEl) scoreEl.textContent = '';
        }
        
        if (vsElement) vsElement.textContent = '';
        if (additionalPlayers) additionalPlayers.style.display = 'none';
    } else if (playerCount === 2) {
        // 2인: 플레이어1 vs 플레이어2
        const firstTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:first-child') : null;
        const secondTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:last-child') : null;
        
        if (firstTeam) {
            const nameEl = firstTeam.querySelector('.team-name');
            const scoreEl = firstTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어1';
            if (scoreEl) scoreEl.textContent = players[0] ? players[0].attempts.length : '0';
        }
        
        if (secondTeam) {
            const nameEl = secondTeam.querySelector('.team-name');
            const scoreEl = secondTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어2';
            if (scoreEl) scoreEl.textContent = players[1] ? players[1].attempts.length : '0';
        }
        
        if (vsElement) vsElement.textContent = 'VS';
        if (additionalPlayers) additionalPlayers.style.display = 'none';
    } else if (playerCount === 3) {
        // 3인: 플레이어1 vs 플레이어2, 플레이어3만
        const firstTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:first-child') : null;
        const secondTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:last-child') : null;
        
        if (firstTeam) {
            const nameEl = firstTeam.querySelector('.team-name');
            const scoreEl = firstTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어1';
            if (scoreEl) scoreEl.textContent = players[0] ? players[0].attempts.length : '0';
        }
        
        if (secondTeam) {
            const nameEl = secondTeam.querySelector('.team-name');
            const scoreEl = secondTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어2';
            if (scoreEl) scoreEl.textContent = players[1] ? players[1].attempts.length : '0';
        }
        
        if (vsElement) vsElement.textContent = 'VS';
        
        // 추가 플레이어 섹션에 플레이어3만 표시
        if (additionalPlayers) {
            additionalPlayers.style.display = 'flex';
            const addFirstTeam = additionalPlayers.querySelector('.team-score:first-child');
            const addSecondTeam = additionalPlayers.querySelector('.team-score:last-child');
            const addVs = additionalPlayers.querySelector('.vs');
            
            if (addFirstTeam) {
                const nameEl = addFirstTeam.querySelector('.team-name');
                const scoreEl = addFirstTeam.querySelector('.score');
                if (nameEl) nameEl.textContent = '플레이어3';
                if (scoreEl) scoreEl.textContent = players[2] ? players[2].attempts.length : '0';
            }
            
            if (addSecondTeam) {
                const nameEl = addSecondTeam.querySelector('.team-name');
                const scoreEl = addSecondTeam.querySelector('.score');
                if (nameEl) nameEl.textContent = '';
                if (scoreEl) scoreEl.textContent = '';
            }
            
            if (addVs) addVs.textContent = '';
        }
    } else if (playerCount === 4) {
        // 4인: 플레이어1 vs 플레이어2, 플레이어3 vs 플레이어4
        const firstTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:first-child') : null;
        const secondTeam = firstScoreSection ? firstScoreSection.querySelector('.team-score:last-child') : null;
        
        if (firstTeam) {
            const nameEl = firstTeam.querySelector('.team-name');
            const scoreEl = firstTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어1';
            if (scoreEl) scoreEl.textContent = players[0] ? players[0].attempts.length : '0';
        }
        
        if (secondTeam) {
            const nameEl = secondTeam.querySelector('.team-name');
            const scoreEl = secondTeam.querySelector('.score');
            if (nameEl) nameEl.textContent = '플레이어2';
            if (scoreEl) scoreEl.textContent = players[1] ? players[1].attempts.length : '0';
        }
        
        if (vsElement) vsElement.textContent = 'VS';
        
        // 추가 플레이어 섹션에 플레이어3 vs 플레이어4
        if (additionalPlayers) {
            additionalPlayers.style.display = 'flex';
            const addFirstTeam = additionalPlayers.querySelector('.team-score:first-child');
            const addSecondTeam = additionalPlayers.querySelector('.team-score:last-child');
            const addVs = additionalPlayers.querySelector('.vs');
            
            if (addFirstTeam) {
                const nameEl = addFirstTeam.querySelector('.team-name');
                const scoreEl = addFirstTeam.querySelector('.score');
                if (nameEl) nameEl.textContent = '플레이어3';
                if (scoreEl) scoreEl.textContent = players[2] ? players[2].attempts.length : '0';
            }
            
            if (addSecondTeam) {
                const nameEl = addSecondTeam.querySelector('.team-name');
                const scoreEl = addSecondTeam.querySelector('.score');
                if (nameEl) nameEl.textContent = '플레이어4';
                if (scoreEl) scoreEl.textContent = players[3] ? players[3].attempts.length : '0';
            }
            
            if (addVs) addVs.textContent = 'VS';
        }
    }
}

// 게임 리셋
function resetGame() {
    // 게임 상태 초기화
    gameStarted = false;
    gameEnded = false;
    players = [];
    currentPlayerIndex = 0;
    currentInning = 1;
    currentTurn = 0;
    tries.length = 0;
    
    // 입력 필드 초기화
    input.value = '';
    
    // 새로운 정답 생성
    const newAnswer = new Set();
    while (newAnswer.size < 4) {
        const randomNumber = Math.floor(Math.random() * 9) + 1;
        newAnswer.add(randomNumber);
    }
    const newAnswerArray = Array.from(newAnswer);
    
    // 정답 업데이트 (전역 변수는 직접 수정할 수 없으므로 새로 생성)
    answerArray.length = 0;
    answerArray.push(...newAnswerArray);
    
    // 전역 answer Set도 업데이트
    answer.clear();
    newAnswerArray.forEach(num => answer.add(num));
    
    // 정답 표시 업데이트
    document.getElementById('answer-text').textContent = answerArray.join('');
    
    // 점수판 초기화
    if (player1Score) player1Score.textContent = '0';
    if (player2Score) player2Score.textContent = '0';
    if (player3Score) player3Score.textContent = '0';
    if (player4Score) player4Score.textContent = '0';
    if (additionalPlayers) additionalPlayers.style.display = 'none';
    if (totalAttempts) totalAttempts.textContent = '0';
    
    // BS 전광판 초기화
    resetBSDisplay();
    
    // UI 초기화
    playerSetup.style.display = 'block';
    playerStatus.style.display = 'none';
    gameArea.style.display = 'none';
    logs.innerHTML = '';
    
    console.log('새로운 정답:', answerArray);
}

// ==============================
// 입력값 검증 함수
// ==============================

function checkInput(input) {
    // 빈 칸 체크
    if (input.trim() === '') {
        return alert("숫자를 입력해주세요.");
    }
    
    // 4자리 체크
    if (input.length !== 4) {
        return alert("4자리 숫자를 입력해주세요.");
    }
    
    // 숫자가 아닌 문자 체크
    if (!/^\d+$/.test(input)) {
        return alert("숫자만 입력해주세요.");
    }
    
    // 중복된 숫자 체크
    if (new Set(input).size !== 4) {
        return alert("중복된 숫자를 입력했습니다.");
    }
    
    // 이미 시도한 값 체크 - 문자열 값만 추출해서 비교
    const inputValues = tries.map(attempt => attempt.value);
    if (inputValues.includes(input)) {
        return alert("이미 시도한 값입니다.");
    }
    
    return true;
}

// ==============================
// 메인 게임 로직 - 폼 제출 이벤트 처리
// ==============================

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!gameStarted || gameEnded) {
        return;
    }

    const value = input.value;
    if (input) input.value = '';

    const valid = checkInput(value);
    if (!valid) {
        return;
    }

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) {
        console.error('현재 플레이어를 찾을 수 없습니다.');
        return;
    }

    // ==============================
    // 정답 확인
    // ==============================

    if (answerArray.join('') === value) {
        currentPlayer.isWinner = true;
        gameEnded = true;
        logs.innerHTML += `<strong>🎉 ${currentPlayer.name} 승리! 정답: ${value}</strong><br>`;
        
        // 홈런 연출
        showHomeRunAnimation();
        
        updatePlayerStatus();
        return;
    }

    // ==============================
    // 스트라이크와 볼 계산
    // ==============================

    let strike = 0;
    let ball = 0;

    for (let i = 0; i < answerArray.length; i++) {
        const index = value.indexOf(answerArray[i]);

        if (index === i) {
            // 같은 위치에 같은 숫자 = 스트라이크
            strike += 1;
        } 
        else if (index > -1) {
            // 다른 위치에 같은 숫자 = 볼
            ball += 1;
        }
        // index === -1인 경우는 해당 숫자가 없음 (아무것도 카운트하지 않음)
    }

    // ==============================
    // 결과 기록 및 표시
    // ==============================

    const attempt = {
        value: value,
        strike: strike,
        ball: ball,
        player: currentPlayer.name
    };

    currentPlayer.attempts.push(attempt);
    tries.push(attempt);

    if (logs) {
        logs.innerHTML += `<strong>${currentPlayer.name}:</strong> ${value} → ${strike} 스트라이크, ${ball} 볼<br>`;
    }

    // BS 전광판 업데이트
    updateBSODisplay();

    // 점수판 업데이트
    updateScoreboard();

    // ==============================
    // 다음 플레이어로 이동 또는 게임 종료
    // ==============================

    // 모든 플레이어가 9번 시도했는지 확인
    const allPlayersMaxAttempts = players.every(player => 
        player.attempts.length >= 9 || player.isWinner || player.isEliminated
    );

    if (allPlayersMaxAttempts) {
        gameEnded = true;
        const winners = players.filter(p => p.isWinner);
        if (winners.length === 0) {
            logs.innerHTML += `<strong>게임 종료! 정답은 ${answerArray.join('')}였습니다.</strong><br>`;
        }
        updatePlayerStatus();
        return;
    }

    // 다음 플레이어로 이동
    nextPlayer();
    if (logs && players[currentPlayerIndex]) {
        logs.innerHTML += `<strong>${players[currentPlayerIndex].name}의 턴입니다!</strong><br>`;
    }
});

// ==============================
// 게임 시작 및 리셋 이벤트
// ==============================

startGameBtn.addEventListener("click", startGame);
resetGameBtn.addEventListener("click", resetGame);