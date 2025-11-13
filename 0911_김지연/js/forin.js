// id가 result1, result2인 영역을 가져와서 변수에 저장.
const result1 = document.querySelector("#result1");
const result2 = document.querySelector("#result2");

// 객체 생성.
const student = {
    major : "컴퓨터공학과",
    idNum : 202595000,
    name : '김지연'
}

for(let key in student) {
    const li = document.createElement("li");
    li.textContent = `${key} : ${student[key]}`;
    result1.appendChild(li);
}

for(let key in student) {
    result2.innerHTML += `${key} : ${student[key]}<br>`;
}

/*
  for...in : 객체의 “열거 가능한 속성 이름(키)”을 반복할 때 사용.
  주의 : 배열에는 비권장 : 인덱스 순서 보장 X
  Map/Set에는 부적합: for...of를 사용하세요.
*/