// 함수가 할 일 : 두 정수를 전달받아 곱한 결과를 돌려준다.
// 1. 선언식 함수
// function multiple(a, b) {
//     return a * b;
// }

// 2. 표현식 함수(함수 표현식) - 함수를 변수에 담는 방식.
// const multiple = function multiple(a, b) {
//     return a * b;
// }

// 3. 익명 함수 - 이름이 없는 함수를 변수에 대입하는 방식.(함수를 값으로 저장)
// const multiple = function(a, b) {
//     return a * b;
// }

// 4. 화살표 함수 표현식
// const multiple = (a, b) => {
//     return a * b;
// }

// 5. 화살표 함수 - 간결한 문법. 표현식이 한 줄이면 return 생략 가능.
const multiple = (a, b) => a * b;


const result = document.querySelector("#result");

let num1 = parseInt(prompt("첫 번째 정수 입력"));
let num2 = parseInt(prompt("두 번째 정수 입력"));

result.innerText = (`${num1} * ${num2} = ${multiple(num1, num2)}`);