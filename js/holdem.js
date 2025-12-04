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
        
        this.init();
    }

    init() {
        console.log('홀덤 게임 초기화');
        this.setupEventListeners();
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
            // 기존 게임 찾기 또는 새 게임 생성
            const gamesRef = db.collection('holdemGames');
            const activeGames = await gamesRef.where('status', '==', 'waiting').limit(1).get();
            
            if (!activeGames.empty) {
                // 기존 게임에 참가
                this.gameId = activeGames.docs[0].id;
                this.gameRef = gamesRef.doc(this.gameId);
            } else {
                // 새 게임 생성
                this.gameRef = gamesRef.doc();
                this.gameId = this.gameRef.id;
                await this.gameRef.set({
                    status: 'waiting',
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

            // 플레이어 추가
            const user = window.authManager.currentUser;
            const userData = window.authManager.userData;
            const player = {
                uid: user.uid,
                nickname: userData?.nickname || user.email.split('@')[0],
                seat: -1, // 자동 할당
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

            // 실시간 리스너 설정
            this.setupRealtimeListener();

            document.getElementById('joinHoldemTableBtn').style.display = 'none';
            document.getElementById('leaveHoldemTableBtn').style.display = 'block';
        } catch (error) {
            console.error('테이블 참가 오류:', error);
            alert('테이블 참가에 실패했습니다.');
        }
    }

    async leaveTable() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.gameRef && window.authManager?.currentUser) {
            try {
                const gameData = await this.gameRef.get();
                if (gameData.exists) {
                    const players = gameData.data().players || [];
                    const updatedPlayers = players.filter(p => p.uid !== window.authManager.currentUser.uid);
                    
                    if (updatedPlayers.length === 0) {
                        // 마지막 플레이어면 게임 삭제
                        await this.gameRef.delete();
                    } else {
                        await this.gameRef.update({ players: updatedPlayers });
                    }
                }
            } catch (error) {
                console.error('테이블 떠나기 오류:', error);
            }
        }

        this.resetGame();
        document.getElementById('joinHoldemTableBtn').style.display = 'block';
        document.getElementById('leaveHoldemTableBtn').style.display = 'none';
    }

    setupRealtimeListener() {
        if (!this.gameRef) return;

        this.unsubscribe = this.gameRef.onSnapshot((snapshot) => {
            if (!snapshot.exists) return;

            const gameData = snapshot.data();
            this.updateGameState(gameData);
        });
    }

    updateGameState(gameData) {
        this.players = gameData.players || [];
        this.communityCards = gameData.communityCards || [];
        this.pot = gameData.pot || 0;
        this.currentBet = gameData.currentBet || 0;
        this.currentRound = gameData.currentRound || 'waiting';
        this.dealerPosition = gameData.dealerPosition || 0;
        this.currentPlayerIndex = gameData.currentPlayerIndex || 0;

        // 내 플레이어 찾기
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        if (myPlayer) {
            this.mySeat = myPlayer.seat;
            this.myCards = myPlayer.cards || [];
        }

        this.updateDisplay();
    }

    updateDisplay() {
        // 플레이어 슬롯 업데이트
        for (let i = 0; i < 6; i++) {
            const slot = document.getElementById(`playerSlot${i}`);
            const player = this.players.find(p => p.seat === i);
            
            if (player) {
                slot.classList.remove('empty');
                slot.querySelector('.player-name').textContent = player.nickname;
                slot.querySelector('.player-chips').textContent = `${player.chips}P`;
                slot.querySelector('.player-bet').textContent = `베팅: ${player.bet}P`;
                slot.querySelector('.player-status').textContent = player.status === 'folded' ? '폴드' : 
                                                                   player.status === 'allin' ? '올인' : '';
                
                // 내 차례 표시
                if (this.currentPlayerIndex === i && this.currentRound !== 'waiting' && this.currentRound !== 'showdown') {
                    slot.classList.add('my-turn');
                } else {
                    slot.classList.remove('my-turn');
                }
            } else {
                slot.classList.add('empty');
                slot.querySelector('.player-name').textContent = '-';
                slot.querySelector('.player-chips').textContent = '-';
                slot.querySelector('.player-bet').textContent = '베팅: 0P';
                slot.querySelector('.player-status').textContent = '-';
            }
        }

        // 커뮤니티 카드 업데이트
        this.updateCommunityCards();

        // 팟 금액 업데이트
        document.getElementById('potAmount').textContent = `팟: ${this.pot}P`;

        // 내 플레이어 정보 업데이트
        const myPlayer = this.players.find(p => p.uid === window.authManager?.currentUser?.uid);
        if (myPlayer) {
            document.getElementById('myPlayerName').textContent = myPlayer.nickname;
            document.getElementById('myPlayerChips').textContent = `${myPlayer.chips}P`;
            document.getElementById('myPlayerBet').textContent = `베팅: ${myPlayer.bet}P`;
            this.updateMyCards();
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
        // 실제 카드 딜링 로직 구현 필요
        console.log('카드 딜링 시작');
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
    }
}

// 전역 인스턴스
let holdemGame;
document.addEventListener('DOMContentLoaded', () => {
    holdemGame = new HoldemGame();
    window.holdemGame = holdemGame;
});


