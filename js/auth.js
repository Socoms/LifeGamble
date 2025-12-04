// Firebase Authentication 및 Firestore 관리

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    init() {
        // 인증 상태 변화 감지
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(); // 데이터 로드 완료 대기
                this.showUserInfo();
                this.hideAuthModal();
            } else {
                this.currentUser = null;
                this.userData = null;
                this.hideUserInfo();
                this.showAuthModal();
            }
        });

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 탭 전환
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 로그인
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.login();
        });

        // 회원가입
        document.getElementById('signupBtn')?.addEventListener('click', () => {
            this.signup();
        });

        // 로그아웃
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Enter 키로 로그인/회원가입
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        document.getElementById('signupPasswordConfirm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signup();
        });
    }

    switchTab(tabName) {
        // 탭 버튼 활성화
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 폼 표시/숨김
        document.getElementById('loginForm').classList.toggle('active', tabName === 'login');
        document.getElementById('signupForm').classList.toggle('active', tabName === 'signup');

        // 에러 메시지 초기화
        document.getElementById('loginError').textContent = '';
        document.getElementById('signupError').textContent = '';
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!email || !password) {
            errorDiv.textContent = '이메일과 비밀번호를 입력하세요.';
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            errorDiv.textContent = '';
            // 성공 시 onAuthStateChanged에서 처리
        } catch (error) {
            let errorMessage = '로그인에 실패했습니다.';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = '등록되지 않은 이메일입니다.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = '비밀번호가 올바르지 않습니다.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '올바른 이메일 형식이 아닙니다.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = '비활성화된 계정입니다.';
                    break;
            }
            errorDiv.textContent = errorMessage;
        }
    }

    async signup() {
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const nickname = document.getElementById('signupNickname').value;
        const errorDiv = document.getElementById('signupError');

        // 유효성 검사
        if (!email || !password || !passwordConfirm || !nickname) {
            errorDiv.textContent = '모든 항목을 입력하세요.';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
            return;
        }

        if (password !== passwordConfirm) {
            errorDiv.textContent = '비밀번호가 일치하지 않습니다.';
            return;
        }

        try {
            // 회원가입
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Firestore에 유저 데이터 저장
            await db.collection('users').doc(user.uid).set({
                email: email,
                nickname: nickname,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                gameStats: {
                    baccarat: {
                        totalGames: 0,
                        wins: 0,
                        losses: 0,
                        ties: 0,
                        totalPoints: 1000
                    },
                    blackjack: {
                        totalGames: 0,
                        wins: 0,
                        losses: 0,
                        pushes: 0,
                        blackjacks: 0,
                        totalPoints: 1000
                    }
                },
                currentPoints: 1000
            });

            errorDiv.textContent = '';
            // 성공 시 onAuthStateChanged에서 처리
        } catch (error) {
            let errorMessage = '회원가입에 실패했습니다.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = '이미 사용 중인 이메일입니다.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '올바른 이메일 형식이 아닙니다.';
                    break;
                case 'auth/weak-password':
                    errorMessage = '비밀번호가 너무 약합니다.';
                    break;
            }
            errorDiv.textContent = errorMessage;
        }
    }

    async logout() {
        try {
            await auth.signOut();
            // 로그아웃 시 onAuthStateChanged에서 처리
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                this.userData = userDoc.data();
                // 게임에 유저 데이터 전달
                if (window.game) {
                    window.game.loadUserGameData(this.userData);
                }
            } else {
                console.log('유저 데이터가 없습니다.');
            }
        } catch (error) {
            console.error('유저 데이터 로드 오류:', error);
        }
    }

    async saveUserData(gameData) {
        if (!this.currentUser) return;

        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                gameStats: gameData.gameStats,
                currentPoints: gameData.currentPoints,
                lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
            });
            // 로컬 데이터도 업데이트
            this.userData = { ...this.userData, ...gameData };
        } catch (error) {
            console.error('유저 데이터 저장 오류:', error);
        }
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
    }

    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    showUserInfo() {
        const userInfoDiv = document.getElementById('userInfo');
        const nicknameSpan = document.getElementById('userNickname');
        
        // 닉네임을 "닉네임님 환영합니다." 형식으로 표시
        if (this.userData && this.userData.nickname) {
            nicknameSpan.textContent = `${this.userData.nickname}님 환영합니다.`;
        } else {
            // 닉네임이 없으면 기본값 표시
            nicknameSpan.textContent = '닉네임 없음';
        }
        
        userInfoDiv.style.display = 'block';
        
        // 게임 데이터가 있으면 통계 정보도 업데이트
        if (window.game) {
            window.game.updateDisplay();
        }
    }

    hideUserInfo() {
        document.getElementById('userInfo').style.display = 'none';
    }

    // 게임 데이터 저장 (게임에서 호출)
    async saveGameData(gameMode, stats, points) {
        if (!this.currentUser || !this.userData) return;

        // gameStats 초기화 (기존 데이터가 있으면 사용, 없으면 새로 생성)
        let gameStats = this.userData.gameStats || {};
        
        // 각 게임 모드가 없으면 초기화
        if (!gameStats.baccarat) {
            gameStats.baccarat = { totalGames: 0, wins: 0, losses: 0, ties: 0, totalPoints: 1000 };
        }
        if (!gameStats.blackjack) {
            gameStats.blackjack = { totalGames: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, totalPoints: 1000 };
        }
        if (!gameStats.dice) {
            gameStats.dice = { totalGames: 0, wins: 0, losses: 0, totalPoints: 1000 };
        }
        if (!gameStats.hilo) {
            gameStats.hilo = { totalGames: 0, wins: 0, losses: 0, ties: 0, totalPoints: 1000 };
        }

        // 게임 모드별 통계 업데이트
        if (gameMode === 'baccarat') {
            gameStats.baccarat.totalGames += 1;
            if (stats.win) gameStats.baccarat.wins += 1;
            else if (stats.loss) gameStats.baccarat.losses += 1;
            else if (stats.tie) gameStats.baccarat.ties += 1;
            gameStats.baccarat.totalPoints = points;
        } else if (gameMode === 'blackjack') {
            gameStats.blackjack.totalGames += 1;
            if (stats.win) gameStats.blackjack.wins += 1;
            else if (stats.loss) gameStats.blackjack.losses += 1;
            else if (stats.push) gameStats.blackjack.pushes += 1;
            if (stats.blackjack) gameStats.blackjack.blackjacks += 1;
            gameStats.blackjack.totalPoints = points;
        } else if (gameMode === 'dice') {
            gameStats.dice.totalGames += 1;
            if (stats.win) gameStats.dice.wins += 1;
            else if (stats.loss) gameStats.dice.losses += 1;
            gameStats.dice.totalPoints = points;
        } else if (gameMode === 'hilo') {
            gameStats.hilo.totalGames += 1;
            if (stats.win) gameStats.hilo.wins += 1;
            else if (stats.loss) gameStats.hilo.losses += 1;
            else if (stats.tie) gameStats.hilo.ties += 1;
            gameStats.hilo.totalPoints = points;
        }

        // currentPoints는 모든 게임에서 공통으로 사용
        await this.saveUserData({
            gameStats: gameStats,
            currentPoints: points
        });
    }
}

// 전역 인스턴스 생성
let authManager;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager; // 게임에서 접근 가능하도록
});


