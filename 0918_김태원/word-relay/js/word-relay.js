const number = Number(prompt("몇 명이 참가하나요?"));
const input = document.querySelector("input");
const submitBtn = document.querySelector("#submitBtn");
const orderEI = document.querySelector("#order");
const wordEI = document.querySelector("#word");
const wordListEI = document.querySelector("#wordList");
const giveUpBtn = document.querySelector("#giveUpBtn");

// DOM 요소들이 제대로 로드되었는지 확인
console.log('DOM 요소들:', {
    input: !!input,
    submitBtn: !!submitBtn,
    orderEI: !!orderEI,
    wordEI: !!wordEI,
    wordListEI: !!wordListEI,
    giveUpBtn: !!giveUpBtn
});

let newWord;
let word;
let usedWords = []; // 사용된 단어들을 저장하는 배열 (객체 형태로 저장)

// 게임 리셋 함수
const resetGame = () => {
    word = '';
    usedWords = [];
    newWord = '';
    orderEI.textContent = 1;
    wordEI.textContent = '';
    input.value = '';
    updateWordList();
    input.focus();
};

// 포기 기능
const giveUp = (event) => {
    event.preventDefault(); // 기본 동작 방지
    event.stopPropagation(); // 이벤트 전파 방지
    
    // newWord를 초기화하여 중복 체크를 방지
    newWord = '';
    
    const currentPlayer = Number(orderEI.textContent);
    if (confirm(`${currentPlayer}번째 참가자가 포기했습니다!\n게임을 다시 시작하시겠습니까?`)) {
        resetGame();
    }
};

// 단어 목록을 화면에 표시하는 함수
const updateWordList = () => {
    console.log('업데이트할 단어들:', usedWords); // 디버깅용
    if (wordListEI) {
        // 참가자별로 단어들을 그룹화
        const playerWords = {};
        usedWords.forEach(wordObj => {
            if (!playerWords[wordObj.player]) {
                playerWords[wordObj.player] = [];
            }
            playerWords[wordObj.player].push(wordObj.word);
        });
        
        // HTML 생성
        let html = '<div style="display: flex; gap: 20px;">';
        for (let player = 1; player <= number; player++) {
            html += `<div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">`;
            html += `<h4 style="margin: 0 0 10px 0; text-align: center; background-color: #f0f0f0; padding: 5px;">${player}번째 참가자</h4>`;
            
            if (playerWords[player]) {
                playerWords[player].forEach(word => {
                    html += `<div style="padding: 3px 0; border-bottom: 1px solid #eee;">${word}</div>`;
                });
            } else {
                html += `<div style="color: #999; font-style: italic;">아직 단어 없음</div>`;
            }
            
            html += `</div>`;
        }
        html += '</div>';
        
        wordListEI.innerHTML = html;
        console.log('단어 목록 업데이트 완료'); // 디버깅용
    } else {
        console.error('wordListEI를 찾을 수 없습니다!'); // 디버깅용
    }
};

const oninput = function(event) {
    newWord = event.target.value.trim();
}

const onclickButton = (event) => {
    // 포기 버튼이 클릭된 경우 함수 실행 중단
    if (event && event.target && event.target.id === 'giveUpBtn') {
        return;
    }
    
    // 빈 입력 체크
    if (!newWord || newWord === '') {
        alert("단어를 입력해주세요!");
        return;
    }
    
    // 이미 사용된 단어인지 확인 (단어만 비교)
    if (usedWords.some(wordObj => wordObj.word === newWord)) {
        alert(`[${newWord}]은/는 중복된 단어입니다`);
        input.value = "";
        input.focus();
        return;
    }
    
    // 끝말잇기 규칙 확인 (첫 번째 단어가 아니거나, 이전 단어의 마지막 글자와 일치하는 경우)
    if (!word || word.at(-1) === newWord[0]) {
        word = newWord;
        
        // 현재 참가자 번호 가져오기
        const currentPlayer = Number(orderEI.textContent);
        
        // 사용된 단어 배열에 참가자 번호와 함께 추가
        usedWords.push({
            word: newWord,
            player: currentPlayer
        });
        
        wordEI.textContent = word;
        
        // 단어 목록 업데이트
        updateWordList();
        
        // 다음 참가자로 변경
        if (currentPlayer + 1 > number) {
            orderEI.textContent = 1;
        } 
        else {
            orderEI.textContent = currentPlayer + 1;
        }
    } else {
        alert(`"${word}"의 마지막 글자 "${word.at(-1)}"로 시작하는 단어를 입력해주세요!`);
    }
    input.value = "";
    input.focus();
};

input.addEventListener('input', oninput);
submitBtn.addEventListener('click', onclickButton);
giveUpBtn.addEventListener('click', giveUp);

// 엔터키로도 입력 가능하도록 추가
input.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        onclickButton(event);
    }
});