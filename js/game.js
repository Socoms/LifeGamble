// 확률과 전략 학습 게임 - Probability & Strategy Learning

class RoyalCasino {
    constructor() {
        // 게임 상태
        this.money = 1000;
        this.winCount = 0;
        this.selectedMode = null;
        this.selectedChip = 10;
        this.userGameData = null; // 유저 게임 데이터
        
        // 바카라 게임 상태
        this.deckId = null;
        this.playerCards = [];
        this.bankerCards = [];
        this.gamePhase = 'betting'; // betting, dealing, finished
        this.bets = { player: 0, banker: 0, tie: 0 };
        this.lastBets = { player: 0, banker: 0, tie: 0 };
        this.gameHistory = [];
        this.timer = null;
        this.timeLeft = 30;
        
        // 다이스 게임 상태
        this.diceBetAmount = 10;
        this.diceSelectedNumber = 50;
        this.diceBetType = null; // 'smaller' or 'larger'
        this.diceHistory = [];
        this.diceRecentResults = [];
        this.diceGamePhase = 'betting';
        
        // 하이로우 게임 상태
        this.hiloCurrentCard = null;
        this.hiloDrawnCards = [];
        this.hiloBets = { higher: 0, lower: 0 };
        this.hiloBetAmount = 0;
        this.hiloSelectedChip = 10;
        this.hiloGamePhase = 'waiting'; // waiting, betting, result
        this.hiloHistory = [];
        this.hiloRemainingCards = 52;
        
        // 사운드 설정
        this.bgMusicEnabled = false;
        this.soundEffectsEnabled = true;
        this.bgMusic = document.getElementById('bgMusic');
        this.winSound = document.getElementById('winSound');
        this.loseSound = document.getElementById('loseSound');
        this.cardDealSound = document.getElementById('cardDealSound');
        this.diceRollSound = document.getElementById('diceRollSound');
        
        // 다이스 API 설정
        this.useDiceAPI = true; // Random.org API 사용 여부
        this.diceAPIKey = null; // API 키 (필요시)
        
        this.init();
    }

    init() {
        console.log('📊 확률과 전략 학습 게임 시작!');
        this.setupEventListeners();
        this.updateDisplay();
        this.showMessage('📊 학습 모드를 선택하세요!');
    }

    setupEventListeners() {
        // 게임 모드 선택
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.selectGameMode(mode);
            });
        });

        // 게임별 이벤트 리스너는 각각의 setup 함수에서 설정

        // 컨트롤 버튼들
        document.getElementById('clearBetsBtn')?.addEventListener('click', () => this.clearBets());
        document.getElementById('repeatBetBtn')?.addEventListener('click', () => this.repeatLastBet());
        document.getElementById('dealCardsBtn')?.addEventListener('click', () => this.startGame());
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => this.clearHistory());

        // 기타 버튼들
        document.getElementById('showRulesBtn')?.addEventListener('click', () => this.showGameRules());
        document.getElementById('showBlackjackRulesBtn')?.addEventListener('click', () => this.showBlackjackRules());
        document.getElementById('showProbabilityBtn')?.addEventListener('click', () => this.showProbabilityModal());
        document.getElementById('showBlackjackStrategyBtn')?.addEventListener('click', () => this.showStrategyModal());
        document.getElementById('closeRules')?.addEventListener('click', () => this.hideGameRules());
        document.getElementById('closeProbability')?.addEventListener('click', () => this.hideProbabilityModal());
        document.getElementById('closeStrategy')?.addEventListener('click', () => this.hideStrategyModal());
        document.getElementById('playAgainBtn')?.addEventListener('click', () => this.newRound());
        document.getElementById('backToMenuBtn')?.addEventListener('click', () => {
            console.log('backToMenuBtn 클릭됨');
            this.backToMenu();
        });
        const backToMenuBtnDice = document.getElementById('backToMenuBtnDice');
        if (backToMenuBtnDice) {
            backToMenuBtnDice.addEventListener('click', () => {
                console.log('backToMenuBtnDice 클릭됨');
                this.backToMenu();
            });
        } else {
            console.warn('backToMenuBtnDice 버튼을 찾을 수 없습니다');
        }
        const backToMenuBtnHilo = document.getElementById('backToMenuBtnHilo');
        if (backToMenuBtnHilo) {
            backToMenuBtnHilo.addEventListener('click', () => {
                console.log('backToMenuBtnHilo 클릭됨');
                this.backToMenu();
            });
        } else {
            console.warn('backToMenuBtnHilo 버튼을 찾을 수 없습니다');
        }
        
        // 다이스 게임 버튼들
        document.getElementById('showDiceRulesBtn')?.addEventListener('click', () => this.showDiceRules());
        document.getElementById('showDiceProbabilityBtn')?.addEventListener('click', () => this.showDiceProbability());
        document.getElementById('closeDiceRules')?.addEventListener('click', () => this.hideDiceRules());
        document.getElementById('clearDiceBetsBtn')?.addEventListener('click', () => this.clearDiceBets());
        document.getElementById('repeatDiceBetBtn')?.addEventListener('click', () => this.repeatDiceBet());
        document.getElementById('rollDiceBtn')?.addEventListener('click', () => this.rollDice());
        document.getElementById('clearDiceHistoryBtn')?.addEventListener('click', () => this.clearDiceHistory());
        
        // 하이로우 게임 버튼들
        document.getElementById('showHiloRulesBtn')?.addEventListener('click', () => this.showHiloRules());
        document.getElementById('showHiloProbabilityBtn')?.addEventListener('click', () => this.showHiloProbability());
        document.getElementById('closeHiloRules')?.addEventListener('click', () => this.hideHiloRules());
        document.getElementById('startHiloBtn')?.addEventListener('click', () => this.startHilo());
        document.getElementById('drawNextCardBtn')?.addEventListener('click', () => this.drawNextHiloCard());
        document.getElementById('changeCardBtn')?.addEventListener('click', () => this.changeHiloCard());
        document.getElementById('clearHiloBetsBtn')?.addEventListener('click', () => this.clearHiloBets());
        document.getElementById('hiloHalfBtn')?.addEventListener('click', () => this.hiloHalfBet());
        document.getElementById('hiloDoubleBtn')?.addEventListener('click', () => this.hiloDoubleBet());
        document.getElementById('clearHiloHistoryBtn')?.addEventListener('click', () => this.clearHiloHistory());
        
        // 사운드 컨트롤
        document.getElementById('bgMusicToggle')?.addEventListener('click', () => this.toggleBgMusic());
        document.getElementById('soundEffectsToggle')?.addEventListener('click', () => this.toggleSoundEffects());
    }

    selectGameMode(mode) {
        // 게임 모드 전환 전 현재 포인트 저장
        if (window.authManager && window.authManager.currentUser && this.selectedMode) {
            const currentMode = this.selectedMode;
            if (currentMode === 'baccarat') {
                this.saveGameData('baccarat', { win: false, loss: false, tie: false });
            } else if (currentMode === 'blackjack') {
                this.saveGameData('blackjack', { win: false, loss: false, push: false, blackjack: false });
            } else if (currentMode === 'dice') {
                this.saveGameData('dice', { win: false, loss: false });
            } else if (currentMode === 'hilo') {
                this.saveGameData('hilo', { win: false, loss: false, tie: false });
            } else if (currentMode === 'holdem') {
                // 홀덤은 멀티플레이어이므로 별도 처리
            }
        }
        
        this.selectedMode = mode;
        
        // 모든 게임 영역 숨기기
        this.hideAllGameAreas();
        
        // 메인 메뉴 숨기기
        document.getElementById('modeSelection').style.display = 'none';
        
        if (mode === 'baccarat') {
            this.setupBaccarat();
            const baccaratArea = document.getElementById('baccaratGameArea');
            if (baccaratArea) {
                baccaratArea.style.display = 'block';
                baccaratArea.style.visibility = 'visible';
                baccaratArea.style.opacity = '1';
                console.log('바카라 게임 영역 표시:', baccaratArea.style.display);
            }
            this.initializeDeck();
        } else if (mode === 'blackjack') {
            this.setupBlackjack();
            const blackjackArea = document.getElementById('blackjackGameArea');
            if (blackjackArea) {
                blackjackArea.style.display = 'block';
                blackjackArea.style.visibility = 'visible';
                blackjackArea.style.opacity = '1';
                console.log('블랙잭 게임 영역 표시:', blackjackArea.style.display);
            }
            this.initializeDeck();
        } else if (mode === 'dice') {
            this.setupDice();
            const diceArea = document.getElementById('diceGameArea');
            if (diceArea) {
                diceArea.style.display = 'block';
                diceArea.style.visibility = 'visible';
                diceArea.style.opacity = '1';
                console.log('다이스 게임 영역 표시:', diceArea.style.display);
            }
        } else if (mode === 'hilo') {
            this.setupHilo();
            const hiloArea = document.getElementById('hiloGameArea');
            if (hiloArea) {
                hiloArea.style.display = 'block';
                hiloArea.style.visibility = 'visible';
                hiloArea.style.opacity = '1';
                console.log('하이로우 게임 영역 표시:', hiloArea.style.display);
            }
            this.initializeDeck();
        } else if (mode === 'holdem') {
            this.setupHoldem();
            const holdemArea = document.getElementById('holdemGameArea');
            if (holdemArea) {
                holdemArea.style.display = 'block';
                holdemArea.style.visibility = 'visible';
                holdemArea.style.opacity = '1';
                console.log('홀덤 게임 영역 표시:', holdemArea.style.display);
            }
        }
        
        // 포인트는 유지되므로 업데이트만
        this.updateDisplay();
    }

    hideAllGameAreas() {
        // 모든 게임 관련 영역 숨기기
        const gameAreas = [
            'game-area',
            'baccaratGameArea', 
            'blackjackGameArea',
            'diceGameArea',
            'hiloGameArea',
            'holdemGameArea',
            'gameRules',
            'gameResult'
        ];
        
        gameAreas.forEach(areaId => {
            const element = document.getElementById(areaId);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    setupBaccarat() {
        console.log('바카라 설정 시작');
        const currentGameEl = document.getElementById('currentGame');
        if (currentGameEl) {
            currentGameEl.textContent = '바카라 확률 학습';
        }
        
        // 바카라 전용 변수 초기화
        this.gamePhase = 'betting';
        this.selectedChip = 10;
        this.bets = { player: 0, banker: 0, tie: 0 };
        
        this.setupBaccaratEventListeners();
        this.showMessage('📊 학습 포인트를 선택하고 전략을 테스트하세요!');
        this.updateProbabilityDisplay();
        this.gamePhase = 'betting';
        this.enableBettingControls();
        const gamePhaseTextEl = document.getElementById('gamePhaseText');
        if (gamePhaseTextEl) {
            gamePhaseTextEl.textContent = '전략 선택 시간';
        }
        const gameTimerEl = document.getElementById('gameTimer');
        if (gameTimerEl) {
            gameTimerEl.textContent = '-';
        }
        console.log('바카라 설정 완료');
    }

    setupBaccaratEventListeners() {
        console.log('바카라 이벤트 리스너 설정');
        
        // 바카라 칩 선택 (바카라 영역 내의 .chip만)
        const baccaratChips = document.querySelectorAll('#baccaratGameArea .chip');
        console.log('바카라 칩 개수:', baccaratChips.length);
        
        baccaratChips.forEach((chip, index) => {
            console.log(`바카라 칩 ${index}:`, chip.dataset.value);
            chip.addEventListener('click', () => {
                console.log('바카라 칩 클릭됨:', chip.dataset.value);
                this.selectChip(parseInt(chip.dataset.value));
            });
        });

        // 바카라 배팅 영역 클릭
        const betAreas = document.querySelectorAll('#baccaratGameArea .bet-area');
        console.log('바카라 배팅 영역 개수:', betAreas.length);
        
        betAreas.forEach(area => {
            area.addEventListener('click', () => {
                const betType = area.dataset.bet;
                console.log('바카라 배팅 영역 클릭됨:', betType);
                this.placeBet(betType);
            });
        });
    }

    setupBlackjack() {
        console.log('블랙잭 설정 시작');
        const currentGameEl = document.getElementById('currentGame');
        if (currentGameEl) {
            currentGameEl.textContent = '블랙잭 전략 학습';
        }
        
        // 블랙잭 전용 변수 초기화
        this.bjStats = { wins: 0, losses: 0, pushes: 0, blackjacks: 0 };
        this.bjCurrentBet = 0;
        this.bjSelectedChip = 10; // 기본 칩 값을 10으로 설정
        this.bjGamePhase = 'betting'; // betting, playing, finished
        this.bjPlayerCards = [];
        this.bjDealerCards = [];
        this.bjDealerHidden = true;
        
        console.log('블랙잭 이벤트 리스너 설정 중...');
        this.setupBlackjackEventListeners();
        this.bjGamePhase = 'betting';
        const bjGamePhaseTextEl = document.getElementById('bjGamePhaseText');
        if (bjGamePhaseTextEl) {
            bjGamePhaseTextEl.textContent = '전략 선택 시간';
        }
        const bjGameTimerEl = document.getElementById('bjGameTimer');
        if (bjGameTimerEl) {
            bjGameTimerEl.textContent = '-';
        }
        this.showMessage('📊 학습 포인트를 선택하고 전략을 테스트하세요!');
        console.log('블랙잭 설정 완료');
    }

    setupBlackjackEventListeners() {
        // 칩 선택 (블랙잭용)
        const bjChips = document.querySelectorAll('.bj-chip');
        console.log('블랙잭 칩 개수:', bjChips.length);
        
        bjChips.forEach((chip, index) => {
            console.log(`칩 ${index}:`, chip.dataset.value);
            chip.addEventListener('click', () => {
                console.log('칩 클릭됨:', chip.dataset.value);
                this.selectBlackjackChip(parseInt(chip.dataset.value));
            });
        });

        // 배팅 영역 클릭 (칩 배치) - 배팅 디스플레이 영역 전체를 클릭 가능하게
        const betDisplayArea = document.querySelector('.bet-circle');
        console.log('배팅 영역 요소:', betDisplayArea);
        if (betDisplayArea) {
            betDisplayArea.addEventListener('click', () => {
                console.log('배팅 영역 클릭됨');
                this.placeBlackjackBet();
            });
            betDisplayArea.style.cursor = 'pointer';
        } else {
            console.error('.bet-circle 요소를 찾을 수 없음');
        }

        // 액션 버튼들
        const bjDealBtn = document.getElementById('bjDealBtn');
        const bjHitBtn = document.getElementById('bjHitBtn');
        const bjStandBtn = document.getElementById('bjStandBtn');
        const bjDoubleBtn = document.getElementById('bjDoubleBtn');
        
        console.log('블랙잭 버튼들:', {
            bjDealBtn: !!bjDealBtn,
            bjHitBtn: !!bjHitBtn,
            bjStandBtn: !!bjStandBtn,
            bjDoubleBtn: !!bjDoubleBtn
        });
        
        if (bjDealBtn) bjDealBtn.addEventListener('click', () => {
            console.log('딜 버튼 클릭됨');
            this.dealBlackjack();
        });
        if (bjHitBtn) bjHitBtn.addEventListener('click', () => {
            console.log('히트 버튼 클릭됨');
            this.hitBlackjack();
        });
        if (bjStandBtn) bjStandBtn.addEventListener('click', () => {
            console.log('스탠드 버튼 클릭됨');
            this.standBlackjack();
        });
        if (bjDoubleBtn) bjDoubleBtn.addEventListener('click', () => {
            console.log('더블다운 버튼 클릭됨');
            this.doubleDownBlackjack();
        });
        
        // 중복 제거됨 - 위의 selectBlackjackChip 이벤트 리스너만 사용
        document.getElementById('splitBtnBJ')?.addEventListener('click', () => this.splitBlackjack());

        // 컨트롤 버튼들
        document.getElementById('clearBetBtnBJ')?.addEventListener('click', () => this.clearBlackjackBet());
        document.getElementById('repeatBetBtnBJ')?.addEventListener('click', () => this.repeatBlackjackBet());
        document.getElementById('newGameBtnBJ')?.addEventListener('click', () => this.newBlackjackGame());

        // 규칙 버튼
        document.getElementById('showBlackjackRulesBtn')?.addEventListener('click', () => this.showBlackjackRules());
    }

    selectBlackjackChip(value) {
        console.log('칩 선택 함수 호출:', value, '현재 자금:', this.money);
        
        if (value > this.money) {
            this.showMessage('❌ 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        this.bjSelectedChip = value;
        
        // 칩 선택 표시
        document.querySelectorAll('.bj-chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        const selectedChip = document.querySelector(`.bj-chip[data-value="${value}"]`);
        if (selectedChip) {
            selectedChip.classList.add('selected');
            console.log('칩 선택 표시 완료');
        } else {
            console.log('칩 요소를 찾을 수 없음:', `.bj-chip[data-value="${value}"]`);
        }
        
        this.showMessage(`📊 ${value}P 학습 포인트가 선택되었습니다! 전략 영역을 클릭하세요.`, 'success');
        console.log('선택된 칩:', this.bjSelectedChip);
    }

    placeBlackjackBet(amount = null) {
        console.log('배팅 시도:', amount, '게임 페이즈:', this.bjGamePhase, '선택된 칩:', this.bjSelectedChip);
        
        if (this.bjGamePhase !== 'betting') {
            this.showMessage('❌ 배팅 시간이 아닙니다!', 'danger');
            return;
        }

        // amount가 전달되면 해당 금액으로 배팅, 아니면 선택된 칩으로 배팅
        const betAmount = amount || this.bjSelectedChip;
        
        if (!betAmount) {
            this.showMessage('❌ 학습 포인트를 먼저 선택하세요!', 'danger');
            return;
        }

        if (betAmount > this.money) {
            this.showMessage('❌ 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        this.bjCurrentBet += betAmount;
        this.money -= betAmount;
        
        console.log('배팅 완료:', betAmount, '총 배팅:', this.bjCurrentBet);
        
        // 블랙잭 칩 스택 표시
        this.displayBlackjackBetChips();
        this.updateDisplay();
        
        this.showMessage(`📊 ${betAmount}P 전략 포인트 추가! 총 전략 포인트: ${this.bjCurrentBet}P`, 'success');
        
        // 배팅이 있으면 딜 버튼 활성화
        if (this.bjCurrentBet > 0) {
            const bjDealBtn = document.getElementById('bjDealBtn');
            if (bjDealBtn) bjDealBtn.style.display = 'inline-block';
        }
    }

    startBlackjackBettingTimer() {
        // 타이머 제거됨 - 사용자가 원하는 시간에 게임 시작 가능
        this.bjGamePhase = 'betting';
        document.getElementById('bjGamePhaseText').textContent = '전략 선택 시간';
        document.getElementById('bjGameTimer').textContent = '-';
    }

    endBlackjackBettingTime() {
        // 타이머 제거됨 - 이 함수는 더 이상 사용되지 않음
    }

    async dealBlackjack() {
        if (this.bjCurrentBet === 0) {
            this.showMessage('❌ 전략을 먼저 선택하세요!', 'danger');
            return;
        }

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.bjGamePhase = 'playing';
        
        // 버튼 상태 변경
        const bjDealBtn = document.getElementById('bjDealBtn');
        if (bjDealBtn) bjDealBtn.style.display = 'none';
        
        document.getElementById('bjGamePhaseText').textContent = '게임 진행';
        document.getElementById('bjGameTimer').textContent = '진행중';
        this.showMessage('🎴 시뮬레이션을 진행하고 있습니다...', 'info');
        
        // 카드 초기화
        this.bjPlayerCards = [];
        this.bjDealerCards = [];
        this.bjDealerHidden = true;
        this.clearBlackjackCardSlots();
        
        // 초기 카드 4장 딜링 (플레이어-딜러-플레이어-딜러 순서)
        const cards = await this.drawCards(4);
        
        this.bjPlayerCards = [cards[0], cards[2]];
        this.bjDealerCards = [cards[1], cards[3]];
        
        // 카드 표시
        await this.displayBlackjackCards();
        
        // 점수 계산
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        const dealerScore = this.calculateBlackjackScore([this.bjDealerCards[0]]); // 첫 번째 카드만
        
        this.updateBlackjackScores();
        
        // 블랙잭 체크
        if (playerScore === 21) {
            const dealerFullScore = this.calculateBlackjackScore(this.bjDealerCards);
            if (dealerFullScore === 21) {
                this.showMessage('🤝 둘 다 블랙잭! 푸시!', 'warning');
                this.processBlackjackResult('push');
            } else {
                this.showMessage('🎉 블랙잭! 1.5배 배당!', 'success');
                this.processBlackjackResult('blackjack');
            }
        } else {
            this.showMessage(`현재 점수: ${playerScore}. 액션을 선택하세요.`, 'info');
            this.showBlackjackActionButtons();
        }
    }

    async displayBlackjackCards() {
        const playerSlots = document.querySelectorAll('#bjPlayerCards .card-slot');
        const dealerSlots = document.querySelectorAll('#dealerCards .card-slot');
        
        // 플레이어 카드 표시
        for (let i = 0; i < this.bjPlayerCards.length; i++) {
            await this.dealBlackjackCardToSlot(this.bjPlayerCards[i], playerSlots[i]);
            await this.delay(300);
        }
        
        // 딜러 카드 표시 (첫 번째는 공개, 두 번째는 숨김)
        for (let i = 0; i < this.bjDealerCards.length; i++) {
            if (i === 1 && this.bjDealerHidden) {
                // 두 번째 카드는 뒷면으로 표시
                await this.dealHiddenCardToSlot(dealerSlots[i]);
            } else {
                await this.dealBlackjackCardToSlot(this.bjDealerCards[i], dealerSlots[i]);
            }
            await this.delay(300);
        }
    }

    async dealBlackjackCardToSlot(card, slot) {
        slot.classList.remove('empty', 'hidden');
        slot.innerHTML = '';
        
        const cardImg = document.createElement('img');
        cardImg.src = card.image;
        cardImg.alt = `${card.value} of ${card.suit}`;
        cardImg.style.opacity = '0';
        cardImg.style.transform = 'translateY(-50px) rotateY(180deg) scale(0.8)';
        cardImg.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        slot.appendChild(cardImg);
        
        // 카드 딜링 사운드
        this.playSound('card');
        
        setTimeout(() => {
            cardImg.style.opacity = '1';
            cardImg.style.transform = 'translateY(0) rotateY(0deg) scale(1)';
        }, 100);
        
        return new Promise(resolve => setTimeout(resolve, 600));
    }

    async dealHiddenCardToSlot(slot) {
        slot.classList.remove('empty');
        slot.classList.add('hidden');
        slot.innerHTML = '';
        
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    clearBlackjackCardSlots() {
        const allSlots = document.querySelectorAll('#blackjackGameArea .card-slot');
        allSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.add('empty');
            slot.classList.remove('hidden');
        });
        
        document.getElementById('bjPlayerScore').textContent = '-';
        document.getElementById('dealerScore').textContent = '-';
    }

    updateBlackjackScores() {
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        const dealerScore = this.bjDealerHidden ? 
            this.calculateBlackjackScore([this.bjDealerCards[0]]) : 
            this.calculateBlackjackScore(this.bjDealerCards);
        
        const playerScoreElement = document.getElementById('bjPlayerScore');
        const dealerScoreElement = document.getElementById('dealerScore');
        
        playerScoreElement.textContent = playerScore;
        playerScoreElement.className = 'score-display-bj';
        
        if (playerScore === 21 && this.bjPlayerCards.length === 2) {
            playerScoreElement.classList.add('blackjack');
        } else if (playerScore > 21) {
            playerScoreElement.classList.add('bust');
        }
        
        dealerScoreElement.textContent = this.bjDealerHidden ? '?' : dealerScore;
        dealerScoreElement.className = 'score-display-bj';
        
        if (!this.bjDealerHidden) {
            if (dealerScore === 21 && this.bjDealerCards.length === 2) {
                dealerScoreElement.classList.add('blackjack');
            } else if (dealerScore > 21) {
                dealerScoreElement.classList.add('bust');
            }
        }
    }

    showBlackjackActionButtons() {
        console.log('블랙잭 액션 버튼들 표시');
        const hitBtn = document.getElementById('bjHitBtn');
        const standBtn = document.getElementById('bjStandBtn');
        
        if (hitBtn) {
            hitBtn.style.display = 'inline-block';
            console.log('히트 버튼 표시됨');
        }
        if (standBtn) {
            standBtn.style.display = 'inline-block';
            console.log('스탠드 버튼 표시됨');
        }
        
        // 더블다운은 카드 2장이고 자금이 충분할 때만
        if (this.bjPlayerCards.length === 2 && this.money >= this.bjCurrentBet) {
            document.getElementById('bjDoubleBtn').style.display = 'inline-block';
        }
        
        // 스플릿은 같은 값의 카드 2장일 때만
        if (this.bjPlayerCards.length === 2 && 
            this.getBlackjackCardValue(this.bjPlayerCards[0]) === this.getBlackjackCardValue(this.bjPlayerCards[1]) &&
            this.money >= this.bjCurrentBet) {
            const splitBtn = document.getElementById('splitBtnBJ');
            if (splitBtn) splitBtn.style.display = 'inline-block';
        }
    }

    hideBlackjackActionButtons() {
        console.log('블랙잭 액션 버튼들 숨김');
        
        const bjHitBtn = document.getElementById('bjHitBtn');
        const bjStandBtn = document.getElementById('bjStandBtn');
        const bjDoubleBtn = document.getElementById('bjDoubleBtn');
        const splitBtnBJ = document.getElementById('splitBtnBJ');
        
        if (bjHitBtn) bjHitBtn.style.display = 'none';
        if (bjStandBtn) bjStandBtn.style.display = 'none';
        if (bjDoubleBtn) bjDoubleBtn.style.display = 'none';
        if (splitBtnBJ) splitBtnBJ.style.display = 'none';
    }

    async hitBlackjack() {
        const newCards = await this.drawCards(1);
        this.bjPlayerCards.push(newCards[0]);
        
        // 새 카드 표시
        const playerSlots = document.querySelectorAll('#bjPlayerCards .card-slot');
        const emptySlot = Array.from(playerSlots).find(slot => slot.classList.contains('empty'));
        if (emptySlot) {
            await this.dealBlackjackCardToSlot(newCards[0], emptySlot);
        }
        
        this.updateBlackjackScores();
        
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        
        if (playerScore > 21) {
            this.showMessage(`💀 버스트! 점수: ${playerScore}`, 'danger');
            this.hideBlackjackActionButtons();
            setTimeout(() => this.processBlackjackResult('bust'), 1500);
        } else if (playerScore === 21) {
            this.showMessage(`🎯 21! 자동 스탠드`, 'success');
            this.hideBlackjackActionButtons();
            setTimeout(() => this.standBlackjack(), 1000);
        } else {
            this.showMessage(`현재 점수: ${playerScore}`, 'info');
            // 더블다운과 스플릿 버튼 숨기기 (히트 후에는 불가능)
            const bjDoubleBtn = document.getElementById('bjDoubleBtn');
            const splitBtnBJ = document.getElementById('splitBtnBJ');
            if (bjDoubleBtn) bjDoubleBtn.style.display = 'none';
            if (splitBtnBJ) splitBtnBJ.style.display = 'none';
        }
    }

    async standBlackjack() {
        console.log('스탠드 함수 실행됨');
        this.hideBlackjackActionButtons();
        this.bjDealerHidden = false;
        
        // 딜러 숨겨진 카드 공개
        const dealerSlots = document.querySelectorAll('#dealerCards .card-slot');
        const hiddenSlot = dealerSlots[1];
        if (hiddenSlot.classList.contains('hidden')) {
            await this.dealBlackjackCardToSlot(this.bjDealerCards[1], hiddenSlot);
        }
        
        this.updateBlackjackScores();
        
        // 딜러 턴
        let dealerScore = this.calculateBlackjackScore(this.bjDealerCards);
        
        while (dealerScore < 17) {
            await this.delay(1000);
            const newCards = await this.drawCards(1);
            this.bjDealerCards.push(newCards[0]);
            
            const emptySlot = Array.from(dealerSlots).find(slot => slot.classList.contains('empty'));
            if (emptySlot) {
                await this.dealBlackjackCardToSlot(newCards[0], emptySlot);
            }
            
            dealerScore = this.calculateBlackjackScore(this.bjDealerCards);
            this.updateBlackjackScores();
            this.showMessage(`딜러 카드 추가... 딜러 점수: ${dealerScore}`, 'info');
        }
        
        // 결과 판정
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        
        if (dealerScore > 21) {
            this.processBlackjackResult('dealer_bust');
        } else if (playerScore > dealerScore) {
            this.processBlackjackResult('win');
        } else if (playerScore === dealerScore) {
            this.processBlackjackResult('push');
        } else {
            this.processBlackjackResult('lose');
        }
    }

    async doubleDownBlackjack() {
        if (this.money < this.bjCurrentBet) {
            this.showMessage('❌ 더블다운할 학습 포인트가 부족합니다!', 'danger');
            return;
        }
        
        this.money -= this.bjCurrentBet;
        this.bjCurrentBet *= 2;
        // 더블다운 후 칩 표시 업데이트
        this.displayBlackjackBetChips();
        this.updateDisplay();
        
        // 카드 1장만 더 받고 자동 스탠드
        const newCards = await this.drawCards(1);
        this.bjPlayerCards.push(newCards[0]);
        
        const playerSlots = document.querySelectorAll('#bjPlayerCards .card-slot');
        const emptySlot = Array.from(playerSlots).find(slot => slot.classList.contains('empty'));
        if (emptySlot) {
            await this.dealBlackjackCardToSlot(newCards[0], emptySlot);
        }
        
        this.updateBlackjackScores();
        
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        
        if (playerScore > 21) {
            this.showMessage(`💀 더블다운 버스트! 점수: ${playerScore}`, 'danger');
            this.hideBlackjackActionButtons();
            setTimeout(() => this.processBlackjackResult('bust'), 1500);
        } else {
            this.showMessage(`더블다운! 점수: ${playerScore}`, 'warning');
            this.hideBlackjackActionButtons();
            setTimeout(() => this.standBlackjack(), 1000);
        }
    }

    splitBlackjack() {
        // 스플릿 기능 (추후 구현 가능)
        this.showMessage('스플릿 전략 기능은 추후 업데이트 예정입니다.', 'info');
    }

    processBlackjackResult(result) {
        console.log('블랙잭 결과 처리:', result);
        let winAmount = 0;
        let message = '';
        
        const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
        const dealerScore = this.calculateBlackjackScore(this.bjDealerCards);
        
        switch(result) {
            case 'blackjack':
                winAmount = Math.floor(this.bjCurrentBet * 2.5); // 1.5배 배당
                message = `🎊 블랙잭! ${winAmount}P 획득!\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.blackjacks++;
                this.bjStats.wins++;
                break;
                
            case 'win':
                winAmount = this.bjCurrentBet * 2;
                message = `🎉 승리! ${winAmount}P 획득!\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.wins++;
                break;
                
            case 'dealer_bust':
                winAmount = this.bjCurrentBet * 2;
                message = `🎉 딜러 버스트! ${winAmount}P 획득!\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.wins++;
                break;
                
            case 'push':
                winAmount = this.bjCurrentBet;
                message = `🤝 푸시! 전략 포인트 반환\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.pushes++;
                break;
                
            case 'lose':
                message = `💀 패배... ${this.bjCurrentBet}P 손실\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.losses++;
                break;
                
            case 'bust':
                message = `💀 버스트! 패배... ${this.bjCurrentBet}P 손실\n플레이어: ${playerScore}점 vs 딜러: ${dealerScore}점`;
                this.bjStats.losses++;
                break;
        }
        
        // 효과음 재생
        if (winAmount > this.bjCurrentBet) {
            this.playSound('win');
        } else if (winAmount < this.bjCurrentBet) {
            this.playSound('lose');
        }
        
        this.money += winAmount;
        this.updateDisplay();
        this.updateBlackjackStats();
        
        // 딜러 카드가 숨겨져 있으면 공개 (bust 케이스 등)
        if (this.bjDealerHidden) {
            this.bjDealerHidden = false;
            const dealerSlots = document.querySelectorAll('#dealerCards .card-slot');
            if (dealerSlots[1] && dealerSlots[1].classList.contains('hidden') && this.bjDealerCards && this.bjDealerCards[1]) {
                // 비동기로 카드 공개
                this.dealBlackjackCardToSlot(this.bjDealerCards[1], dealerSlots[1]).then(() => {
                    this.updateBlackjackScores();
                });
            } else {
                this.updateBlackjackScores();
            }
        }
        
        setTimeout(() => {
            this.showBlackjackResultModal(result, message, winAmount);
        }, 1500);
        
        // 유저 데이터 저장
        this.saveGameData('blackjack', {
            win: result === 'win' || result === 'blackjack' || result === 'dealer_bust',
            loss: result === 'lose' || result === 'bust',
            push: result === 'push',
            blackjack: result === 'blackjack'
        });
    }

    showBlackjackResultModal(result, message, winAmount) {
        console.log('블랙잭 결과 모달 표시:', result, message, winAmount);
        
        // 제목과 메시지 설정
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');
        const gameResult = document.getElementById('gameResult');
        
        if (!resultTitle || !resultMessage || !gameResult) {
            console.error('필수 모달 요소를 찾을 수 없음');
            return;
        }
        
        resultTitle.textContent = '🧮 블랙잭 시뮬레이션 결과';
        resultMessage.textContent = message;
        
        // 바카라와 동일한 방식으로 결과 표시
        this.showBlackjackResultCards(result);
        
        // 카드 표시 영역 보이기
        const resultCards = document.getElementById('resultCards');
        if (resultCards) {
            resultCards.style.display = 'grid';
        }
        
        // 모달 표시
        gameResult.style.display = 'flex';
        
        // 다시 하기 버튼 이벤트 설정
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                this.hideBlackjackResultModal();
            };
        }
    }
    
    showBlackjackResultCards(result) {
        const resultPlayerCards = document.getElementById('resultPlayerCards');
        const resultBankerCards = document.getElementById('resultBankerCards');
        const resultPlayerScore = document.getElementById('resultPlayerScore');
        const resultBankerScore = document.getElementById('resultBankerScore');
        const resultCards = document.getElementById('resultCards');

        // 플레이어 카드 표시
        if (resultPlayerCards && this.bjPlayerCards) {
            resultPlayerCards.innerHTML = '';
            this.bjPlayerCards.forEach(card => {
                const cardImg = this.createResultCardElement(card);
                resultPlayerCards.appendChild(cardImg);
            });
        }

        // 딜러 카드 표시 (뱅커 영역에 표시)
        if (resultBankerCards && this.bjDealerCards) {
            resultBankerCards.innerHTML = '';
            this.bjDealerCards.forEach(card => {
                const cardImg = this.createResultCardElement(card);
                resultBankerCards.appendChild(cardImg);
            });
        }

        // 점수 계산 및 표시
        if (this.bjPlayerCards && this.bjDealerCards) {
            const playerScore = this.calculateBlackjackScore(this.bjPlayerCards);
            const dealerScore = this.calculateBlackjackScore(this.bjDealerCards);
            
            if (resultPlayerScore) {
                resultPlayerScore.textContent = playerScore;
            }
            if (resultBankerScore) {
                resultBankerScore.textContent = dealerScore;
            }
        }
        
        // 라벨 변경 (블랙잭용)
        if (resultCards) {
            const playerLabel = resultCards.querySelector('.result-hand:first-child h4');
            const dealerLabel = resultCards.querySelector('.result-hand:last-child h4');
            if (playerLabel) playerLabel.textContent = '👤 플레이어';
            if (dealerLabel) dealerLabel.textContent = '🎩 딜러';
        }

        // 승리한 쪽 하이라이트 (바카라와 동일한 방식)
        const playerHand = document.querySelector('.result-hand:first-child');
        const dealerHand = document.querySelector('.result-hand:last-child');
        
        if (playerHand && dealerHand && result) {
            playerHand.classList.remove('winning-result', 'losing-result');
            dealerHand.classList.remove('winning-result', 'losing-result');
            
            // 결과에 따라 하이라이트
            if (result === 'blackjack' || result === 'win' || result === 'dealer_bust') {
                playerHand.classList.add('winning-result');
                dealerHand.classList.add('losing-result');
            } else if (result === 'lose' || result === 'bust') {
                dealerHand.classList.add('winning-result');
                playerHand.classList.add('losing-result');
            } else if (result === 'push') {
                // 푸시는 둘 다 하이라이트 없음
            }
        }
    }

    hideBlackjackResultModal() {
        const gameResult = document.getElementById('gameResult');
        if (gameResult) {
            gameResult.style.display = 'none';
        }
        
        // 게임 상태 초기화
        this.bjCurrentBet = 0;
        
        // 블랙잭 칩 표시 초기화
        const bjChipsContainer = document.getElementById('bjBetChips');
        if (bjChipsContainer) {
            bjChipsContainer.innerHTML = '';
        }
        
        const bjDealBtn = document.getElementById('bjDealBtn');
        if (bjDealBtn) bjDealBtn.style.display = 'none';
        
        // 새 라운드 준비
        this.bjGamePhase = 'betting';
        document.getElementById('bjGamePhaseText').textContent = '전략 선택 시간';
        document.getElementById('bjGameTimer').textContent = '-';
    }

    updateBlackjackStats() {
        const bjWins = document.getElementById('bjWins');
        const bjLosses = document.getElementById('bjLosses');
        const bjPushes = document.getElementById('bjPushes');
        const bjBlackjacks = document.getElementById('bjBlackjacks');
        
        if (bjWins) bjWins.textContent = this.bjStats.wins;
        if (bjLosses) bjLosses.textContent = this.bjStats.losses;
        if (bjPushes) bjPushes.textContent = this.bjStats.pushes;
        if (bjBlackjacks) bjBlackjacks.textContent = this.bjStats.blackjacks;
    }

    clearBlackjackBet() {
        if (this.bjGamePhase !== 'betting') {
            this.showMessage('❌ 배팅 시간이 아닙니다!', 'danger');
            return;
        }

        this.money += this.bjCurrentBet;
        this.bjCurrentBet = 0;
        // 블랙잭 칩 표시 초기화
        const bjChipsContainer = document.getElementById('bjBetChips');
        if (bjChipsContainer) {
            bjChipsContainer.innerHTML = '';
        }
        const bjDealBtn = document.getElementById('bjDealBtn');
        if (bjDealBtn) bjDealBtn.style.display = 'none';
        this.updateDisplay();
        this.showMessage('배팅이 취소되었습니다.', 'info');
    }

    repeatBlackjackBet() {
        // 이전 배팅 반복 (추후 구현)
        this.showMessage('이전 전략 반복 기능은 추후 업데이트 예정입니다.', 'info');
    }

    newBlackjackGame() {
        // 게임 상태 초기화
        this.bjCurrentBet = 0;
        this.bjPlayerCards = [];
        this.bjDealerCards = [];
        this.bjDealerHidden = true;
        this.bjGamePhase = 'betting';
        
        // 타이머 정리
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // UI 초기화
        document.getElementById('gameResult').style.display = 'none';
        this.clearBlackjackCardSlots();
        // 블랙잭 칩 표시 초기화
        const bjChipsContainer = document.getElementById('bjBetChips');
        if (bjChipsContainer) {
            bjChipsContainer.innerHTML = '';
        }
        this.hideBlackjackActionButtons();
        const bjDealBtn = document.getElementById('bjDealBtn');
        if (bjDealBtn) bjDealBtn.style.display = 'none';
        
        // 새 라운드 준비
        this.bjGamePhase = 'betting';
        document.getElementById('bjGamePhaseText').textContent = '전략 선택 시간';
        document.getElementById('bjGameTimer').textContent = '-';
    }

    showBlackjackRules() {
        const rulesTitle = document.getElementById('rulesTitle');
        const rulesText = document.getElementById('rulesText');
        
        rulesTitle.textContent = '🧮 블랙잭 학습 가이드';
        rulesText.innerHTML = `
            <p><strong>🎯 학습 목표:</strong> 확률 기반 최적 의사결정 전략 이해</p>
            <p><strong>🃏 카드 값:</strong></p>
            <p>• A = 1 또는 11점 (유리한 쪽으로 자동 계산)</p>
            <p>• 2-10 = 액면가</p>
            <p>• J, Q, K = 10점</p>
            <p><strong>🎮 게임 진행:</strong></p>
            <p>• 플레이어와 딜러 각각 2장씩 받습니다</p>
            <p>• 딜러의 두 번째 카드는 뒷면으로 숨겨집니다</p>
            <p>• 플레이어가 먼저 액션을 선택합니다</p>
            <p><strong>🎲 액션:</strong></p>
            <p>• <strong>히트:</strong> 카드를 더 받습니다</p>
            <p>• <strong>스탠드:</strong> 카드를 그만 받습니다</p>
            <p>• <strong>더블다운:</strong> 전략 포인트를 2배로 하고 카드 1장만 더 받습니다</p>
            <p>• <strong>스플릿:</strong> 같은 값 카드 2장을 분할합니다</p>
            <p><strong>📊 기본 전략:</strong></p>
            <p>• 17점 이상: 항상 스탠드</p>
            <p>• 12-16점: 딜러가 7 이상이면 히트, 6 이하면 스탠드</p>
            <p>• 11점 이하: 항상 히트</p>
            <p><strong>💡 학습 포인트:</strong></p>
            <p>• 최적 전략 사용 시 기대값: 약 -0.5%</p>
            <p>• 카드 게임 중 가장 낮은 하우스 엣지</p>
            <p>• 확률 계산을 통한 의사결정 연습</p>
            <p><strong>🏆 승부:</strong></p>
            <p>• 블랙잭 (처음 2장이 21): 1.5배 배당</p>
            <p>• 일반 승리: 1배 배당</p>
            <p>• 푸시 (동점): 전략 포인트 반환</p>
            <p>• 딜러는 17 이상에서 스탠드합니다</p>
        `;
        
        document.getElementById('gameRules').style.display = 'flex';
    }

    // 블랙잭 카드 값 계산 함수들
    calculateBlackjackScore(cards) {
        let score = 0;
        let aces = 0;

        cards.forEach(card => {
            const value = this.getBlackjackCardValue(card);
            if (value === 11) {
                aces++;
            }
            score += value;
        });

        // 에이스 처리 (11 → 1로 변환)
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    getBlackjackCardValue(card) {
        if (['JACK', 'QUEEN', 'KING'].includes(card.value)) {
            return 10;
        } else if (card.value === 'ACE') {
            return 11; // 나중에 calculateBlackjackScore에서 조정
        } else {
            return parseInt(card.value);
        }
    }

    selectChip(value) {
        console.log('바카라 칩 선택:', value, '현재 자금:', this.money);
        
        if (value > this.money) {
            this.showMessage('❌ 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        this.selectedChip = value;
        
        // 바카라 칩 선택 표시 (바카라 영역 내에서만)
        document.querySelectorAll('#baccaratGameArea .chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        const selectedChip = document.querySelector(`#baccaratGameArea .chip[data-value="${value}"]`);
        if (selectedChip) {
            selectedChip.classList.add('selected');
            console.log('바카라 칩 선택 표시 완료');
        } else {
            console.log('바카라 칩 요소를 찾을 수 없음:', `#baccaratGameArea .chip[data-value="${value}"]`);
        }
        
        this.showMessage(`📊 ${value}P 학습 포인트가 선택되었습니다!`, 'success');
        console.log('바카라 선택된 칩:', this.selectedChip);
    }

    placeBet(betType) {
        console.log('바카라 배팅 시도:', betType, '선택된 칩:', this.selectedChip, '게임 페이즈:', this.gamePhase);
        
        if (this.gamePhase !== 'betting') {
            this.showMessage('❌ 전략 선택 시간이 아닙니다!', 'danger');
            return;
        }

        if (!this.selectedChip) {
            this.showMessage('❌ 학습 포인트를 먼저 선택하세요!', 'danger');
            return;
        }

        if (this.selectedChip > this.money) {
            this.showMessage('❌ 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        // 배팅 추가
        this.bets[betType] += this.selectedChip;
        this.money -= this.selectedChip;
        
        console.log('바카라 배팅 완료:', betType, this.selectedChip, '총 배팅:', this.bets);
        
        // 배팅 영역에 칩 표시
        this.displayBetChips(betType);
        this.updateBettingPercentages();
        this.updateDisplay();
        
        this.showMessage(`📊 ${betType === 'player' ? '플레이어' : betType === 'banker' ? '뱅커' : '타이'}에 ${this.selectedChip}P 전략 선택!`, 'success');
        
        // 배팅이 있으면 딜 버튼 표시 (배팅 시간에만)
        if (this.getTotalBets() > 0 && this.gamePhase === 'betting') {
            document.getElementById('dealCardsBtn').style.display = 'inline-block';
        }
    }


    displayBlackjackBetChips() {
        console.log('블랙잭 배팅 칩 표시:', this.bjCurrentBet);
        
        const chipsContainer = document.getElementById('bjBetChips');
        if (!chipsContainer) {
            console.log('bjBetChips 컨테이너를 찾을 수 없음');
            return;
        }

        // 기존 칩 표시 제거
        chipsContainer.innerHTML = '';
        
        if (this.bjCurrentBet > 0) {
            // 배팅 금액을 칩 단위로 분해
            const chipBreakdown = this.breakdownToChips(this.bjCurrentBet);
            let zIndex = 100;
            let stackOffset = 0;
            
            // 칩 스택 컨테이너 생성
            const stackContainer = document.createElement('div');
            stackContainer.style.cssText = `
                position: relative;
                display: flex;
                flex-direction: column-reverse;
                align-items: center;
                height: 80px;
                justify-content: flex-end;
            `;
            
            let chipIndex = 0;
            chipBreakdown.forEach((chipInfo, groupIndex) => {
                for (let i = 0; i < chipInfo.count; i++) {
                    const chip = document.createElement('div');
                    chip.className = 'bet-chip-stack';
                    chip.textContent = `$${chipInfo.value}`;
                    
                    const rotation = Math.random() * 10 - 5;
                    
                    chip.style.cssText = `
                        width: 50px;
                        height: 12px;
                        border-radius: 50%;
                        background: ${this.getChipColor(chipInfo.value)};
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9em;
                        font-weight: bold;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        border: 2px solid #d4af37;
                        position: absolute;
                        bottom: ${stackOffset}px;
                        z-index: ${zIndex--};
                        transform: rotate(${rotation}deg);
                        animation-delay: ${chipIndex * 0.1}s;
                    `;
                    
                    // 칩에 호버 효과를 위한 툴팁 추가
                    chip.title = `$${chipInfo.value} 칩`;
                    
                    stackContainer.appendChild(chip);
                    stackOffset += 5; // 칩 간격
                    chipIndex++;
                }
            });
            
            // 총 금액 표시 (맨 위)
            const totalLabel = document.createElement('div');
            totalLabel.className = 'total-amount-label';
            totalLabel.textContent = `$${this.bjCurrentBet}`;
            totalLabel.style.cssText = `
                position: absolute;
                top: -25px;
                background: rgba(0,0,0,0.9);
                color: #ffd700;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 1em;
                font-weight: bold;
                white-space: nowrap;
                border: 1px solid #d4af37;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
            
            stackContainer.appendChild(totalLabel);
            chipsContainer.appendChild(stackContainer);
            console.log('블랙잭 배팅 칩 스택 표시 완료:', chipBreakdown);
        }
    }

    disableBettingControls() {
        // 배팅 영역 비활성화
        document.querySelectorAll('.bet-area').forEach(area => {
            area.style.pointerEvents = 'none';
            area.style.opacity = '0.6';
        });
        
        // 칩 선택 비활성화
        document.querySelectorAll('.chip').forEach(chip => {
            chip.style.pointerEvents = 'none';
            chip.style.opacity = '0.6';
        });
        
        // 배팅 관련 버튼들 비활성화
        const clearBtn = document.getElementById('clearBetsBtn');
        const repeatBtn = document.getElementById('repeatBetBtn');
        const dealBtn = document.getElementById('dealCardsBtn');
        
        if (clearBtn) {
            clearBtn.disabled = true;
            clearBtn.style.opacity = '0.5';
        }
        if (repeatBtn) {
            repeatBtn.disabled = true;
            repeatBtn.style.opacity = '0.5';
        }
        if (dealBtn) {
            dealBtn.style.display = 'none';
        }
    }

    enableBettingControls() {
        // 배팅 영역 활성화
        document.querySelectorAll('.bet-area').forEach(area => {
            area.style.pointerEvents = 'auto';
            area.style.opacity = '1';
        });
        
        // 칩 선택 활성화
        document.querySelectorAll('.chip').forEach(chip => {
            chip.style.pointerEvents = 'auto';
            chip.style.opacity = '1';
        });
        
        // 배팅 관련 버튼들 활성화
        const clearBtn = document.getElementById('clearBetsBtn');
        const repeatBtn = document.getElementById('repeatBetBtn');
        
        if (clearBtn) {
            clearBtn.disabled = false;
            clearBtn.style.opacity = '1';
        }
        if (repeatBtn) {
            repeatBtn.disabled = false;
            repeatBtn.style.opacity = '1';
        }
    }

    displayBetChips(betType) {
        console.log('배팅 칩 표시:', betType, '금액:', this.bets[betType]);
        
        const chipsContainer = document.getElementById(`${betType}Chips`);
        if (!chipsContainer) {
            console.log(`${betType}Chips 컨테이너를 찾을 수 없음`);
            return;
        }

        // 기존 칩 표시 제거
        chipsContainer.innerHTML = '';
        
        if (this.bets[betType] > 0) {
            // 배팅 금액을 칩 단위로 분해
            const chipBreakdown = this.breakdownToChips(this.bets[betType]);
            let zIndex = 100;
            let stackOffset = 0;
            
            // 칩 스택 컨테이너 생성
            const stackContainer = document.createElement('div');
            stackContainer.style.cssText = `
                position: relative;
                display: flex;
                flex-direction: column-reverse;
                align-items: center;
                height: 80px;
                justify-content: flex-end;
            `;
            
            let chipIndex = 0;
            chipBreakdown.forEach((chipInfo, groupIndex) => {
                for (let i = 0; i < chipInfo.count; i++) {
                    const chip = document.createElement('div');
                    chip.className = 'bet-chip-stack';
                    chip.textContent = `$${chipInfo.value}`;
                    
                    const rotation = Math.random() * 10 - 5;
                    
                    chip.style.cssText = `
                        width: 50px;
                        height: 12px;
                        border-radius: 50%;
                        background: ${this.getChipColor(chipInfo.value)};
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9em;
                        font-weight: bold;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        border: 2px solid #d4af37;
                        position: absolute;
                        bottom: ${stackOffset}px;
                        z-index: ${zIndex--};
                        transform: rotate(${rotation}deg);
                        animation-delay: ${chipIndex * 0.1}s;
                    `;
                    
                    // 칩에 호버 효과를 위한 툴팁 추가
                    chip.title = `$${chipInfo.value} 칩`;
                    
                    stackContainer.appendChild(chip);
                    stackOffset += 5; // 칩 간격 증가
                    chipIndex++;
                }
            });
            
            // 총 금액 표시 (맨 위)
            const totalLabel = document.createElement('div');
            totalLabel.className = 'total-amount-label';
            totalLabel.textContent = `$${this.bets[betType]}`;
            totalLabel.style.cssText = `
                position: absolute;
                top: -25px;
                background: rgba(0,0,0,0.9);
                color: #ffd700;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 1em;
                font-weight: bold;
                white-space: nowrap;
                border: 1px solid #d4af37;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            `;
            
            stackContainer.appendChild(totalLabel);
            chipsContainer.appendChild(stackContainer);
            console.log('배팅 칩 스택 표시 완료:', chipBreakdown);
        }
    }

    // 금액을 칩 단위로 분해하는 함수
    breakdownToChips(amount) {
        const chipValues = [500, 100, 50, 25, 10, 5, 1];
        const breakdown = [];
        let remaining = amount;
        
        chipValues.forEach(value => {
            if (remaining >= value) {
                const count = Math.floor(remaining / value);
                if (count > 0) {
                    breakdown.push({ value, count });
                    remaining -= count * value;
                }
            }
        });
        
        return breakdown;
    }

    getChipColor(value) {
        switch(value) {
            case 1: return 'linear-gradient(45deg, #868e96, #6c757d)'; // 회색 - $1
            case 5: return 'linear-gradient(45deg, #ff8787, #ff6b6b)'; // 빨강 - $5
            case 10: return 'linear-gradient(45deg, #ffa94d, #fd7e14)'; // 주황 - $10
            case 25: return 'linear-gradient(45deg, #74c0fc, #339af0)'; // 파랑 - $25
            case 50: return 'linear-gradient(45deg, #8ce99a, #51cf66)'; // 초록 - $50
            case 100: return 'linear-gradient(45deg, #ffd43b, #fab005)'; // 노랑 - $100
            case 500: return 'linear-gradient(45deg, #da77f2, #9775fa)'; // 보라 - $500
            case 1000: return 'linear-gradient(45deg, #495057, #212529)'; // 검정 - $1000
            default: return 'linear-gradient(45deg, #6c757d, #495057)';
        }
    }

    updateBettingPercentages() {
        const total = this.getTotalBets();
        if (total === 0) return;

        ['player', 'banker', 'tie'].forEach(betType => {
            const percentage = Math.round((this.bets[betType] / total) * 100);
            const element = document.getElementById(`${betType}Percentage`);
            if (element) {
                element.textContent = `${percentage}%`;
            }
        });
    }

    getTotalBets() {
        return this.bets.player + this.bets.banker + this.bets.tie;
    }

    clearBets() {
        if (this.gamePhase !== 'betting') {
            this.showMessage('❌ 전략 선택 시간이 아닙니다!', 'danger');
            return;
        }

        // 배팅 금액 반환
        const totalBets = this.getTotalBets();
        this.money += totalBets;
        
        // 배팅 초기화
        this.bets = { player: 0, banker: 0, tie: 0 };
        
        // 칩 표시 제거
        ['player', 'banker', 'tie'].forEach(betType => {
            const chipsContainer = document.getElementById(`${betType}Chips`);
            if (chipsContainer) chipsContainer.innerHTML = '';
            
            const percentageElement = document.getElementById(`${betType}Percentage`);
            if (percentageElement) percentageElement.textContent = '0%';
        });
        
        document.getElementById('dealCardsBtn').style.display = 'none';
        this.updateDisplay();
        this.showMessage('배팅이 취소되었습니다.', 'info');
    }

    repeatLastBet() {
        if (this.gamePhase !== 'betting') {
            this.showMessage('❌ 전략 선택 시간이 아닙니다!', 'danger');
            return;
        }

        const lastTotal = this.lastBets.player + this.lastBets.banker + this.lastBets.tie;
        if (lastTotal === 0) {
            this.showMessage('❌ 이전 전략 기록이 없습니다!', 'danger');
            return;
        }

        if (lastTotal > this.money) {
            this.showMessage('❌ 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        // 이전 배팅 복원
        this.bets = { ...this.lastBets };
        this.money -= lastTotal;
        
        // 칩 표시 업데이트
        ['player', 'banker', 'tie'].forEach(betType => {
            this.displayBetChips(betType);
        });
        
        this.updateBettingPercentages();
        this.updateDisplay();
        document.getElementById('dealCardsBtn').style.display = 'inline-block';
        this.showMessage('이전 전략이 복원되었습니다!', 'success');
    }

    startBettingTimer() {
        // 타이머 제거됨 - 사용자가 원하는 시간에 게임 시작 가능
        this.gamePhase = 'betting';
        this.enableBettingControls();
        document.getElementById('gamePhaseText').textContent = '전략 선택 시간';
        document.getElementById('gameTimer').textContent = '-';
    }

    endBettingTime() {
        // 타이머 제거됨 - 이 함수는 더 이상 사용되지 않음
    }

    async startGame() {
        if (this.getTotalBets() === 0) {
            this.showMessage('❌ 전략을 먼저 선택하세요!', 'danger');
            return;
        }

        // 이전 배팅 저장
        this.lastBets = { ...this.bets };
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.gamePhase = 'dealing';
        document.getElementById('gamePhaseText').textContent = '시뮬레이션 진행';
        document.getElementById('gameTimer').textContent = '진행중';
        document.getElementById('dealCardsBtn').style.display = 'none';
        
        this.showMessage('🎴 시뮬레이션을 진행하고 있습니다...', 'info');
        
        // 카드 초기화
        this.playerCards = [];
        this.bankerCards = [];
        this.clearCardSlots();
        
        // 바카라 게임 진행
        await this.playBaccarat();
    }

    clearCardSlots() {
        // 플레이어 카드 슬롯 초기화
        const playerSlots = document.querySelectorAll('#playerCards .card-slot');
        playerSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.add('empty');
        });
        
        // 뱅커 카드 슬롯 초기화
        const bankerSlots = document.querySelectorAll('#bankerCards .card-slot');
        bankerSlots.forEach(slot => {
            slot.innerHTML = '';
            slot.classList.add('empty');
        });
        
        // 점수 초기화
        document.getElementById('playerScore').textContent = '-';
        document.getElementById('bankerScore').textContent = '-';
    }

    async playBaccarat() {
        // 초기 4장 카드 딜링
        const cards = await this.drawCards(4);
        
        // 카드 배분: 플레이어-뱅커-플레이어-뱅커 순서
        this.playerCards = [cards[0], cards[2]];
        this.bankerCards = [cards[1], cards[3]];
        
        // 카드 애니메이션으로 표시
        await this.dealInitialCards();
        
        // 점수 계산
        let playerScore = this.calculateBaccaratScore(this.playerCards);
        let bankerScore = this.calculateBaccaratScore(this.bankerCards);
        
        this.updateScores();
        this.showMessage(`플레이어: ${playerScore}, 뱅커: ${bankerScore}`, 'info');
        
        // 내추럴 체크 (8 또는 9)
        if (playerScore >= 8 || bankerScore >= 8) {
            this.showMessage('내추럴! 게임 종료', 'success');
            setTimeout(() => {
                this.processBaccaratResult(playerScore, bankerScore);
            }, 2000);
            return;
        }

        // 3번째 카드 규칙 적용
        await this.applyThirdCardRules(playerScore, bankerScore);
    }

    async dealInitialCards() {
        const playerSlots = document.querySelectorAll('#playerCards .card-slot');
        const bankerSlots = document.querySelectorAll('#bankerCards .card-slot');
        
        // 플레이어 첫 번째 카드
        await this.dealCardToSlot(this.playerCards[0], playerSlots[0]);
        await this.delay(500);
        
        // 뱅커 첫 번째 카드
        await this.dealCardToSlot(this.bankerCards[0], bankerSlots[0]);
        await this.delay(500);
        
        // 플레이어 두 번째 카드
        await this.dealCardToSlot(this.playerCards[1], playerSlots[1]);
        await this.delay(500);
        
        // 뱅커 두 번째 카드
        await this.dealCardToSlot(this.bankerCards[1], bankerSlots[1]);
        await this.delay(500);
    }

    async dealCardToSlot(card, slot) {
        slot.classList.remove('empty');
        const cardImg = document.createElement('img');
        cardImg.src = card.image;
        cardImg.alt = `${card.value} of ${card.suit}`;
        cardImg.style.opacity = '0';
        cardImg.style.transform = 'translateY(-50px) rotateY(180deg) scale(0.8)';
        cardImg.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        slot.appendChild(cardImg);
        
        // 카드 딜링 사운드
        this.playSound('card');
        
        // 애니메이션
        setTimeout(() => {
            cardImg.style.opacity = '1';
            cardImg.style.transform = 'translateY(0) rotateY(0deg) scale(1)';
        }, 100);
        
        return new Promise(resolve => setTimeout(resolve, 600));
    }

    async applyThirdCardRules(playerScore, bankerScore) {
        let playerThirdCard = null;
        
        // 플레이어 3번째 카드 규칙
        if (playerScore <= 5) {
            await this.delay(1000);
            this.showMessage('플레이어가 3번째 카드를 받습니다...', 'info');
            
            const newCards = await this.drawCards(1);
            playerThirdCard = newCards[0];
            this.playerCards.push(playerThirdCard);
            
            const playerSlots = document.querySelectorAll('#playerCards .card-slot');
            await this.dealCardToSlot(playerThirdCard, playerSlots[2]);
            
            playerScore = this.calculateBaccaratScore(this.playerCards);
            this.updateScores();
        }
        
        // 뱅커 3번째 카드 규칙
        const bankerNeedsCard = this.checkBankerThirdCardRule(bankerScore, playerThirdCard);
        if (bankerNeedsCard) {
            await this.delay(1000);
            this.showMessage('뱅커가 3번째 카드를 받습니다...', 'info');
            
            const newCards = await this.drawCards(1);
            const bankerThirdCard = newCards[0];
            this.bankerCards.push(bankerThirdCard);
            
            const bankerSlots = document.querySelectorAll('#bankerCards .card-slot');
            await this.dealCardToSlot(bankerThirdCard, bankerSlots[2]);
            
            bankerScore = this.calculateBaccaratScore(this.bankerCards);
            this.updateScores();
        }
        
        // 최종 결과 처리
        setTimeout(() => {
            this.processBaccaratResult(playerScore, bankerScore);
        }, 2000);
    }

    checkBankerThirdCardRule(bankerScore, playerThirdCard) {
        // 뱅커가 7 이상이면 스탠드
        if (bankerScore >= 7) return false;
        
        // 뱅커가 0-2면 무조건 히트
        if (bankerScore <= 2) return true;
        
        // 플레이어가 3번째 카드를 받지 않았다면
        if (!playerThirdCard) {
            return bankerScore <= 5;
        }
        
        // 플레이어 3번째 카드 값
        const playerThirdValue = this.getCardNumericValue(playerThirdCard);
        
        // 뱅커 3번째 카드 규칙 (정확한 바카라 규칙)
        switch (bankerScore) {
            case 3:
                return playerThirdValue !== 8;
            case 4:
                return [2, 3, 4, 5, 6, 7].includes(playerThirdValue);
            case 5:
                return [4, 5, 6, 7].includes(playerThirdValue);
            case 6:
                return [6, 7].includes(playerThirdValue);
            default:
                return false;
        }
    }

    calculateBaccaratScore(cards) {
        let total = 0;
        cards.forEach(card => {
            total += this.getCardNumericValue(card);
        });
        return total % 10;
    }

    getCardNumericValue(card) {
        if (['JACK', 'QUEEN', 'KING'].includes(card.value)) return 0;
        if (card.value === 'ACE') return 1;
        return parseInt(card.value);
    }

    updateScores() {
        const playerScore = this.calculateBaccaratScore(this.playerCards);
        const bankerScore = this.calculateBaccaratScore(this.bankerCards);
        
        document.getElementById('playerScore').textContent = playerScore;
        document.getElementById('bankerScore').textContent = bankerScore;
    }

    processBaccaratResult(playerScore, bankerScore) {
        let winner = '';
        let winAmount = 0;
        let totalBet = this.getTotalBets();
        
        // 승부 결정
        if (playerScore > bankerScore) {
            winner = 'player';
            winAmount += this.bets.player * 2; // 1:1 배당
        } else if (bankerScore > playerScore) {
            winner = 'banker';
            winAmount += Math.floor(this.bets.banker * 1.95); // 1:0.95 배당
        } else {
            winner = 'tie';
            winAmount += this.bets.tie * 9; // 1:8 배당
            winAmount += this.bets.player + this.bets.banker; // 플레이어/뱅커 배팅 반환
        }
        
        // 결과 메시지
        let message = '';
        let isWin = winAmount > 0;
        
        if (winner === 'player') {
            message = `🔵 플레이어 승리!\n플레이어: ${playerScore}점 vs 뱅커: ${bankerScore}점`;
        } else if (winner === 'banker') {
            message = `🔴 뱅커 승리!\n플레이어: ${playerScore}점 vs 뱅커: ${bankerScore}점`;
        } else {
            message = `🟢 타이 (무승부)!\n플레이어: ${playerScore}점 vs 뱅커: ${bankerScore}점`;
        }
        
        if (winAmount > 0) {
            message += `\n\n💰 $${winAmount} 획득!`;
            if (winAmount > totalBet) this.winCount++;
        } else {
            message += `\n\n💀 $${totalBet} 손실`;
        }
        
        // 자금 업데이트
        this.money += winAmount;
        
        // 통계 기록 추가
        this.gameHistory.push(winner);
        this.updateGameHistory();
        this.updateProbabilityDisplay(); // 확률 표시 업데이트
        
        // 배팅 초기화
        this.bets = { player: 0, banker: 0, tie: 0 };
        
        this.updateDisplay();
        this.showGameResult('📈 바카라 시뮬레이션 결과', message, isWin);
        
        // 효과음 재생
        if (isWin && winAmount > totalBet) {
            this.playSound('win');
        } else if (!isWin && totalBet > 0) {
            this.playSound('lose');
        }
        
        // 유저 데이터 저장
        this.saveGameData('baccarat', {
            win: isWin && winAmount > totalBet,
            loss: !isWin && totalBet > 0,
            tie: winner === 'tie'
        });
    }
    
    loadUserGameData(userData) {
        if (!userData) return;
        
        this.userGameData = userData;
        
        // currentPoints를 우선적으로 사용 (모든 게임에서 공통)
        if (userData.currentPoints !== undefined) {
            this.money = userData.currentPoints;
        } else if (userData.gameStats) {
            // currentPoints가 없으면 게임별 포인트 사용
            if (userData.gameStats.baccarat) {
                this.money = userData.gameStats.baccarat.totalPoints || 1000;
            } else if (userData.gameStats.blackjack) {
                this.money = userData.gameStats.blackjack.totalPoints || 1000;
            } else if (userData.gameStats.dice) {
                this.money = userData.gameStats.dice.totalPoints || 1000;
            } else if (userData.gameStats.hilo) {
                this.money = userData.gameStats.hilo.totalPoints || 1000;
            } else {
                this.money = 1000;
            }
        } else {
            this.money = 1000;
        }
        
        this.updateDisplay();
    }
    
    async saveGameData(gameMode, stats) {
        if (!window.authManager || !window.authManager.currentUser) {
            // 로그인하지 않은 경우 로컬에만 저장
            return;
        }
        
        await window.authManager.saveGameData(gameMode, stats, this.money);
    }

    updateGameHistory() {
        const historyContainer = document.getElementById('historyResults');
        if (!historyContainer) return;
        
        // 최근 20개만 표시
        const recentHistory = this.gameHistory.slice(-20);
        historyContainer.innerHTML = '';
        
        recentHistory.forEach(result => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${result}`;
            
            if (result === 'player') {
                historyItem.textContent = 'P';
            } else if (result === 'banker') {
                historyItem.textContent = 'B';
            } else {
                historyItem.textContent = 'T';
            }
            
            historyContainer.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.gameHistory = [];
        this.updateGameHistory();
        this.showMessage('통계 기록이 초기화되었습니다.', 'info');
    }

    newRound() {
        // 게임 상태 초기화
        this.playerCards = [];
        this.bankerCards = [];
        this.gamePhase = 'betting';
        this.bets = { player: 0, banker: 0, tie: 0 };
        
        // 타이머 정리
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // UI 초기화
        document.getElementById('gameResult').style.display = 'none';
        this.clearCardSlots();
        
        // 칩 표시 제거
        ['player', 'banker', 'tie'].forEach(betType => {
            const chipsContainer = document.getElementById(`${betType}Chips`);
            if (chipsContainer) chipsContainer.innerHTML = '';
            
            const percentageElement = document.getElementById(`${betType}Percentage`);
            if (percentageElement) percentageElement.textContent = '0%';
        });
        
        document.getElementById('dealCardsBtn').style.display = 'none';
        
        // 새 라운드 준비
        this.gamePhase = 'betting';
        this.enableBettingControls();
        document.getElementById('gamePhaseText').textContent = '전략 선택 시간';
        document.getElementById('gameTimer').textContent = '-';
    }

    // 유틸리티 메서드들
    async initializeDeck() {
        try {
            const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=8');
            const data = await response.json();
            this.deckId = data.deck_id;
            console.log('🃏 새로운 8덱 바카라 덱 생성:', this.deckId);
        } catch (error) {
            console.error('덱 생성 실패:', error);
            this.deckId = 'offline';
        }
    }

    async drawCards(count) {
        if (this.deckId === 'offline') {
            return this.generateOfflineCards(count);
        }

        try {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=${count}`);
            const data = await response.json();
            
            if (data.remaining < 20) {
                await this.initializeDeck();
                return this.drawCards(count);
            }
            
            return data.cards;
        } catch (error) {
            console.error('카드 뽑기 실패:', error);
            return this.generateOfflineCards(count);
        }
    }

    generateOfflineCards(count) {
        const suits = ['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'];
        const values = ['ACE', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'JACK', 'QUEEN', 'KING'];
        const cards = [];

        for (let i = 0; i < count; i++) {
            const suit = suits[Math.floor(Math.random() * suits.length)];
            const value = values[Math.floor(Math.random() * values.length)];
            cards.push({
                code: value[0] + suit[0],
                value: value,
                suit: suit,
                image: `https://deckofcardsapi.com/static/img/${value === '10' ? '0' : value[0]}${suit[0]}.png`
            });
        }

        return cards;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showGameResult(title, message, isWin) {
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;
        
        // 바카라 결과 카드 표시
        if (this.selectedMode === 'baccarat') {
            this.showBaccaratResultCards();
            document.getElementById('resultCards').style.display = 'grid';
            } else {
            document.getElementById('resultCards').style.display = 'none';
        }
        
        document.getElementById('gameResult').style.display = 'flex';
    }

    showBaccaratResultCards() {
        const resultPlayerCards = document.getElementById('resultPlayerCards');
        const resultBankerCards = document.getElementById('resultBankerCards');
        const resultPlayerScore = document.getElementById('resultPlayerScore');
        const resultBankerScore = document.getElementById('resultBankerScore');

        // 플레이어 카드 표시
        if (resultPlayerCards) {
            resultPlayerCards.innerHTML = '';
            this.playerCards.forEach(card => {
                const cardImg = this.createResultCardElement(card);
                resultPlayerCards.appendChild(cardImg);
            });
        }

        // 뱅커 카드 표시
        if (resultBankerCards) {
            resultBankerCards.innerHTML = '';
            this.bankerCards.forEach(card => {
                const cardImg = this.createResultCardElement(card);
                resultBankerCards.appendChild(cardImg);
            });
        }

        // 점수 표시
        const playerScore = this.calculateBaccaratScore(this.playerCards);
        const bankerScore = this.calculateBaccaratScore(this.bankerCards);
        
        if (resultPlayerScore) resultPlayerScore.textContent = playerScore;
        if (resultBankerScore) resultBankerScore.textContent = bankerScore;

        // 승리한 쪽 하이라이트
        const playerHand = document.querySelector('.result-hand:first-child');
        const bankerHand = document.querySelector('.result-hand:last-child');
        
        playerHand?.classList.remove('winning-result', 'losing-result');
        bankerHand?.classList.remove('winning-result', 'losing-result');
        
        if (playerScore > bankerScore) {
            playerHand?.classList.add('winning-result');
            bankerHand?.classList.add('losing-result');
        } else if (bankerScore > playerScore) {
            bankerHand?.classList.add('winning-result');
            playerHand?.classList.add('losing-result');
        }
    }

    createResultCardElement(card) {
        const cardImg = document.createElement('img');
        cardImg.src = card.image;
        cardImg.alt = `${card.value} of ${card.suit}`;
        cardImg.className = 'card-img';
        return cardImg;
    }

    showGameRules() {
        const rulesTitle = document.getElementById('rulesTitle');
        const rulesText = document.getElementById('rulesText');
        
        rulesTitle.textContent = '📈 바카라 학습 가이드';
        rulesText.innerHTML = `
            <p><strong>🎯 학습 목표:</strong> 확률과 통계를 활용한 의사결정 이해</p>
            <p><strong>🃏 카드 값:</strong></p>
            <p>• A = 1점, 2-9 = 액면가, 10/J/Q/K = 0점</p>
            <p><strong>📊 점수 계산:</strong> 카드 합의 일의 자리 숫자 (모듈로 10 연산)</p>
            <p><strong>🎴 3번째 카드 규칙:</strong></p>
            <p>• 플레이어: 0-5점에서 히트, 6-7점에서 스탠드</p>
            <p>• 뱅커: 플레이어의 3번째 카드에 따라 복잡한 규칙 적용</p>
            <p><strong>📈 이론적 확률:</strong></p>
            <p>• 플레이어 승률: 44.62% (기대값 -1.36%)</p>
            <p>• 뱅커 승률: 45.86% (기대값 -1.06%, 수수료 5% 포함)</p>
            <p>• 타이 확률: 9.52% (기대값 -14.36%)</p>
            <p><strong>💡 학습 포인트:</strong></p>
            <p>• 모든 선택이 마이너스 기대값인 이유 이해</p>
            <p>• 하우스 엣지(카지노 우위)의 수학적 원리</p>
            <p>• 확률과 배당률의 관계</p>
            <p><strong>🏆 내추럴:</strong> 처음 2장으로 8 또는 9점이면 즉시 승부 결정</p>
        `;
        
        document.getElementById('gameRules').style.display = 'flex';
    }
    
    updateProbabilityDisplay() {
        // 이론적 확률 표시
        document.getElementById('playerProb').textContent = '44.62%';
        document.getElementById('bankerProb').textContent = '45.86%';
        document.getElementById('tieProb').textContent = '9.52%';
        document.getElementById('playerEV').textContent = '-1.36%';
        document.getElementById('bankerEV').textContent = '-1.06%';
        document.getElementById('tieEV').textContent = '-14.36%';
    }
    
    showProbabilityModal() {
        const totalGames = this.gameHistory.length;
        const playerWins = this.gameHistory.filter(r => r === 'player').length;
        const bankerWins = this.gameHistory.filter(r => r === 'banker').length;
        const ties = this.gameHistory.filter(r => r === 'tie').length;
        
        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('playerWins').textContent = playerWins;
        document.getElementById('bankerWins').textContent = bankerWins;
        document.getElementById('tieCount').textContent = ties;
        
        if (totalGames > 0) {
            document.getElementById('playerWinRate').textContent = (playerWins / totalGames * 100).toFixed(2) + '%';
            document.getElementById('bankerWinRate').textContent = (bankerWins / totalGames * 100).toFixed(2) + '%';
            document.getElementById('tieRate').textContent = (ties / totalGames * 100).toFixed(2) + '%';
        } else {
            document.getElementById('playerWinRate').textContent = '0%';
            document.getElementById('bankerWinRate').textContent = '0%';
            document.getElementById('tieRate').textContent = '0%';
        }
        
        document.getElementById('probabilityModal').style.display = 'flex';
    }
    
    hideProbabilityModal() {
        document.getElementById('probabilityModal').style.display = 'none';
    }
    
    showStrategyModal() {
        document.getElementById('strategyModal').style.display = 'flex';
    }
    
    hideStrategyModal() {
        document.getElementById('strategyModal').style.display = 'none';
    }

    hideGameRules() {
        document.getElementById('gameRules').style.display = 'none';
    }

    async backToMenu() {
        console.log('backToMenu 호출됨, 현재 모드:', this.selectedMode);
        // 타이머 정리
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 메뉴로 돌아갈 때는 게임을 플레이한 것이 아니므로 통계를 저장하지 않음
        // 포인트만 저장하려면 별도로 처리할 수 있지만, 현재는 저장하지 않음
        
        // 게임 상태 완전 초기화 (포인트는 유지)
        this.selectedMode = null;
        this.playerCards = [];
        this.bankerCards = [];
        this.gamePhase = 'betting';
        this.bets = { player: 0, banker: 0, tie: 0 };
        
        // 블랙잭 상태 초기화
        if (this.bjCurrentBet !== undefined) {
            this.bjCurrentBet = 0;
            this.bjPlayerCards = [];
            this.bjDealerCards = [];
            this.bjGamePhase = 'betting';
        }
        
        // 다이스 상태 초기화
        this.diceBetType = null;
        this.diceGamePhase = 'betting';
        
        // 하이로우 상태 초기화
        this.hiloBets = { higher: 0, lower: 0 };
        this.hiloBetAmount = 0;
        this.hiloGamePhase = 'waiting';
        
        // 홀덤 게임 떠나기
        if (window.holdemGame) {
            window.holdemGame.leaveTable();
        }
        
        // 모든 게임 영역 숨기기
        this.hideAllGameAreas();
        
        // 메인 메뉴만 표시
        document.getElementById('modeSelection').style.display = 'block';
        
        // 모드 선택 초기화
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 포인트는 유지되므로 업데이트만
        this.updateDisplay();
        this.showMessage('🎮 게임을 선택하세요!');
    }

    updateDisplay() {
        // 유저 정보 영역 통계 업데이트
        const userMoneyEl = document.getElementById('userMoney');
        const userWinCountEl = document.getElementById('userWinCount');
        const userCurrentGameEl = document.getElementById('userCurrentGame');
        
        if (userMoneyEl) userMoneyEl.textContent = this.money;
        if (userWinCountEl) userWinCountEl.textContent = this.winCount;
        
        // 현재 게임 모드 표시
        if (userCurrentGameEl) {
            let gameName = '-';
            if (this.selectedMode === 'baccarat') {
                gameName = '바카라';
            } else if (this.selectedMode === 'blackjack') {
                gameName = '블랙잭';
            } else if (this.selectedMode === 'dice') {
                gameName = '다이스';
            } else if (this.selectedMode === 'hilo') {
                gameName = '하이로우';
            }
            userCurrentGameEl.textContent = gameName;
        }
    }

    showMessage(message, type = 'info') {
        // 메인 메뉴에서는 기본 메시지 영역 사용
        let messageElement = document.getElementById('message');
        
        // 게임 중에는 해당 게임의 메시지 영역 사용 (없으면 기본 사용)
        if (this.selectedMode === 'baccarat') {
            // 바카라 게임 중에는 바카라 헤더에 메시지 표시
            const baccaratArea = document.getElementById('baccaratGameArea');
            if (baccaratArea && baccaratArea.style.display !== 'none') {
                // 바카라 전용 메시지가 있다면 사용, 없으면 기본 사용
            }
        } else if (this.selectedMode === 'blackjack') {
            // 블랙잭 게임 중에는 블랙잭 헤더에 메시지 표시
            const blackjackArea = document.getElementById('blackjackGameArea');
            if (blackjackArea && blackjackArea.style.display !== 'none') {
                // 블랙잭 전용 메시지가 있다면 사용, 없으면 기본 사용
            }
        }
        
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `status-text ${type}`;
            
            // 메시지 영역이 보이도록 설정
            const gameArea = document.querySelector('.game-area');
            if (gameArea && (this.selectedMode === null || message.includes('게임을 선택'))) {
                gameArea.style.display = 'block';
            }
            
            switch(type) {
                case 'success':
                    messageElement.style.color = '#28a745';
                    break;
                case 'danger':
                    messageElement.style.color = '#dc3545';
                    break;
                case 'warning':
                    messageElement.style.color = '#ffc107';
                    break;
                default:
                    messageElement.style.color = '#fff';
            }
        }
    }

    // ========== 다이스 게임 메서드 ==========
    setupDice() {
        console.log('다이스 게임 설정 시작');
        const currentGameEl = document.getElementById('currentGame');
        if (currentGameEl) {
            currentGameEl.textContent = '다이스 확률 학습';
        }
        
        this.diceGamePhase = 'betting';
        this.diceBetAmount = 10;
        this.diceSelectedNumber = 50;
        this.diceBetType = null;
        this.diceAutoBet = false;
        this.diceAutoBetRemaining = 0;
        
        this.setupDiceEventListeners();
        this.updateDiceDisplay();
        this.updateDiceProbabilities();
        this.showMessage('🎲 숫자를 선택하고 더 작은/더 큰을 선택하세요!');
        const diceGamePhaseTextEl = document.getElementById('diceGamePhaseText');
        if (diceGamePhaseTextEl) {
            diceGamePhaseTextEl.textContent = '배팅 시간';
        }
    }

    setupDiceEventListeners() {
        // 메뉴로 돌아가기 버튼 이벤트 리스너 설정 (게임 영역이 표시될 때마다 다시 설정)
        const backToMenuBtnDice = document.getElementById('backToMenuBtnDice');
        if (backToMenuBtnDice) {
            // 기존 이벤트 리스너 제거를 위해 클론 후 교체
            const newBtn = backToMenuBtnDice.cloneNode(true);
            backToMenuBtnDice.replaceWith(newBtn);
            // 새 버튼에 이벤트 리스너 추가
            document.getElementById('backToMenuBtnDice').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('backToMenuBtnDice 클릭됨 (setupDiceEventListeners)');
                this.backToMenu();
            });
        }
        
        // 배팅 금액 입력
        document.getElementById('diceBetAmount')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 1;
            this.diceBetAmount = Math.max(1, Math.min(this.money, value));
            this.updateDiceDisplay();
            this.updateDiceProbabilities();
        });
        
        document.getElementById('diceBetHalf')?.addEventListener('click', () => {
            this.diceBetAmount = Math.floor(this.diceBetAmount / 2) || 1;
            this.updateDiceDisplay();
            this.updateDiceProbabilities();
        });
        
        document.getElementById('diceBetDouble')?.addEventListener('click', () => {
            this.diceBetAmount = Math.min(this.money, this.diceBetAmount * 2);
            this.updateDiceDisplay();
            this.updateDiceProbabilities();
        });
        
        // 숫자 슬라이더
        document.getElementById('diceNumberSlider')?.addEventListener('input', (e) => {
            this.diceSelectedNumber = parseInt(e.target.value);
            document.getElementById('selectedDiceNumber').textContent = this.diceSelectedNumber;
            document.getElementById('targetDiceNumber').textContent = this.diceSelectedNumber;
            this.updateDiceProbabilities();
        });
        
        // 배팅 옵션 선택 (배팅하지 않고 선택만)
        document.getElementById('diceBetSmaller')?.addEventListener('click', () => {
            this.diceBetType = 'smaller';
            // 배팅 버튼 선택 표시
            document.querySelectorAll('.dice-bet-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.getElementById('diceBetSmaller')?.classList.add('selected');
            this.updateDiceProbabilities();
        });
        
        document.getElementById('diceBetLarger')?.addEventListener('click', () => {
            this.diceBetType = 'larger';
            // 배팅 버튼 선택 표시
            document.querySelectorAll('.dice-bet-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.getElementById('diceBetLarger')?.classList.add('selected');
            this.updateDiceProbabilities();
        });
        
        // 게임 시작 버튼
        document.getElementById('diceStartGameBtn')?.addEventListener('click', () => {
            if (!this.diceBetType) {
                this.showMessage('더 작은 또는 더 큰을 선택해주세요!', 'warning');
                return;
            }
            this.rollDice();
        });
        
        // 빠른 칩 선택
        document.querySelectorAll('.dice-chip')?.forEach(chip => {
            chip.addEventListener('click', () => {
                const value = parseInt(chip.dataset.value);
                if (value <= this.money) {
                    this.diceBetAmount = value;
                    this.updateDiceDisplay();
                    this.updateDiceProbabilities();
                }
            });
        });
    }


    async rollDice() {
        if (this.diceGamePhase !== 'betting' || !this.diceBetType) {
            this.showMessage('더 작은 또는 더 큰을 선택해주세요!', 'warning');
            return;
        }

        if (this.money < this.diceBetAmount) {
            this.showMessage('💰 학습 포인트가 부족합니다!', 'danger');
            return;
        }

        this.diceGamePhase = 'rolling';
        this.money -= this.diceBetAmount;
        this.updateDisplay();
        
        // 게임 시작 버튼 비활성화
        const startBtn = document.getElementById('diceStartGameBtn');
        if (startBtn) startBtn.disabled = true;
        
        // 주사위 굴리기 사운드
        this.playSound('dice');
        
        // 먼저 랜덤 숫자 생성 (애니메이션 전에)
        const rolledNumber = await this.rollDiceNumber();
        
        // 주사위 굴리기 애니메이션 (생성된 숫자로 최종 표시)
        await this.animateDiceRollNew(rolledNumber);
        
        // 결과 처리
        this.processDiceResultNew(rolledNumber);
    }

    async rollDiceNumber() {
        // Random.org API 사용 (0-100 범위)
        try {
            const response = await fetch('https://www.random.org/integers/?num=1&min=0&max=100&col=1&base=10&format=plain&rnd=new');
            if (response.ok) {
                const text = await response.text();
                return parseInt(text.trim());
            }
        } catch (error) {
            console.log('Random.org API 실패, Math.random() 사용:', error);
        }
        // Fallback to Math.random()
        return Math.floor(Math.random() * 101); // 0-100
    }

    async animateDiceRollNew(finalNumber) {
        const rolledNumberEl = document.getElementById('rolledDiceNumber');
        let count = 0;
        const animationDuration = 1500; // 애니메이션 총 시간 (ms)
        const intervalTime = 50; // 업데이트 간격 (ms)
        const totalFrames = Math.floor(animationDuration / intervalTime);
        
        const interval = setInterval(() => {
            // 애니메이션 중에는 랜덤 숫자 표시
            rolledNumberEl.textContent = String(Math.floor(Math.random() * 101)).padStart(2, '0');
            count++;
            
            if (count >= totalFrames) {
                clearInterval(interval);
                // 애니메이션 종료 시 최종 숫자로 고정
                rolledNumberEl.textContent = String(finalNumber).padStart(2, '0');
            }
        }, intervalTime);
        
        // 애니메이션 완료 대기
        return new Promise(resolve => setTimeout(resolve, animationDuration));
    }

    processDiceResultNew(rolledNumber) {
        // 애니메이션에서 이미 숫자가 표시되었으므로 여기서는 다시 설정하지 않음
        const rolledNumberEl = document.getElementById('rolledDiceNumber');
        // 숫자가 이미 표시되어 있는지 확인하고, 없으면 표시
        if (rolledNumberEl.textContent === '00' || rolledNumberEl.textContent === '') {
            rolledNumberEl.textContent = String(rolledNumber).padStart(2, '0');
        }
        
        let isWin = false;
        let winnings = 0;
        
        if (this.diceBetType === 'smaller') {
            isWin = rolledNumber < this.diceSelectedNumber;
        } else if (this.diceBetType === 'larger') {
            isWin = rolledNumber > this.diceSelectedNumber;
        }
        
        if (isWin) {
            const multiplier = this.calculateDiceMultiplier();
            winnings = Math.floor(this.diceBetAmount * multiplier);
            this.money += this.diceBetAmount + winnings;
            this.winCount++;
            this.playSound('win');
            this.showMessage(`🎉 승리! +${winnings}P 획득!`, 'success');
        } else {
            this.playSound('lose');
            this.showMessage(`💀 패배... ${this.diceBetAmount}P 손실`, 'danger');
        }
        
        // 히스토리 기록
        this.diceHistory.push({
            target: this.diceSelectedNumber,
            rolled: rolledNumber,
            betType: this.diceBetType,
            betAmount: this.diceBetAmount,
            winnings: winnings,
            isWin: isWin
        });
        
        // 최근 결과 업데이트
        this.diceRecentResults.unshift({
            number: rolledNumber,
            isWin: isWin
        });
        if (this.diceRecentResults.length > 20) {
            this.diceRecentResults.pop();
        }
        
        this.updateDiceDisplay();
        this.updateDiceHistory();
        this.updateRecentResults();
        
        // 유저 데이터 저장
        this.saveGameData('dice', {
            win: isWin,
            loss: !isWin,
            betAmount: this.diceBetAmount,
            winnings: winnings
        });
        
        // 다음 라운드 준비
        setTimeout(() => {
            this.diceGamePhase = 'betting';
            this.diceBetType = null;
            document.querySelectorAll('.dice-bet-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            rolledNumberEl.textContent = '00';
            
            // 게임 시작 버튼 활성화
            const startBtn = document.getElementById('diceStartGameBtn');
            if (startBtn) startBtn.disabled = false;
        }, 2000);
    }

    calculateDiceMultiplier() {
        // 확률 기반 배당률 계산 (하우스 엣지 1% 포함)
        const probability = this.diceBetType === 'smaller' 
            ? this.diceSelectedNumber / 100
            : (100 - this.diceSelectedNumber) / 100;
        
        if (probability === 0) return 1;
        return parseFloat(((1 / probability) * 0.99).toFixed(2)); // 하우스 엣지 1%, 소수점 2자리
    }

    updateRecentResults() {
        const container = document.getElementById('diceRecentResults');
        if (!container) return;
        
        container.innerHTML = '';
        this.diceRecentResults.slice(0, 10).forEach(result => {
            const item = document.createElement('div');
            item.className = `recent-result-item ${result.isWin ? 'win' : 'lose'}`;
            item.textContent = String(result.number).padStart(2, '0');
            container.appendChild(item);
        });
    }

    updateDiceDisplay() {
        // 배팅 금액 표시
        const betAmountInput = document.getElementById('diceBetAmount');
        if (betAmountInput) {
            betAmountInput.value = this.diceBetAmount;
        }
        
        // 칩 선택 표시
        document.querySelectorAll('.dice-chip').forEach(chip => {
            chip.classList.toggle('selected', parseInt(chip.dataset.value) === this.diceBetAmount);
        });
        
        // 학습 포인트 실시간 업데이트
        this.updateDisplay();
    }

    updateDiceProbabilities() {
        if (!this.diceBetType) {
            // 기본 확률 계산 (더 작은/더 큰)
            const smallerProb = (this.diceSelectedNumber / 100 * 100).toFixed(2);
            const largerProb = ((100 - this.diceSelectedNumber) / 100 * 100).toFixed(2);
            
            document.getElementById('smallerProb').textContent = `${smallerProb}%`;
            document.getElementById('largerProb').textContent = `${largerProb}%`;
            
            // 기본 승수 계산
            const smallerMultiplier = parseFloat(((1 / (parseFloat(smallerProb) / 100)) * 0.99).toFixed(2));
            const largerMultiplier = parseFloat(((1 / (parseFloat(largerProb) / 100)) * 0.99).toFixed(2));
            const avgMultiplier = ((smallerMultiplier + largerMultiplier) / 2).toFixed(2);
            
            document.getElementById('diceMultiplier').textContent = `x${avgMultiplier}`;
            document.getElementById('diceWinProbability').textContent = '50.00%';
            document.getElementById('dicePossibleWin').textContent = '0P';
        } else {
            // 선택한 배팅 타입에 따른 확률
            const probability = this.diceBetType === 'smaller' 
                ? this.diceSelectedNumber / 100
                : (100 - this.diceSelectedNumber) / 100;
            
            const probPercent = (probability * 100).toFixed(2);
            const multiplier = this.calculateDiceMultiplier();
            const possibleWin = Math.floor(this.diceBetAmount * multiplier);
            
            document.getElementById('diceMultiplier').textContent = `x${multiplier.toFixed(2)}`;
            document.getElementById('diceWinProbability').textContent = `${probPercent}%`;
            document.getElementById('dicePossibleWin').textContent = `${possibleWin}P`;
            
            // 확률 패널 업데이트
            document.getElementById('smallerProb').textContent = `${(this.diceSelectedNumber / 100 * 100).toFixed(2)}%`;
            document.getElementById('largerProb').textContent = `${((100 - this.diceSelectedNumber) / 100 * 100).toFixed(2)}%`;
        }
        
        // 기대값 계산
        if (this.diceBetType) {
            const probability = this.diceBetType === 'smaller' 
                ? this.diceSelectedNumber / 100
                : (100 - this.diceSelectedNumber) / 100;
            const multiplier = this.calculateDiceMultiplier();
            const ev = ((probability * multiplier - 1) * 100).toFixed(2);
            document.getElementById('diceEV').textContent = `${ev}%`;
        }
    }

    updateDiceHistory() {
        const historyContainer = document.getElementById('diceHistoryResults');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        const recentHistory = this.diceHistory.slice(-10).reverse();
        recentHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = `dice-history-item ${entry.isWin ? 'win' : 'lose'}`;
            
            const resultIcon = entry.isWin ? '✓' : '✗';
            const winningsText = entry.winnings > 0 ? `+${entry.winnings}P` : '0P';
            
            historyItem.innerHTML = `
                <div class="history-icon">${resultIcon}</div>
                <div class="history-numbers">
                    <span class="history-target">${entry.target}</span>
                    <span class="history-operator">${entry.betType === 'smaller' ? '<' : '>'}</span>
                    <span class="history-rolled">${entry.rolled}</span>
                </div>
                <div class="history-winnings">${winningsText}</div>
            `;
            historyContainer.appendChild(historyItem);
        });
    }

    clearDiceHistory() {
        this.diceHistory = [];
        this.updateDiceHistory();
    }

    showDiceRules() {
        document.getElementById('diceRulesModal').style.display = 'flex';
    }

    hideDiceRules() {
        document.getElementById('diceRulesModal').style.display = 'none';
    }

    showDiceProbability() {
        // 확률 분석 모달 표시 (추후 구현)
        this.showMessage('📊 다이스 확률 분석 기능은 준비 중입니다!', 'info');
    }

    // ========== 홀덤 게임 메서드 ==========
    setupHoldem() {
        console.log('홀덤 게임 설정 시작');
        const currentGameEl = document.getElementById('currentGame');
        if (currentGameEl) {
            currentGameEl.textContent = '텍사스 홀덤';
        }
        
        // 홀덤 게임은 별도 클래스에서 관리
        if (window.holdemGame) {
            // 이미 초기화됨
        } else {
            console.log('홀덤 게임 인스턴스가 없습니다.');
        }
        
        this.showMessage('🎴 테이블에 참가하여 게임을 시작하세요!');
    }

    // ========== 하이로우 게임 메서드 ==========
    setupHilo() {
        console.log('하이로우 게임 설정 시작');
        const currentGameEl = document.getElementById('currentGame');
        if (currentGameEl) {
            currentGameEl.textContent = '하이로우 카드 학습';
        }
        
        this.hiloGamePhase = 'waiting';
        this.hiloSelectedChip = 10;
        this.hiloBets = { higher: 0, lower: 0 };
        this.hiloBetAmount = 0;
        this.hiloCurrentCard = null;
        this.hiloDrawnCards = [];
        this.hiloRemainingCards = 52;
        
        this.setupHiloEventListeners();
        this.updateHiloDisplay();
        this.showMessage('🃏 게임 시작 버튼을 눌러주세요!');
        const hiloGamePhaseTextEl = document.getElementById('hiloGamePhaseText');
        if (hiloGamePhaseTextEl) {
            hiloGamePhaseTextEl.textContent = '대기 중';
        }
    }

    setupHiloEventListeners() {
        // 메뉴로 돌아가기 버튼 이벤트 리스너 설정 (게임 영역이 표시될 때마다 다시 설정)
        const backToMenuBtnHilo = document.getElementById('backToMenuBtnHilo');
        if (backToMenuBtnHilo) {
            // 기존 이벤트 리스너 제거를 위해 클론 후 교체
            const newBtn = backToMenuBtnHilo.cloneNode(true);
            backToMenuBtnHilo.replaceWith(newBtn);
            // 새 버튼에 이벤트 리스너 추가
            document.getElementById('backToMenuBtnHilo').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('backToMenuBtnHilo 클릭됨 (setupHiloEventListeners)');
                this.backToMenu();
            });
        }
        
        // 하이로우 칩 선택
        const hiloChips = document.querySelectorAll('.hilo-chip');
        hiloChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectHiloChip(parseInt(chip.dataset.value));
            });
        });

        // 하이로우 배팅 옵션 클릭
        const betOptions = document.querySelectorAll('.hilo-bet-option');
        betOptions.forEach(option => {
            option.addEventListener('click', () => {
                const betType = option.dataset.bet;
                this.placeHiloBet(betType);
            });
        });
    }

    selectHiloChip(value) {
        this.hiloSelectedChip = value;
        document.querySelectorAll('.hilo-chip').forEach(chip => {
            chip.classList.toggle('selected', parseInt(chip.dataset.value) === value);
        });
    }

    async startHilo() {
        if (this.hiloGamePhase !== 'waiting') return;
        
        const cards = await this.drawCards(1);
        this.hiloCurrentCard = cards[0];
        this.hiloDrawnCards = [cards[0]];
        this.hiloRemainingCards = 51;
        this.hiloGamePhase = 'betting';
        
        // 카드 딜링 애니메이션
        const cardDisplay = document.getElementById('currentHiloCard');
        const cardImg = document.createElement('img');
        cardImg.src = cards[0].image;
        cardImg.style.width = '150px';
        cardImg.style.height = 'auto';
        cardImg.style.borderRadius = '10px';
        cardImg.style.opacity = '0';
        cardDisplay.innerHTML = '';
        cardDisplay.appendChild(cardImg);
        
        await this.animateCardDeal(cardImg, 0, 0);
        
        this.updateHiloProbabilities();
        this.showMessage('🃏 현재 카드를 확인하고 높음/낮음을 선택하세요!');
        
        document.getElementById('startHiloBtn').style.display = 'none';
        document.getElementById('drawNextCardBtn').style.display = 'none';
        document.getElementById('clearHiloBetsBtn').style.display = 'block';
        document.getElementById('changeCardBtn').style.display = 'block';
        document.getElementById('hiloGamePhaseText').textContent = '배팅 시간';
    }

    async changeHiloCard() {
        if (this.hiloGamePhase !== 'betting') return;
        
        const cards = await this.drawCards(1);
        this.hiloCurrentCard = cards[0];
        this.hiloDrawnCards = [cards[0]];
        this.hiloRemainingCards = 51;
        
        // 카드 교체 애니메이션
        const cardDisplay = document.getElementById('currentHiloCard');
        const cardImg = document.createElement('img');
        cardImg.src = cards[0].image;
        cardImg.style.width = '150px';
        cardImg.style.height = 'auto';
        cardImg.style.borderRadius = '10px';
        cardImg.style.opacity = '0';
        cardDisplay.innerHTML = '';
        cardDisplay.appendChild(cardImg);
        
        await this.animateCardDeal(cardImg, 0, 0);
        
        this.updateHiloProbabilities();
        this.showMessage('🔄 카드가 교체되었습니다!');
    }

    placeHiloBet(betType) {
        if (this.hiloGamePhase !== 'betting') return;
        if (this.money < this.hiloSelectedChip) {
            this.showMessage('💰 학습 포인트가 부족합니다!', 'danger');
            return;
        }
        if (this.hiloBets.higher > 0 || this.hiloBets.lower > 0) {
            this.showMessage('이미 배팅했습니다!', 'warning');
            return;
        }

        this.hiloBets[betType] = this.hiloSelectedChip;
        this.hiloBetAmount = this.hiloSelectedChip;
        this.money -= this.hiloSelectedChip;
        
        this.updateHiloDisplay();
        this.showMessage(`🃏 ${betType === 'higher' ? '높음' : '낮음'}에 ${this.hiloSelectedChip}P 배팅했습니다!`);
        
        document.getElementById('drawNextCardBtn').style.display = 'block';
        document.getElementById('clearHiloBetsBtn').style.display = 'none';
    }

    async drawNextHiloCard() {
        if (this.hiloGamePhase !== 'betting' || (this.hiloBets.higher === 0 && this.hiloBets.lower === 0)) {
            this.showMessage('배팅을 먼저 해주세요!', 'warning');
            return;
        }

        this.hiloGamePhase = 'result';
        const cards = await this.drawCards(1);
        const nextCard = cards[0];
        this.hiloDrawnCards.push(nextCard);
        this.hiloRemainingCards--;
        
        const result = this.compareHiloCards(this.hiloCurrentCard, nextCard);
        await this.processHiloResult(result, nextCard);
    }

    compareHiloCards(currentCard, nextCard) {
        const currentValue = this.getCardValue(currentCard);
        const nextValue = this.getCardValue(nextCard);
        
        if (nextValue > currentValue) return 'higher';
        if (nextValue < currentValue) return 'lower';
        return 'same';
    }

    getCardValue(card) {
        const valueMap = {
            'ACE': 1, '2': 2, '3': 3, '4': 4, '5': 5,
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'JACK': 11, 'QUEEN': 12, 'KING': 13
        };
        return valueMap[card.value] || 0;
    }

    async processHiloResult(result, nextCard) {
        const betType = this.hiloBets.higher > 0 ? 'higher' : 'lower';
        let winnings = 0;
        let resultMessage = '';
        
        // 다음 카드 표시 (애니메이션)
        const nextCardDisplay = document.getElementById('nextHiloCard');
        nextCardDisplay.innerHTML = '';
        const nextCardImg = document.createElement('img');
        nextCardImg.src = nextCard.image;
        nextCardImg.alt = `${nextCard.value} of ${nextCard.suit}`;
        nextCardImg.style.width = '120px';
        nextCardImg.style.height = 'auto';
        nextCardImg.style.borderRadius = '10px';
        nextCardImg.style.opacity = '0';
        nextCardDisplay.appendChild(nextCardImg);
        document.getElementById('nextCardResult').style.display = 'block';
        
        await this.animateCardDeal(nextCardImg, 0, 0);
        
        if (result === 'same') {
            resultMessage = '동일한 카드입니다! 배팅금 반환';
            this.money += this.hiloBetAmount;
            winnings = 0;
        } else if ((betType === 'higher' && result === 'higher') || (betType === 'lower' && result === 'lower')) {
            // 승리
            const multiplier = this.calculateHiloMultiplier(betType);
            winnings = Math.floor(this.hiloBetAmount * multiplier);
            this.money += this.hiloBetAmount + winnings;
            resultMessage = `승리! +${winnings}P 획득!`;
            this.winCount++;
        } else {
            resultMessage = '패배!';
            winnings = -this.hiloBetAmount;
        }
        
        document.getElementById('hiloResultMessage').textContent = resultMessage;
        document.getElementById('hiloResultMessage').className = `result-message ${winnings > 0 ? 'win' : winnings < 0 ? 'lose' : 'tie'}`;
        
        // 히스토리 기록
        this.hiloHistory.push({
            currentCard: this.hiloCurrentCard,
            nextCard: nextCard,
            bet: betType,
            result: result,
            winnings: winnings
        });
        
        this.updateHiloHistory();
        this.updateDisplay();
        
        // 유저 데이터 저장
        this.saveGameData('hilo', {
            win: winnings > 0,
            loss: winnings < 0,
            tie: winnings === 0,
            betAmount: this.hiloBetAmount,
            winnings: winnings
        });
        
        if (winnings > 0) {
            this.showMessage(`🎉 ${resultMessage}`, 'success');
            this.playSound('win');
        } else if (winnings < 0) {
            this.showMessage(resultMessage, 'danger');
            this.playSound('lose');
        } else {
            this.showMessage(resultMessage, 'info');
        }
        
        // 다음 라운드 준비
        setTimeout(() => {
            this.hiloCurrentCard = nextCard;
            this.hiloBets = { higher: 0, lower: 0 };
            this.hiloBetAmount = 0;
            this.hiloGamePhase = 'betting';
            this.updateHiloDisplay();
            this.updateHiloProbabilities();
            document.getElementById('drawNextCardBtn').style.display = 'none';
            document.getElementById('clearHiloBetsBtn').style.display = 'block';
            document.getElementById('nextCardResult').style.display = 'none';
        }, 3000);
    }

    calculateHiloMultiplier(betType) {
        // 확률 기반 배당률 계산 (하우스 엣지 5% 포함)
        const prob = betType === 'higher' 
            ? parseFloat(document.getElementById('higherProbDisplay').textContent.replace('%', ''))
            : parseFloat(document.getElementById('lowerProbDisplay').textContent.replace('%', ''));
        
        if (prob === 0) return 1;
        return (1 / (prob / 100)) * 0.95; // 하우스 엣지 5%
    }

    updateHiloProbabilities() {
        if (!this.hiloCurrentCard) return;
        
        const currentValue = this.getCardValue(this.hiloCurrentCard);
        let higher = 0, lower = 0, same = 0;
        
        // 남은 카드 중 확률 계산 (간단한 추정)
        for (let i = 1; i <= 13; i++) {
            const count = (i === currentValue) ? 3 : 4; // 현재 카드 제외
            if (i > currentValue) higher += count;
            else if (i < currentValue) lower += count;
            else same += count;
        }
        
        const total = higher + lower + same;
        const higherProb = ((higher / total) * 100).toFixed(2);
        const lowerProb = ((lower / total) * 100).toFixed(2);
        const sameProb = ((same / total) * 100).toFixed(2);
        
        document.getElementById('higherProbDisplay').textContent = `${higherProb}%`;
        document.getElementById('lowerProbDisplay').textContent = `${lowerProb}%`;
        document.getElementById('sameProbDisplay').textContent = `${sameProb}%`;
        
        // 배당률 계산
        const higherMultiplier = ((1 / (parseFloat(higherProb) / 100)) * 0.95).toFixed(2);
        const lowerMultiplier = ((1 / (parseFloat(lowerProb) / 100)) * 0.95).toFixed(2);
        
        document.getElementById('higherProb').textContent = `${higherProb}%`;
        document.getElementById('lowerProb').textContent = `${lowerProb}%`;
        document.getElementById('higherMultiplier').textContent = `x${higherMultiplier}`;
        document.getElementById('lowerMultiplier').textContent = `x${lowerMultiplier}`;
        
        document.getElementById('remainingCards').textContent = this.hiloRemainingCards;
    }

    updateHiloDisplay() {
        // 현재 카드 표시
        const currentCardDisplay = document.getElementById('currentHiloCard');
        if (this.hiloCurrentCard) {
            currentCardDisplay.innerHTML = `
                <img src="${this.hiloCurrentCard.image}" alt="${this.hiloCurrentCard.value} of ${this.hiloCurrentCard.suit}" style="width: 150px; height: auto; border-radius: 10px;">
            `;
        } else {
            currentCardDisplay.innerHTML = '<div class="card-placeholder">카드를 뽑아주세요</div>';
        }
        
        // 배팅 표시
        Object.keys(this.hiloBets).forEach(betType => {
            const chipsContainer = document.getElementById(`${betType}Chips`);
            chipsContainer.innerHTML = '';
            if (this.hiloBets[betType] > 0) {
                const chip = document.createElement('div');
                chip.className = 'bet-chip';
                chip.textContent = `${this.hiloBets[betType]}P`;
                chipsContainer.appendChild(chip);
            }
        });
        
        // 학습 포인트 실시간 업데이트
        this.updateDisplay();
    }

    updateHiloHistory() {
        const historyContainer = document.getElementById('hiloHistoryResults');
        historyContainer.innerHTML = '';
        
        const recentHistory = this.hiloHistory.slice(-10).reverse();
        recentHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            const resultIcon = entry.winnings > 0 ? '✅' : entry.winnings < 0 ? '❌' : '➖';
            historyItem.innerHTML = `
                <span>${resultIcon} ${entry.bet === 'higher' ? '높음' : '낮음'}</span>
                <span>${entry.winnings > 0 ? '+' : ''}${entry.winnings}P</span>
            `;
            historyContainer.appendChild(historyItem);
        });
    }

    clearHiloBets() {
        if (this.hiloBetAmount > 0) {
            this.money += this.hiloBetAmount;
            this.hiloBets = { higher: 0, lower: 0 };
            this.hiloBetAmount = 0;
            this.updateHiloDisplay();
            document.getElementById('drawNextCardBtn').style.display = 'none';
        }
    }

    clearHiloHistory() {
        this.hiloHistory = [];
        this.updateHiloHistory();
    }

    hiloHalfBet() {
        if (this.hiloBetAmount > 0) {
            const half = Math.floor(this.hiloBetAmount / 2);
            this.money += half;
            this.hiloBetAmount = half;
            const betType = this.hiloBets.higher > 0 ? 'higher' : 'lower';
            this.hiloBets[betType] = half;
            this.updateHiloDisplay();
        }
    }

    hiloDoubleBet() {
        if (this.hiloBetAmount > 0 && this.money >= this.hiloBetAmount) {
            this.money -= this.hiloBetAmount;
            this.hiloBetAmount *= 2;
            const betType = this.hiloBets.higher > 0 ? 'higher' : 'lower';
            this.hiloBets[betType] = this.hiloBetAmount;
            this.updateHiloDisplay();
        }
    }

    showHiloRules() {
        document.getElementById('hiloRulesModal').style.display = 'flex';
    }

    hideHiloRules() {
        document.getElementById('hiloRulesModal').style.display = 'none';
    }

    showHiloProbability() {
        // 확률 분석 모달 표시 (추후 구현)
        this.showMessage('📊 하이로우 확률 분석 기능은 준비 중입니다!', 'info');
    }

    // ========== 사운드 관리 메서드 ==========
    toggleBgMusic() {
        this.bgMusicEnabled = !this.bgMusicEnabled;
        const icon = document.getElementById('bgMusicIcon');
        
        if (this.bgMusicEnabled) {
            this.bgMusic.play().catch(e => console.log('배경 음악 재생 실패:', e));
            icon.textContent = '🔊';
        } else {
            this.bgMusic.pause();
            icon.textContent = '🔇';
        }
    }

    toggleSoundEffects() {
        this.soundEffectsEnabled = !this.soundEffectsEnabled;
        const icon = document.getElementById('soundEffectsIcon');
        icon.textContent = this.soundEffectsEnabled ? '🔊' : '🔇';
    }

    playSound(soundType) {
        if (!this.soundEffectsEnabled) return;
        
        let sound;
        switch(soundType) {
            case 'win':
                sound = this.winSound;
                break;
            case 'lose':
                sound = this.loseSound;
                break;
            case 'card':
                sound = this.cardDealSound;
                break;
            case 'dice':
                sound = this.diceRollSound;
                break;
            default:
                return;
        }
        
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('효과음 재생 실패:', e));
        }
    }

    // ========== 다이스 API 통합 ==========
    async rollDiceWithAPI() {
        // Random.org API 사용 (무료, 일일 제한 있음)
        // API 문서: https://www.random.org/clients/http/api/
        try {
            // 1-6 범위의 난수 2개 요청
            const response = await fetch('https://www.random.org/integers/?num=2&min=1&max=6&col=1&base=10&format=plain&rnd=new');
            
            if (response.ok) {
                const text = await response.text();
                const numbers = text.trim().split('\n').map(n => parseInt(n));
                return { die1: numbers[0], die2: numbers[1], sum: numbers[0] + numbers[1] };
            } else {
                throw new Error('API 요청 실패');
            }
        } catch (error) {
            console.log('Random.org API 실패, Math.random() 사용:', error);
            // Fallback to Math.random()
            const die1 = Math.floor(Math.random() * 6) + 1;
            const die2 = Math.floor(Math.random() * 6) + 1;
            return { die1, die2, sum: die1 + die2 };
        }
    }

    // ========== 카드 딜링 애니메이션 ==========
    async animateCardDeal(cardElement, targetPosition, delay = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                cardElement.style.opacity = '0';
                cardElement.style.transform = 'translateY(-100px) rotateY(180deg)';
                cardElement.style.transition = 'none';
                
                // 카드 딜링 사운드
                this.playSound('card');
                
                requestAnimationFrame(() => {
                    cardElement.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    cardElement.style.opacity = '1';
                    cardElement.style.transform = 'translateY(0) rotateY(0deg)';
                    
                    setTimeout(() => {
                        resolve();
                    }, 600);
                });
            }, delay);
        });
    }

    async animateCardFlip(cardElement) {
        return new Promise((resolve) => {
            cardElement.style.transition = 'transform 0.5s';
            cardElement.style.transform = 'rotateY(180deg)';
            
            setTimeout(() => {
                cardElement.style.transform = 'rotateY(0deg)';
                setTimeout(() => resolve(), 500);
            }, 500);
        });
    }
}

// 게임 인스턴스 생성
let game;

document.addEventListener('DOMContentLoaded', function() {
    // Firebase 인증이 완료된 후 게임 초기화
    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // 로그인된 경우에만 게임 시작
                if (!game) {
                    game = new RoyalCasino();
                    window.game = game; // 전역 접근 가능하도록
                }
            }
        });
    } else {
        // Firebase가 설정되지 않은 경우에도 게임 실행 가능
        game = new RoyalCasino();
        window.game = game;
    }
});