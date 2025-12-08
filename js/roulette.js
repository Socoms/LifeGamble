// 룰렛 게임 - Roulette Game

class RouletteGame {
    constructor() {
        // 룰렛 숫자 배열 (유럽식: 0-36)
        this.numbers = [
            { num: 0, color: 'green' },
            { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' },
            { num: 4, color: 'black' }, { num: 21, color: 'red' }, { num: 2, color: 'black' },
            { num: 25, color: 'red' }, { num: 17, color: 'black' }, { num: 34, color: 'red' },
            { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
            { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' },
            { num: 8, color: 'black' }, { num: 23, color: 'red' }, { num: 10, color: 'black' },
            { num: 5, color: 'red' }, { num: 24, color: 'black' }, { num: 16, color: 'red' },
            { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
            { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' },
            { num: 22, color: 'black' }, { num: 18, color: 'red' }, { num: 29, color: 'black' },
            { num: 7, color: 'red' }, { num: 28, color: 'black' }, { num: 12, color: 'red' },
            { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
        ];
        
        // 게임 상태
        this.bets = new Map(); // 배팅 정보 { betType: amount }
        this.selectedChip = 10; // 선택된 칩 값
        this.isSpinning = false;
        this.recentNumbers = [];
        this.gameHistory = [];
        this.finalWheelRotation = 0; // 휠의 최종 회전 각도
        this.winningNumber = null; // 당첨 숫자
        
        // 배팅 타입별 배당률
        this.payouts = {
            'straight': 35,      // 직접 배팅 (1개 숫자)
            'split': 17,         // 분할 배팅 (2개 숫자)
            'street': 11,        // 거리 배팅 (3개 숫자)
            'corner': 8,         // 코너 배팅 (4개 숫자)
            'line': 5,           // 라인 배팅 (6개 숫자)
            'dozen': 2,          // 더즌 (12개 숫자)
            'column': 2,         // 컬럼 (12개 숫자)
            'low': 1,            // 1-18
            'high': 1,           // 19-36
            'even': 1,           // 짝수
            'odd': 1,            // 홀수
            'red': 1,            // 빨강
            'black': 1           // 검정
        };
    }

    init() {
        this.createWheel();
        this.createNumberGrid();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // 게임 모드 선택 시 룰렛 설정
        document.querySelectorAll('.mode-card[data-mode="roulette"]').forEach(card => {
            card.addEventListener('click', () => {
                if (window.game) {
                    window.game.selectGameMode('roulette');
                }
            });
        });

        // 룰렛 게임 버튼들
        document.getElementById('showRouletteRulesBtn')?.addEventListener('click', () => this.showRules());
        document.getElementById('closeRouletteRules')?.addEventListener('click', () => this.hideRules());
        document.getElementById('backToMenuBtnRoulette')?.addEventListener('click', () => this.backToMenu());
        document.getElementById('spinRouletteBtn')?.addEventListener('click', () => this.spin());
        document.getElementById('clearRouletteBetsBtn')?.addEventListener('click', () => this.clearBets());
        document.getElementById('clearRouletteHistoryBtn')?.addEventListener('click', () => this.clearHistory());
        
        // 칩 선택
        document.querySelectorAll('.roulette-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const value = parseInt(chip.dataset.value);
                this.selectChip(value);
            });
        });
    }

    createWheel() {
        const wheel = document.getElementById('rouletteWheel');
        if (!wheel) return;
        
        wheel.innerHTML = '';
        
        // 룰렛 휠에 숫자 배치 (유럽식 룰렛 순서)
        // 각 숫자는 360/37 = 9.73도씩 회전
        const angleStep = 360 / 37;
        const radius = 42; // 휠 반지름의 42% 위치에 숫자 배치 (더 안쪽으로)
        
        this.numbers.forEach((item, index) => {
            const numberDiv = document.createElement('div');
            numberDiv.className = `wheel-number ${item.color}`;
            numberDiv.textContent = item.num;
            const angle = index * angleStep;
            const radian = (angle - 90) * Math.PI / 180; // -90도로 시작 (위쪽부터)
            
            // 원형 배치를 위한 위치 계산
            const x = 50 + radius * Math.cos(radian);
            const y = 50 + radius * Math.sin(radian);
            
            numberDiv.style.position = 'absolute';
            numberDiv.style.left = `${x}%`;
            numberDiv.style.top = `${y}%`;
            // 숫자를 읽기 쉽게 하기 위해 회전하지 않음
            numberDiv.style.transform = `translate(-50%, -50%)`;
            numberDiv.style.transformOrigin = 'center center';
            
            wheel.appendChild(numberDiv);
        });
    }

    createNumberGrid() {
        const grid = document.getElementById('numberGrid1-36');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 1-36 숫자를 3행 12열로 배치 (룰렛 테이블 순서)
        // 첫 번째 행: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
        // 두 번째 행: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
        // 세 번째 행: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
        const tableOrder = [
            [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
            [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
            [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
        ];
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 12; col++) {
                const num = tableOrder[row][col];
                const item = this.numbers.find(n => n.num === num);
                if (item) {
                    const cell = document.createElement('div');
                    cell.className = `number-cell ${item.color}`;
                    cell.textContent = num;
                    cell.dataset.number = num;
                    cell.addEventListener('click', () => this.placeBet('straight', num));
                    grid.appendChild(cell);
                }
            }
        }
        
        // 0 셀에 이벤트 리스너 추가
        const zeroCell = document.querySelector('.zero-cell');
        if (zeroCell) {
            zeroCell.addEventListener('click', () => this.placeBet('straight', 0));
        }
        
        // 외부 배팅 옵션에 이벤트 리스너 추가
        document.querySelectorAll('.outside-bet-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const betType = cell.dataset.bet;
                this.placeOutsideBet(betType);
            });
        });
    }

    selectChip(value) {
        this.selectedChip = value;
        document.querySelectorAll('.roulette-chip').forEach(chip => {
            chip.classList.remove('selected');
            if (parseInt(chip.dataset.value) === value) {
                chip.classList.add('selected');
            }
        });
    }

    placeBet(betType, number) {
        if (this.isSpinning) return;
        
        const betKey = `${betType}-${number}`;
        const currentBet = this.bets.get(betKey) || 0;
        const newBet = currentBet + this.selectedChip;
        
        if (window.game && newBet > window.game.money) {
            alert('학습 포인트가 부족합니다!');
            return;
        }
        
        this.bets.set(betKey, newBet);
        this.updateBetDisplay();
        this.updateDisplay();
    }

    placeOutsideBet(betType) {
        if (this.isSpinning) return;
        
        const currentBet = this.bets.get(betType) || 0;
        const newBet = currentBet + this.selectedChip;
        
        if (window.game && newBet > window.game.money) {
            alert('학습 포인트가 부족합니다!');
            return;
        }
        
        this.bets.set(betType, newBet);
        this.updateBetDisplay();
        this.updateDisplay();
        
        // 배팅된 셀 표시
        const cell = document.querySelector(`[data-bet="${betType}"]`);
        if (cell) {
            cell.classList.add('bet');
        }
    }

    updateBetDisplay() {
        // 숫자 셀에 배팅 표시
        this.bets.forEach((amount, betKey) => {
            const [betType, number] = betKey.split('-');
            if (betType === 'straight' && number !== undefined) {
                const cell = document.querySelector(`[data-number="${number}"]`);
                if (cell) {
                    cell.classList.add('bet');
                }
            }
        });
    }

    clearBets() {
        if (this.isSpinning) return;
        
        this.bets.clear();
        
        // 모든 배팅 표시 제거
        document.querySelectorAll('.number-cell.bet, .outside-bet-cell.bet').forEach(cell => {
            cell.classList.remove('bet');
        });
        
        this.updateDisplay();
    }

    spin() {
        if (this.isSpinning) return;
        
        if (this.bets.size === 0) {
            alert('배팅을 먼저 해주세요!');
            return;
        }
        
        // 총 배팅 금액 확인
        let totalBet = 0;
        this.bets.forEach(amount => {
            totalBet += amount;
        });
        
        if (window.game && totalBet > window.game.money) {
            alert('학습 포인트가 부족합니다!');
            return;
        }
        
        // 배팅 금액 차감
        if (window.game) {
            window.game.money -= totalBet;
            window.game.updateDisplay();
        }
        
        this.isSpinning = true;
        document.getElementById('spinRouletteBtn').disabled = true;
        document.getElementById('clearRouletteBetsBtn').disabled = true;
        
        // 랜덤 숫자 선택
        const winningNumber = Math.floor(Math.random() * 37);
        
        // 당첨 숫자의 인덱스 찾기
        const winningIndex = this.numbers.findIndex(n => n.num === winningNumber);
        
        // 룰렛 휠과 공 애니메이션
        const wheel = document.getElementById('rouletteWheel');
        const ball = document.getElementById('rouletteBall');
        
        if (wheel && ball) {
            // 회전 각도 계산 (당첨 숫자가 위쪽(0도)에 오도록)
            const angleStep = 360 / 37;
            const targetAngle = -(winningIndex * angleStep); // 음수로 회전 (시계 반대 방향)
            const fullRotations = 5 + Math.random() * 3; // 5-8회전
            const finalRotation = fullRotations * 360 + targetAngle;
            
            // 최종 회전 각도를 저장 (나중에 공 위치 계산에 사용)
            this.finalWheelRotation = finalRotation;
            this.winningNumber = winningNumber;
            
            // 공의 초기 위치 (휠 위쪽)
            ball.style.left = '50%';
            ball.style.top = '10px';
            ball.style.transform = 'translate(-50%, -50%)';
            
            // 1단계: 휠과 공이 함께 빠르게 회전 (2초)
            wheel.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
            wheel.style.transform = `rotate(${fullRotations * 360 * 0.6}deg)`;
            
            // 공도 휠과 함께 회전 (약간 더 빠르게)
            const ballInitialRotation = fullRotations * 360 * 0.6 * 1.1;
            ball.style.transition = 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)';
            ball.style.transform = `translate(-50%, -50%) rotate(${ballInitialRotation}deg)`;
            
            // 2단계: 공이 휠에서 떨어져 나와 주변을 돌기 시작 (1.5초)
            setTimeout(() => {
                // 공이 휠 주변을 도는 애니메이션
                const ballOrbitRotations = fullRotations * 360 * 0.4 + targetAngle;
                
                // 공의 최종 위치 계산
                const actualAngle = (winningIndex * angleStep + finalRotation) % 360;
                const radian = (actualAngle - 90) * Math.PI / 180;
                const radius = 42;
                const finalX = 50 + radius * Math.cos(radian);
                const finalY = 50 + radius * Math.sin(radian);
                
                // 공이 휠 주변을 도는 중간 경로 계산
                const midAngle1 = (ballInitialRotation + ballOrbitRotations * 0.3) % 360;
                const midRadian1 = (midAngle1 - 90) * Math.PI / 180;
                const midX1 = 50 + radius * Math.cos(midRadian1);
                const midY1 = 50 + radius * Math.sin(midRadian1);
                
                const midAngle2 = (ballInitialRotation + ballOrbitRotations * 0.7) % 360;
                const midRadian2 = (midAngle2 - 90) * Math.PI / 180;
                const midX2 = 50 + radius * Math.cos(midRadian2);
                const midY2 = 50 + radius * Math.sin(midRadian2);
                
                // CSS 키프레임 생성
                const styleId = 'roulette-ball-orbit-' + Date.now();
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    @keyframes ballOrbit {
                        0% { left: 50%; top: 10px; transform: translate(-50%, -50%) rotate(${ballInitialRotation}deg); }
                        30% { left: ${midX1}%; top: ${midY1}%; transform: translate(-50%, -50%) rotate(${ballInitialRotation + ballOrbitRotations * 0.3}deg); }
                        70% { left: ${midX2}%; top: ${midY2}%; transform: translate(-50%, -50%) rotate(${ballInitialRotation + ballOrbitRotations * 0.7}deg); }
                        100% { left: ${finalX}%; top: ${finalY}%; transform: translate(-50%, -50%) rotate(${ballInitialRotation + ballOrbitRotations}deg); }
                    }
                `;
                document.head.appendChild(style);
                
                ball.style.animation = `ballOrbit 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards`;
                
                // 휠은 계속 회전하여 최종 위치로
                wheel.style.transition = 'transform 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
                wheel.style.transform = `rotate(${finalRotation}deg)`;
                
                // 스타일 정리용 저장
                this.orbitStyleId = styleId;
            }, 2000);
            
            // 3단계: 공이 최종 위치에 멈춤 (0.5초)
            setTimeout(() => {
                // 공의 최종 위치 계산
                const actualAngle = (winningIndex * angleStep + finalRotation) % 360;
                const radian = (actualAngle - 90) * Math.PI / 180;
                const radius = 42;
                const x = 50 + radius * Math.cos(radian);
                const y = 50 + radius * Math.sin(radian);
                
                ball.style.animation = '';
                ball.style.transition = 'left 0.5s ease-out, top 0.5s ease-out, transform 0.5s ease-out';
                ball.style.left = `${x}%`;
                ball.style.top = `${y}%`;
                ball.style.transform = 'translate(-50%, -50%)';
            }, 3500);
        }
        
        // 4초 후 결과 처리
        setTimeout(() => {
            this.processResult(winningNumber);
        }, 4000);
    }

    processResult(winningNumber) {
        const wheel = document.getElementById('rouletteWheel');
        const ball = document.getElementById('rouletteBall');
        const winningDisplay = document.getElementById('winningNumber');
        
        // 동적 키프레임 제거
        if (this.orbitStyleId) {
            const orbitStyle = document.getElementById(this.orbitStyleId);
            if (orbitStyle) {
                orbitStyle.remove();
            }
        }
        
        const winningItem = this.numbers.find(n => n.num === winningNumber);
        if (winningDisplay && winningItem) {
            winningDisplay.textContent = winningNumber;
            winningDisplay.className = `winning-number-display ${winningItem.color}`;
        }
        
        // 애니메이션 완료 후 스타일 정리
        if (wheel) {
            wheel.style.transition = '';
        }
        if (ball) {
            ball.style.transition = '';
            ball.style.animation = '';
        }
        
        // 최근 결과에 추가
        this.recentNumbers.unshift(winningNumber);
        if (this.recentNumbers.length > 20) {
            this.recentNumbers.pop();
        }
        this.updateRecentNumbers();
        
        // 배팅 결과 계산
        let totalWin = 0;
        const betResults = [];
        
        this.bets.forEach((amount, betKey) => {
            const [betType, number] = betKey.split('-');
            let won = false;
            let payout = 0;
            
            if (betType === 'straight') {
                won = parseInt(number) === winningNumber;
                payout = won ? amount * (this.payouts.straight + 1) : 0;
            } else {
                won = this.checkOutsideBet(betType, winningNumber, winningItem);
                const payoutRate = this.payouts[betType] || 1;
                payout = won ? amount * (payoutRate + 1) : 0;
            }
            
            if (won) {
                totalWin += payout;
            }
            
            betResults.push({
                bet: betKey,
                amount: amount,
                won: won,
                payout: payout
            });
        });
        
        // 승리 금액 추가
        if (window.game && totalWin > 0) {
            window.game.money += totalWin;
            window.game.updateDisplay();
        }
        
        // 게임 기록 저장
        const gameResult = {
            number: winningNumber,
            color: winningItem.color,
            bets: betResults,
            totalBet: Array.from(this.bets.values()).reduce((a, b) => a + b, 0),
            totalWin: totalWin,
            profit: totalWin - Array.from(this.bets.values()).reduce((a, b) => a + b, 0),
            timestamp: new Date()
        };
        
        this.gameHistory.unshift(gameResult);
        if (this.gameHistory.length > 50) {
            this.gameHistory.pop();
        }
        
        // 통계 저장
        if (window.game && window.authManager) {
            const result = totalWin > 0 ? { win: true, loss: false } : { win: false, loss: true };
            window.game.saveGameData('roulette', result);
        }
        
        this.updateHistory();
        this.clearBets();
        
        this.isSpinning = false;
        document.getElementById('spinRouletteBtn').disabled = false;
        document.getElementById('clearRouletteBetsBtn').disabled = false;
        
        // 결과 알림
        if (totalWin > 0) {
            alert(`축하합니다! ${winningNumber}번이 당첨되었습니다!\n승리 금액: ${totalWin}P`);
        } else {
            alert(`아쉽네요! ${winningNumber}번이 나왔습니다.`);
        }
    }

    checkOutsideBet(betType, winningNumber, winningItem) {
        switch (betType) {
            case '1st12':
                return winningNumber >= 1 && winningNumber <= 12;
            case '2nd12':
                return winningNumber >= 13 && winningNumber <= 24;
            case '3rd12':
                return winningNumber >= 25 && winningNumber <= 36;
            case 'col1':
                return [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(winningNumber);
            case 'col2':
                return [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(winningNumber);
            case 'col3':
                return [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(winningNumber);
            case '1-18':
                return winningNumber >= 1 && winningNumber <= 18;
            case '19-36':
                return winningNumber >= 19 && winningNumber <= 36;
            case 'even':
                return winningNumber !== 0 && winningNumber % 2 === 0;
            case 'odd':
                return winningNumber !== 0 && winningNumber % 2 === 1;
            case 'red':
                return winningItem.color === 'red';
            case 'black':
                return winningItem.color === 'black';
            default:
                return false;
        }
    }

    updateRecentNumbers() {
        const container = document.getElementById('rouletteRecentNumbers');
        if (!container) return;
        
        container.innerHTML = '';
        this.recentNumbers.forEach(num => {
            const item = this.numbers.find(n => n.num === num);
            const div = document.createElement('div');
            div.className = `recent-number ${item.color}`;
            div.textContent = num;
            container.appendChild(div);
        });
    }

    updateHistory() {
        const container = document.getElementById('rouletteHistoryResults');
        if (!container) return;
        
        container.innerHTML = '';
        this.gameHistory.slice(0, 10).forEach(result => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const profitText = result.profit >= 0 ? 
                `<span style="color: #28a745;">+${result.profit}P</span>` : 
                `<span style="color: #ff6b6b;">${result.profit}P</span>`;
            div.innerHTML = `${result.number} (${result.color}) - 배팅: ${result.totalBet}P, 승리: ${result.totalWin}P, ${profitText}`;
            container.appendChild(div);
        });
    }

    clearHistory() {
        this.gameHistory = [];
        this.updateHistory();
    }

    updateDisplay() {
        // 배팅 요약 업데이트
        const summary = document.getElementById('rouletteBetSummary');
        const totalBet = document.getElementById('rouletteTotalBet');
        
        if (summary) {
            summary.innerHTML = '';
            let total = 0;
            
            this.bets.forEach((amount, betKey) => {
                total += amount;
                const div = document.createElement('div');
                div.className = 'bet-item';
                div.textContent = `${betKey}: ${amount}P`;
                summary.appendChild(div);
            });
            
            if (total === 0) {
                summary.innerHTML = '<div style="color: #888; text-align: center;">배팅이 없습니다</div>';
            }
        }
        
        if (totalBet) {
            const total = Array.from(this.bets.values()).reduce((a, b) => a + b, 0);
            totalBet.textContent = `${total}P`;
        }
    }

    showRules() {
        const modal = document.getElementById('rouletteRulesModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideRules() {
        const modal = document.getElementById('rouletteRulesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    backToMenu() {
        if (window.game) {
            window.game.backToMenu();
        }
    }

    getCurrentWheelRotation(wheel) {
        if (!wheel) return 0;
        const style = window.getComputedStyle(wheel);
        const matrix = style.transform || style.webkitTransform || style.mozTransform;
        if (matrix === 'none') return 0;
        
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        return angle < 0 ? angle + 360 : angle;
    }

    reset() {
        this.bets.clear();
        this.isSpinning = false;
        
        // 휠과 공 초기화
        const wheel = document.getElementById('rouletteWheel');
        const ball = document.getElementById('rouletteBall');
        if (wheel) {
            wheel.style.transform = 'rotate(0deg)';
            wheel.style.transition = '';
        }
        if (ball) {
            ball.style.transform = 'translateX(-50%)';
            ball.style.transition = '';
            ball.style.left = '50%';
            ball.style.top = '10px';
        }
        
        this.updateDisplay();
        this.clearBets();
    }
}

// 전역 룰렛 게임 인스턴스
let rouletteGame = null;

