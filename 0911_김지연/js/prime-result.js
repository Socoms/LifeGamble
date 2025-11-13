/*
    정수를 입력받아 입력받은 수까지의 모든 소수를 출력하시오.
*/
const result = document.querySelector("#result");   // 결과 표시할 요소
const number = Number(prompt("자연수를 입력하세요"));       // 사용자 입력
              // 숫자로 변환

if (!Number.isInteger(number) || number < 2) {
  // 2 미만은 소수가 없음
  result.textContent = "2 이상의 자연수를 입력하세요.";
} 
else {
  // 2부터 입력한 수까지 반복
  for (let n = 2; n <= number; n++) {
    let isPrime = true; // 기본값: 소수라고 가정

    // 2부터 n-1까지 전부 검사
    for (let i = 2; i < n; i++) {
      if (n % i === 0) {
        isPrime = false; // 나누어 떨어지면 소수가 아님
        break;           // 더 검사할 필요 없으므로 반복 중단
      }
    }

    // 소수라면 화면에 출력
    if (isPrime) {
      const li = document.createElement("li");
      li.textContent = n;
      result.appendChild(li);
    }
  }
}