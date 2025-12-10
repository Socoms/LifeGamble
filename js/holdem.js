// 텍사스 홀덤 게임 - 멀티플레이어 포커

class HoldemGame {
    constructor() {
        this.gameId = null;
        this.players = [];
        this.communityCards = [];
        this.deck = [];
        this.currentRound = 'waiting'; // waiting, preflop, flop, turn, river, showdown
        this.pot = 0;
        this.currentBet = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
        this.dealerPosition = 0;
        this.currentPlayerIndex = 0;
        this.mySeat = -1;
        this.myCards = [];
        this.gameRef = null;
        this.unsubscribe = null;
        this.isLeaving = false; // 중복 제거 방지
        this.boundHandleUnload = null;
        this.countdownTimer = null;
        this.isStarting = false;
        this.locked = false;
        this.countdownStart = null;
        this.status = 'waiting';
        
        this.init();
    }

    init() {
        console.log('홀덤 게임 초기화');
        this.setupEventListeners();
        
        // 페이지 이탈 시 자동 정리
        this.boundHandleUnload = () => this.handleUnload();
        window.addEventListener('beforeunload', this.boundHandleUnload);
        window.addEventListener('pagehide', this.boundHandleUnload);
    }

    setupEventListeners() {
        // 게임 모드 선택 시 홀덤 설정
        document.querySelectorAll('.mode-card[data-mode="holdem"]').forEach(card => {
            card.addEventListener('click', () => {
                if (window.game) {
                    window.game.selectGameMode('holdem');
                }
            });
        });

        // 홀덤 게임 버튼들
        document.getElementById('showHoldemRulesBtn')?.addEventListener('click', () => this.showRules());
        document.getElementById('closeHoldemRules')?.addEventListener('click', () => this.hideRules());
        document.getElementById('joinHoldemTableBtn')?.addEventListener('click', () => this.joinTable());
        document.getElementById('leaveHoldemTableBtn')?.addEventListener('click', () => this.leaveTable());
        document.getElementById('startHoldemGameBtn')?.addEventListener('click', () => this.startGame());
        document.getElementById('backToMenuBtnHoldem')?.addEventListener('click', () => this.backToMenu());
        
        // 액션 버튼들
        document.getElementById('holdemFoldBtn')?.addEventListener('click', () => this.fold());
        document.getElementById('holdemCallBtn')?.addEventListener('click', () => this.call());
        document.getElementById('holdemRaiseBtn')?.addEventListener('click', () => this.showRaiseInput());
        document.getElementById('holdemCheckBtn')?.addEventListener('click', () => this.check());
        document.getElementById('confirmRaiseBtn')?.addEventListener('click', () => this.raise());
        
        // 칩 선택
        document.querySelectorAll('.holdem-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const value = parseInt(chip.dataset.value);
                this.selectChip(value);
            });
        });
    }

    async joinTable() {
        if (!window.authManager || !window.authManager.currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const user = window.authManager.currentUser;
            const userData = window.authManager.userData;
            
            // 기존 게임 찾기 또는 새 게임 생성
            const gamesRef = db.collection('holdemGames');
            // Firestore 인덱스 문제를 완전히 피하기 위해 모든 게임을 가져온 후 클라이언트에서 필터링
            // 실제 운영 환경에서는 인덱스를 생성하거나 다른 방법을 사용하는 것이 좋습니다.
            const allGamesSnap = await gamesRef
                .limit(20) // 최근 20개 게임만 조회
                .get();
            
            // 클라이언트에서 'waiting' 상태이고 자리가 있는 게임 찾기
            let targetGameDoc = null;
            let latestCreatedAt = null;
            
            allGamesSnap.forEach(doc => {
                const data = doc.data() || {};
                // status가 'waiting'이고 플레이어가 6명 미만인 게임 찾기
                if (data.status === 'waiting' || data.status === 'starting') {
                    const playerCount = (data.players || []).length;
                    if (playerCount < 6) {
                        // createdAt 처리 (Timestamp 객체 또는 숫자)
                        let createdAt = 0;
                        if (data.createdAt) {
                            if (data.createdAt.toMillis) {
                                createdAt = data.createdAt.toMillis();
                            } else if (data.createdAt.seconds) {
                                createdAt = data.createdAt.seconds * 1000;
                            } else if (typeof data.createdAt === 'number') {
                                createdAt = data.createdAt;
                            }
                        }
                        
                        // 가장 최근에 생성된 게임 선택
                        if (!targetGameDoc || createdAt > (latestCreatedAt || 0)) {
                            targetGameDoc = doc;
                            latestCreatedAt = createdAt;
                        }
                    }
                }
            });
            
            if (targetGameDoc) {
                // 기존 게임에 참가
                const data = targetGameDoc.data() || {};
                if (data.locked) {
                    alert('곧 게임이 시작됩니다. 잠시 후 참여해주세요.');
                    return;
                }
                this.gameId = targetGameDoc.id;
                this.gameRef = gamesRef.doc(this.gameId);
            } else {
                // 새 게임 생성
                this.gameRef = gamesRef.doc();
                this.gameId = this.gameRef.id;
                await this.gameRef.set({
                    status: 'waiting',
                    locked: false,
                    countdownStart: null,
                    players: [],
                    communityCards: [],
                    pot: 0,
                    currentBet: 0,
                    currentRound: 'waiting',
                    dealerPosition: 0,
                    currentPlayerIndex: 0,
                    smallBlind: this.smallBlind,
                    bigBlind: this.bigBlind,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // 기존 플레이어 정보 가져오기
            const gameData = await this.gameRef.get();
            const existingPlayers = gameData.exists ? (gameData.data().players || []) : [];
            const countdownStart = gameData.exists ? gameData.data().countdownStart : null;
            const locked = gameData.exists ? gameData.data().locked : false;
            
            // 이미 참가한 플레이어인지 확인
            const existingPlayerIndex = existingPlayers.findIndex(p => p.uid === user.uid);
            if (existingPlayerIndex !== -1) {
                // 이미 참가한 경우
                console.log('이미 테이블에 참가되어 있습니다.');
                // 참가 상태면 타이머 표시를 위해 updateDisplay 호출
                this.updateDisplay();
            } else {
                if (locked) {
                    alert('5초 남은 상태에서는 참가할 수 없습니다.');
                    return;
                }
                // 빈 자리 찾기
                const occupiedSeats = existingPlayers.map(p => p.seat).filter(seat => seat >= 0 && seat < 6);
                let availableSeat = -1;
                for (let i = 0; i < 6; i++) {
                    if (!occupiedSeats.includes(i)) {
                        availableSeat = i;
                        break;
                    }
                }
                
                if (availableSeat === -1) {
                    alert('테이블이 가득 찼습니다.');
                    return;
                }
                
                // 플레이어 추가
                const player = {
                    uid: user.uid,
                    nickname: userData?.nickname || user.email.split('@')[0],
                    seat: availableSeat,
                    chips: window.game ? window.game.money : 1000,
                    cards: [],
                    bet: 0,
                    status: 'active', // active, folded, allin
                    isDealer: false,
                    isSmallBlind: false,
                    isBigBlind: false
                };

                await this.gameRef.update({
                    players: firebase.firestore.FieldValue.arrayUnion(player)
                });
            }

            // 카운트다운 시작 설정 (없을 때만)
            if (!countdownStart) {
                await this.gameRef.update({
                    countdownStart: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'starting',
                    locked: false
                });
                // 업데이트 후 다시 가져와서 countdownStart 설정
                const updatedData = await this.gameRef.get();
                if (updatedData.exists) {
                    this.countdownStart = updatedData.data().countdownStart;
                }
            } else {
                // 기존 countdownStart가 있으면 설정
                this.countdownStart = countdownStart;
            }

            // 실시간 리스너 설정
            this.setupRealtimeListener();

            document.getElementById('joinHoldemTableBtn').style.display = 'none';
            document.getElementById('leaveHoldemTableBtn').style.display = 'block';
        } catch (error) {
            console.error('테이블 참가 오류:', error);
            alert('테이블 참가에 실패했습니다. (오류: ' + (error?.message || '알 수 없음') + ')');
        }
    }

    async leaveTable() {
        await this.removePlayerFromGame();

        this.resetGame();
        
        // 화면 즉시 업데이트
        this.updateDisplay();
        
        // 내 플레이어 정보 초기화
        const myPlayerName = document.getElementById('myPlayerName');
        const myPlayerChips = document.getElementById('myPlayerChips');
        const myPlayerBet = document.getElementById('myPlayerBet');
        if (myPlayerName) myPlayerName.textContent = '-';
        if (myPlayerChips) myPlayerChips.textContent = '-';
        if (myPlayerBet) myPlayerBet.textContent = '베팅: 0P';
        
        // 내 카드 초기화
        const myCard1 = document.getElementById('myCard1');
        const myCard2 = document.getElementById('myCard2');
        if (myCard1) {
            myCard1.classList.add('empty');
            myCard1.innerHTML = '';
        }
        if (myCard2) {
            myCard2.classList.add('empty');
            myCard2.innerHTML = '';
        }
        
        // 플레이어 목록 초기화
        const playersList = document.getElementById('holdemPlayersList');
        if (playersList) playersList.innerHTML = '';
        
        // 버튼 상태 변경
        document.getElementById('joinHoldemTableBtn').style.display = 'block';
        document.getElementById('leaveHoldemTableBtn').style.display = 'none';
        document.getElementById('startHoldemGameBtn').style.display = 'none';
    }

    async handleUnload() {
        // 새로고침/탭 닫기 시 남은 자리를 정리
        await this.removePlayerFromGame({ silent: true });
    }

    async removePlayerFromGame(options = {}) {
        if (this.isLeaving) return;
        this.isLeaving = true;

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.gameRef && window.authManager?.currentUser) {
            try {
                const gameData = await this.gameRef.get();
                if (gameData.exists) {
                    const data = gameData.data();
                    if (data.locked && (data.status === 'starting' || data.status === 'waiting')) {
                        if (!options.silent) {
                            alert('게임 시작 5초 전에는 테이블을 떠날 수 없습니다.');
                        }
                        this.isLeaving = false;
                        return;
                    }
                    const players = data.players || [];
                    const updatedPlayers = players.filter(p => p.uid !== window.authManager.currentUser.uid);
                    
                    if (updatedPlayers.length === 0) {
                        // 마지막 플레이어면 게임 삭제
                        await this.gameRef.delete();
                    } else {
                        await this.gameRef.update({ players: updatedPlayers });
                    }
                }
            } catch (error) {
                if (!options.silent) {
                    console.error('테이블 떠나기 오류:', error);
                }
            }
        }

        this.isLeaving = false;
    }

    setupRealtimeListener() {
        if (!this.gameRef) return;

        this.unsubscribe = this.gameRef.onSnapshot(async (snapshot) => {
            if (!snapshot.exists) return;

            const gameData = snapshot.data();
            await this.updateGameState(gameData);
        });
    }

    async updateGameState(gameData) {
        this.players = gameData.players || [];
        this.communityCards = gameData.communityCards || [];
        this.pot = gameData.pot || 0;
        this.currentBet = gameData.currentBet || 0;
        this.currentRound = gameData.currentRound || 'waiting';
        this.dealerPosition = gameData.dealerPosition || 0;
        this.currentPlayerIndex = gameData.currentPlayerIndex || 0;
        this.locked = gameData.locked || false;
        this.countdownStart = gameData.countdownStart || null;
        this.status = gameData.status || 'waiting';

        // seat이 할당되지 않은 플레이어에게 자동 할당
        const needsUpdate = await this.assignSeatsToPlayers();
        if (needsUpdate && this.gameRef) {
            // 업데이트가 필요한 경우 다시 가져오기
            const updatedData = await this.gameRef.get();
            if (updatedData.exists) {
                this.players = updatedData.data().players || [];
            }
        }

        // 내 플레이어 찾기
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        if (myPlayer) {
            this.mySeat = myPlayer.seat;
            this.myCards = myPlayer.cards || [];
        }

        this.updateDisplay();

        // 카운트다운 처리 및 자동 시작
        this.handleCountdownAndAutostart();
    }

    async assignSeatsToPlayers() {
        if (!this.gameRef) return false;
        
        let needsUpdate = false;
        const occupiedSeats = this.players.filter(p => p.seat >= 0 && p.seat < 6).map(p => p.seat);
        const playersWithoutSeat = this.players.filter(p => p.seat === -1 || p.seat === undefined);
        
        if (playersWithoutSeat.length === 0) return false;
        
        const updatedPlayers = [...this.players];
        
        for (const player of playersWithoutSeat) {
            // 빈 자리 찾기
            for (let i = 0; i < 6; i++) {
                if (!occupiedSeats.includes(i)) {
                    const playerIndex = updatedPlayers.findIndex(p => p.uid === player.uid);
                    if (playerIndex !== -1) {
                        updatedPlayers[playerIndex].seat = i;
                        occupiedSeats.push(i);
                        needsUpdate = true;
                        break;
                    }
                }
            }
        }
        
        if (needsUpdate) {
            try {
                await this.gameRef.update({ players: updatedPlayers });
                return true;
            } catch (error) {
                console.error('Seat 할당 오류:', error);
                return false;
            }
        }
        
        return false;
    }

    updateDisplay() {
        // 플레이어 슬롯 업데이트
        for (let i = 0; i < 6; i++) {
            const slot = document.getElementById(`playerSlot${i}`);
            if (!slot) continue;
            
            const player = this.players.find(p => p.seat === i);
            
            if (player) {
                slot.classList.remove('empty');
                const nameEl = slot.querySelector('.player-name');
                const chipsEl = slot.querySelector('.player-chips');
                const betEl = slot.querySelector('.player-bet');
                const statusEl = slot.querySelector('.player-status');
                const cardsContainer = slot.querySelector('.player-cards');
                
                if (nameEl) nameEl.textContent = player.nickname;
                if (chipsEl) chipsEl.textContent = `${player.chips}P`;
                if (betEl) betEl.textContent = `베팅: ${player.bet}P`;
                if (statusEl) {
                    statusEl.textContent = player.status === 'folded' ? '폴드' : 
                                          player.status === 'allin' ? '올인' : 
                                          player.status === 'active' ? '참가 중' : '';
                }
                
                // 플레이어 카드 표시 (내 카드가 아니면 뒷면 표시)
                if (cardsContainer) {
                    const cardSlots = cardsContainer.querySelectorAll('.card-slot');
                    const isMyPlayer = player.uid === window.authManager?.currentUser?.uid;
                    
                    if (player.cards && player.cards.length > 0) {
                        cardSlots.forEach((slot, idx) => {
                            if (idx < player.cards.length) {
                                slot.classList.remove('empty');
                                if (isMyPlayer || this.currentRound === 'showdown') {
                                    // 내 카드이거나 쇼다운이면 앞면 표시
                                    slot.innerHTML = `<img src="${this.getCardImage(player.cards[idx])}" alt="${player.cards[idx]}">`;
                                } else {
                                    // 다른 플레이어 카드는 뒷면 표시
                                    slot.innerHTML = '<div class="card-back">🂠</div>';
                                }
                            } else {
                                slot.classList.add('empty');
                                slot.innerHTML = '';
                            }
                        });
                    } else {
                        cardSlots.forEach(slot => {
                            slot.classList.add('empty');
                            slot.innerHTML = '';
                        });
                    }
                }
                
                // 내 플레이어인지 확인
                const isMyPlayer = player.uid === window.authManager?.currentUser?.uid;
                if (isMyPlayer) {
                    slot.classList.add('my-player');
                } else {
                    slot.classList.remove('my-player');
                }
                
                // 내 차례 표시
                if (this.currentPlayerIndex === i && this.currentRound !== 'waiting' && this.currentRound !== 'showdown') {
                    slot.classList.add('my-turn');
                } else {
                    slot.classList.remove('my-turn');
                }
            } else {
                slot.classList.add('empty');
                slot.classList.remove('my-turn', 'my-player');
                const nameEl = slot.querySelector('.player-name');
                const chipsEl = slot.querySelector('.player-chips');
                const betEl = slot.querySelector('.player-bet');
                const statusEl = slot.querySelector('.player-status');
                
                if (nameEl) nameEl.textContent = '-';
                if (chipsEl) chipsEl.textContent = '-';
                if (betEl) betEl.textContent = '베팅: 0P';
                if (statusEl) statusEl.textContent = '-';
            }
        }

        // 커뮤니티 카드 업데이트
        this.updateCommunityCards();

        // 팟 금액 업데이트
        document.getElementById('potAmount').textContent = `팟: ${this.pot}P`;

        // 내 플레이어 정보 업데이트
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        const myPlayerName = document.getElementById('myPlayerName');
        const myPlayerChips = document.getElementById('myPlayerChips');
        const myPlayerBet = document.getElementById('myPlayerBet');
        
        if (myPlayer) {
            if (myPlayerName) myPlayerName.textContent = myPlayer.nickname;
            if (myPlayerChips) myPlayerChips.textContent = `${myPlayer.chips}P`;
            if (myPlayerBet) myPlayerBet.textContent = `베팅: ${myPlayer.bet}P`;
            this.updateMyCards();
        } else {
            // 내 플레이어가 없으면 초기화
            if (myPlayerName) myPlayerName.textContent = '-';
            if (myPlayerChips) myPlayerChips.textContent = '-';
            if (myPlayerBet) myPlayerBet.textContent = '베팅: 0P';
            // 내 카드도 초기화
            const myCard1 = document.getElementById('myCard1');
            const myCard2 = document.getElementById('myCard2');
            if (myCard1) {
                myCard1.classList.add('empty');
                myCard1.innerHTML = '';
            }
            if (myCard2) {
                myCard2.classList.add('empty');
                myCard2.innerHTML = '';
            }
        }

        // 게임 정보 업데이트
        document.getElementById('currentRound').textContent = this.getRoundName(this.currentRound);
        document.getElementById('blindAmount').textContent = `${this.smallBlind}/${this.bigBlind}P`;
        document.getElementById('currentBet').textContent = `${this.currentBet}P`;
        document.getElementById('minRaise').textContent = `${this.currentBet + this.bigBlind}P`;

        // 액션 버튼 표시/숨김
        this.updateActionButtons();

        // 플레이어 목록 업데이트
        this.updatePlayersList();

        // 게임 시작 버튼은 사용하지 않음 (자동 시작)
        const startBtn = document.getElementById('startHoldemGameBtn');
        if (startBtn) startBtn.style.display = 'none';
    }

    handleCountdownAndAutostart() {
        const timerEl = document.getElementById('holdemGameTimer');
        const phaseEl = document.getElementById('holdemGamePhaseText');

        // 카운트다운이 필요한 상태인지 확인
        if (!this.countdownStart || (this.status !== 'waiting' && this.status !== 'starting')) {
            if (timerEl) timerEl.textContent = '-';
            if (phaseEl) {
                if (this.currentRound === 'waiting') {
                    phaseEl.textContent = '대기 중';
                } else {
                    phaseEl.textContent = this.getRoundName(this.currentRound || 'waiting');
                }
            }
            this.stopCountdownTicker();
            return;
        }

        // countdownStart를 밀리초로 변환
        let startMillis;
        if (this.countdownStart.toMillis) {
            startMillis = this.countdownStart.toMillis();
        } else if (this.countdownStart.seconds) {
            startMillis = this.countdownStart.seconds * 1000;
        } else if (typeof this.countdownStart === 'number') {
            startMillis = this.countdownStart;
        } else {
            // Timestamp 객체가 아닌 경우 현재 시간 사용
            startMillis = Date.now();
        }

        this.startCountdownTicker(startMillis);
    }

    startCountdownTicker(startMillis) {
        const timerEl = document.getElementById('holdemGameTimer');
        const phaseEl = document.getElementById('holdemGamePhaseText');

        // 초기 표시
        this.updateCountdownDisplay(startMillis, timerEl, phaseEl);

        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        this.countdownTimer = setInterval(() => {
            const keepRunning = this.updateCountdownDisplay(startMillis, timerEl, phaseEl);
            if (!keepRunning) {
                this.stopCountdownTicker();
            }
        }, 1000);
    }

    updateCountdownDisplay(startMillis, timerEl, phaseEl) {
        // startMillis는 이미 밀리초로 변환된 값
        const elapsed = (Date.now() - startMillis) / 1000;
        let remaining = Math.max(0, 30 - Math.floor(elapsed));

        if (timerEl) timerEl.textContent = `${remaining}s`;
        if (phaseEl) {
            if (remaining > 0) {
                phaseEl.textContent = `게임 시작까지 ${remaining}s`;
            } else {
                phaseEl.textContent = '게임 시작 중...';
            }
        }

        // 5초 이하에서는 참가/퇴장 불가
        if (remaining <= 5 && !this.locked && this.gameRef) {
            this.locked = true;
            this.gameRef.update({ locked: true }).catch(() => {});
        }

        // 카운트다운 종료 시 자동 시작
        if (remaining <= 0 && !this.isStarting) {
            this.startGame(true);
            return false;
        }
        return true;
    }

    stopCountdownTicker() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }
    
    async startGame(autoStart = false) {
        if (!this.gameRef) return;
        if (this.isStarting) return;
        
        try {
            this.isStarting = true;
            const gameData = await this.gameRef.get();
            if (!gameData.exists) return;
            
            const data = gameData.data();
            const players = data.players || [];
            const activePlayers = players.filter(p => p.status === 'active' || !p.status);
            
            if (activePlayers.length < 2) {
                if (!autoStart) {
                    alert('게임을 시작하려면 최소 2명의 플레이어가 필요합니다.');
                } else {
                    // 자동 시작인데 플레이어가 부족하면 카운트다운 재시작
                    await this.gameRef.update({
                        countdownStart: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'starting',
                        locked: false
                    });
                    const updatedData = await this.gameRef.get();
                    if (updatedData.exists) {
                        this.countdownStart = updatedData.data().countdownStart;
                    }
                }
                this.isStarting = false;
                return;
            }
            
            if (data.currentRound && data.currentRound !== 'waiting' && data.currentRound !== 'starting') {
                if (!autoStart) alert('이미 게임이 진행 중입니다.');
                this.isStarting = false;
                return;
            }
            
            // 딜러 위치 설정 (첫 번째 플레이어)
            const dealerPosition = 0;
            const smallBlindPosition = 1 % activePlayers.length;
            const bigBlindPosition = 2 % activePlayers.length;
            
            // 블라인드 설정
            activePlayers.forEach((player, index) => {
                player.isDealer = index === dealerPosition;
                player.isSmallBlind = index === smallBlindPosition;
                player.isBigBlind = index === bigBlindPosition;
                
                // 블라인드 베팅
                if (player.isSmallBlind) {
                    const blindAmount = Math.min(this.smallBlind, player.chips);
                    player.chips -= blindAmount;
                    player.bet = blindAmount;
                } else if (player.isBigBlind) {
                    const blindAmount = Math.min(this.bigBlind, player.chips);
                    player.chips -= blindAmount;
                    player.bet = blindAmount;
                } else {
                    player.bet = 0;
                }
                
                player.status = 'active';
                player.cards = [];
            });
            
            // 팟 계산
            const pot = activePlayers.reduce((sum, p) => sum + p.bet, 0);
            const currentBet = this.bigBlind;
            
            // 게임 상태 업데이트
            await this.gameRef.update({
                status: 'playing',
                locked: false,
                countdownStart: null,
                currentRound: 'preflop',
                players: activePlayers,
                pot: pot,
                currentBet: currentBet,
                dealerPosition: dealerPosition,
                currentPlayerIndex: (bigBlindPosition + 1) % activePlayers.length
            });
            
            // 카드 딜링
            await this.dealCards();
            
        } catch (error) {
            console.error('게임 시작 오류:', error);
            alert('게임 시작에 실패했습니다.');
        } finally {
            this.isStarting = false;
        }
    }

    updateCommunityCards() {
        const communityCardsContainer = document.getElementById('communityCards');
        communityCardsContainer.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const cardSlot = document.createElement('div');
            cardSlot.className = 'card-slot';
            
            if (i < this.communityCards.length) {
                const card = this.communityCards[i];
                cardSlot.innerHTML = `<img src="${this.getCardImage(card)}" alt="${card}">`;
            } else {
                cardSlot.classList.add('empty');
            }
            
            communityCardsContainer.appendChild(cardSlot);
        }
    }

    updateMyCards() {
        const card1 = document.getElementById('myCard1');
        const card2 = document.getElementById('myCard2');

        if (this.myCards.length >= 2) {
            card1.innerHTML = `<img src="${this.getCardImage(this.myCards[0])}" alt="${this.myCards[0]}">`;
            card2.innerHTML = `<img src="${this.getCardImage(this.myCards[1])}" alt="${this.myCards[1]}">`;
            card1.classList.remove('empty');
            card2.classList.remove('empty');
        } else {
            card1.classList.add('empty');
            card2.classList.add('empty');
            card1.innerHTML = '';
            card2.innerHTML = '';
        }
    }

    getCardImage(card) {
        // 카드 이미지 URL 생성 (실제 구현 시 카드 이미지 경로 사용)
        // 여기서는 텍스트로 표시
        return `https://deckofcardsapi.com/static/img/${card}.png`;
    }

    getRoundName(round) {
        const roundNames = {
            'waiting': '대기 중',
            'preflop': '프리플롭',
            'flop': '플롭',
            'turn': '턴',
            'river': '리버',
            'showdown': '쇼다운'
        };
        return roundNames[round] || round;
    }

    updateActionButtons() {
        const actionsDiv = document.getElementById('holdemActions');
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        
        if (!myPlayer || this.currentRound === 'waiting' || this.currentRound === 'showdown') {
            actionsDiv.style.display = 'none';
            return;
        }

        // 내 차례인지 확인
        const isMyTurn = this.players[this.currentPlayerIndex]?.uid === window.authManager?.currentUser?.uid;
        
        if (isMyTurn && myPlayer.status === 'active') {
            actionsDiv.style.display = 'flex';
            
            // 체크/콜 버튼
            if (this.currentBet === 0 || this.currentBet === myPlayer.bet) {
                document.getElementById('holdemCheckBtn').style.display = 'block';
                document.getElementById('holdemCallBtn').style.display = 'none';
            } else {
                document.getElementById('holdemCheckBtn').style.display = 'none';
                document.getElementById('holdemCallBtn').style.display = 'block';
            }
        } else {
            actionsDiv.style.display = 'none';
        }
    }

    updatePlayersList() {
        const listDiv = document.getElementById('holdemPlayersList');
        listDiv.innerHTML = '';

        this.players.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'player-list-item';
            item.textContent = `${player.nickname} - ${player.chips}P (시트 ${player.seat + 1})`;
            listDiv.appendChild(item);
        });
    }

    async fold() {
        await this.makeAction('fold', 0);
    }

    async call() {
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        if (!myPlayer) return;

        const callAmount = this.currentBet - myPlayer.bet;
        await this.makeAction('call', callAmount);
    }

    async check() {
        await this.makeAction('check', 0);
    }

    showRaiseInput() {
        document.getElementById('raiseInputGroup').style.display = 'flex';
    }

    async raise() {
        const raiseAmount = parseInt(document.getElementById('raiseAmount').value);
        if (isNaN(raiseAmount) || raiseAmount <= 0) {
            alert('올바른 금액을 입력하세요.');
            return;
        }

        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        if (!myPlayer) return;

        const totalBet = myPlayer.bet + raiseAmount;
        if (totalBet > myPlayer.chips) {
            alert('보유 칩이 부족합니다.');
            return;
        }

        await this.makeAction('raise', raiseAmount);
        document.getElementById('raiseInputGroup').style.display = 'none';
        document.getElementById('raiseAmount').value = 0;
    }

    async makeAction(action, amount) {
        if (!this.gameRef) return;

        try {
            const gameData = await this.gameRef.get();
            if (!gameData.exists) return;

            const players = gameData.data().players || [];
            const myPlayerIndex = players.findIndex(p => p.uid === window.authManager?.currentUser?.uid);
            
            if (myPlayerIndex === -1) return;

            const myPlayer = players[myPlayerIndex];
            
            if (action === 'fold') {
                myPlayer.status = 'folded';
            } else if (action === 'call') {
                const callAmount = Math.min(amount, myPlayer.chips);
                myPlayer.chips -= callAmount;
                myPlayer.bet += callAmount;
            } else if (action === 'check') {
                // 체크는 아무것도 하지 않음
            } else if (action === 'raise') {
                myPlayer.chips -= amount;
                myPlayer.bet += amount;
            }

            // 다음 플레이어로 이동
            let nextPlayerIndex = (this.currentPlayerIndex + 1) % players.length;
            while (players[nextPlayerIndex].status === 'folded' || players[nextPlayerIndex].status === 'allin') {
                nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
            }

            // 팟 업데이트
            let newPot = this.pot;
            players.forEach(p => {
                newPot += p.bet;
            });

            // 현재 베팅 업데이트
            const newCurrentBet = Math.max(...players.map(p => p.bet));

            await this.gameRef.update({
                players: players,
                pot: newPot,
                currentBet: newCurrentBet,
                currentPlayerIndex: nextPlayerIndex
            });

            // 베팅 라운드 완료 체크
            this.checkBettingRoundComplete(players);
        } catch (error) {
            console.error('액션 실행 오류:', error);
        }
    }

    async checkBettingRoundComplete(players) {
        // 모든 플레이어가 같은 금액을 베팅했는지 확인
        const activePlayers = players.filter(p => p.status === 'active');
        if (activePlayers.length <= 1) {
            // 승자 결정
            await this.determineWinner();
            return;
        }

        const allBetsEqual = activePlayers.every(p => p.bet === this.currentBet);
        const allActed = activePlayers.every(p => p.bet === this.currentBet || p.status === 'folded');

        if (allBetsEqual && allActed) {
            // 다음 라운드로 진행
            await this.nextRound();
        }
    }

    async nextRound() {
        if (!this.gameRef) return;

        const roundOrder = ['preflop', 'flop', 'turn', 'river', 'showdown'];
        const currentIndex = roundOrder.indexOf(this.currentRound);
        
        if (currentIndex === -1 || currentIndex >= roundOrder.length - 1) {
            await this.determineWinner();
            return;
        }

        const nextRound = roundOrder[currentIndex + 1];
        
        // 커뮤니티 카드 추가
        let newCommunityCards = [...this.communityCards];
        if (nextRound === 'flop') {
            // 플롭: 3장 추가
            newCommunityCards = await this.dealCommunityCards(3);
        } else if (nextRound === 'turn' || nextRound === 'river') {
            // 턴/리버: 1장씩 추가
            const newCard = await this.dealCommunityCards(1);
            newCommunityCards = [...newCommunityCards, ...newCard];
        }

        // 베팅 초기화
        const gameData = await this.gameRef.get();
        const players = gameData.data().players || [];
        players.forEach(p => {
            if (p.status === 'active') {
                p.bet = 0;
            }
        });

        await this.gameRef.update({
            currentRound: nextRound,
            communityCards: newCommunityCards,
            currentBet: 0,
            currentPlayerIndex: this.dealerPosition,
            players: players
        });
    }

    async dealCommunityCards(count) {
        // 실제로는 덱에서 카드를 뽑아야 함
        // 여기서는 임시로 랜덤 카드 생성
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const cards = [];
        
        for (let i = 0; i < count; i++) {
            const suit = suits[Math.floor(Math.random() * suits.length)];
            const rank = ranks[Math.floor(Math.random() * ranks.length)];
            cards.push(`${rank}${suit}`);
        }
        
        return cards;
    }

    async determineWinner() {
        // 승자 결정 로직 (패 평가)
        // 실제 구현 시 evaluateHand 함수 사용
        if (!this.gameRef) return;

        await this.gameRef.update({
            currentRound: 'showdown'
        });

        // 잠시 후 새 게임 시작
        setTimeout(() => {
            this.startNewHand();
        }, 5000);
    }

    async startNewHand() {
        // 새 핸드 시작
        if (!this.gameRef) return;

        const gameData = await this.gameRef.get();
        const players = gameData.data().players || [];
        
        // 플레이어 초기화
        players.forEach(p => {
            p.cards = [];
            p.bet = 0;
            p.status = 'active';
        });

        // 딜러 위치 이동
        const newDealerPosition = (this.dealerPosition + 1) % players.length;

        await this.gameRef.update({
            players: players,
            communityCards: [],
            pot: 0,
            currentBet: 0,
            currentRound: 'preflop',
            dealerPosition: newDealerPosition,
            currentPlayerIndex: (newDealerPosition + 1) % players.length
        });

        // 카드 딜링
        await this.dealCards();
    }

    async dealCards() {
        if (!this.gameRef) return;
        
        try {
            const gameData = await this.gameRef.get();
            if (!gameData.exists) return;
            
            const players = gameData.data().players || [];
            const activePlayers = players.filter(p => p.status === 'active');
            
            // 덱 생성 및 섞기
            const suits = ['S', 'H', 'D', 'C'];
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const deck = [];
            
            for (const suit of suits) {
                for (const rank of ranks) {
                    deck.push(`${rank}${suit}`);
                }
            }
            
            // 덱 섞기
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            
            // 각 플레이어에게 2장씩 카드 나누기
            let deckIndex = 0;
            activePlayers.forEach(player => {
                player.cards = [deck[deckIndex++], deck[deckIndex++]];
            });
            
            // Firestore에 업데이트
            await this.gameRef.update({
                players: players
            });
            
            console.log('카드 딜링 완료');
        } catch (error) {
            console.error('카드 딜링 오류:', error);
        }
    }

    selectChip(value) {
        document.querySelectorAll('.holdem-chip').forEach(chip => {
            chip.classList.toggle('selected', parseInt(chip.dataset.value) === value);
        });
    }

    showRules() {
        document.getElementById('holdemRulesModal').style.display = 'flex';
    }

    hideRules() {
        document.getElementById('holdemRulesModal').style.display = 'none';
    }

    backToMenu() {
        this.leaveTable();
        if (window.game) {
            window.game.backToMenu();
        }
    }

    resetGame() {
        this.gameId = null;
        this.players = [];
        this.communityCards = [];
        this.pot = 0;
        this.currentBet = 0;
        this.currentRound = 'waiting';
        this.mySeat = -1;
        this.myCards = [];
        this.gameRef = null;
        this.locked = false;
        this.countdownStart = null;
        this.status = 'waiting';
        this.stopCountdownTicker();
    }
}

// 전역 인스턴스
let holdemGame;
document.addEventListener('DOMContentLoaded', () => {
    holdemGame = new HoldemGame();
    window.holdemGame = holdemGame;
});



