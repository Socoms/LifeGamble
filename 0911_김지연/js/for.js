// id가 result인 영역을 가져와서 변수에 저장.
const result = document.querySelector("#result");

// 학생 명단 배열.
const students = ["Park", "Kim", "Lee", "Kang"];

// 1. 전통적인 for문
for(let i = 0; i < students.length; i++) {
    const li = document.createElement("li");
    li.textContent = students[i];
    result.appendChild(li);
}

// 2. for ... of 반복문
for(let student of students) {
    const li = document.createElement("li");
    li.textContent = student;
    result.appendChild(li);
}

// 3. forEach 반복문
students.forEach(function(student) {
    const li = document.createElement("li");
    li.textContent = student;
    result.appendChild(li);
});

/*
1. 전통적인 for 반복문
  장점
    최대 제어력 : i라는 인덱스를 직접 다루므로, 배열의 인덱스 값을 활용할 수 있음.
    break, continue 가능 : 중간에 멈추거나 건너뛰기 쉬움.
    범위를 유연하게 조절 가능 (예: i += 2로 짝수 인덱스만 순회).

  단점
    코드가 길고 반복적임(조건, 증감식 직접 써야 함).
    가독성이 떨어질 수 있음.


2. forEach
  장점
    문법이 간단하고 가독성 좋음.
    “모든 요소를 순회한다”는 의도가 바로 드러남.
    함수형 스타일 코드와 잘 어울림.

  단점
    break, continue 불가 → 조건부 제어는 불편.
    콜백 기반이라 async/await와 맞지 않음.

3. for...of
  장점
    forEach만큼 간결하지만, break, continue, await 모두 지원.
    배열뿐 아니라 문자열, Set, Map 등 이터러블도 순회 가능.

  단점
    인덱스가 필요하면 for...of만으로는 불편 → entries()를 써야 함.

정리하면,
  지금 예제처럼 학생 이름을 단순히 <li>로 출력하는 경우 → forEach나 for...of가 더 깔끔.
  중간에 조건부로 멈추거나, 인덱스를 직접 써야 한다면 → 전통적인 for 문이 여전히 유용함.
*/