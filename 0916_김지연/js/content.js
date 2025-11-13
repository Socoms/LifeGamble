// 제목 영역을 가져온다.
const title = document.querySelector("#title");
// 이름 영역을 가져온다.
const userName = document.querySelector("#desc p");
// 이미지 영역 가져오기
const pfImage = document.querySelector("#profile img");

// 한글 '프로필'로 바꾸는 함수.
// 1) 선언식 함수.
// function changeTitle() {
//     title.innerText = "프로필";
// }

// 2) 함수 표현식(기명)
// const changeTitle = function changeTitle() {
//     title.innerText = "프로필";
// }

// 3) 함수 표현식(익명)
// const changeTitle = function() {
//     title.innerText = "프로필";
// }

// 4) 화살표 함수
title.onclick = () => title.innerText = "프로필";

// title영역을 클릭하면 함수 호출.
// title.onclick = changeTitle;

// --------------------------------

// 한글 이름을 클릭하면 영어 이름으로 바뀐다.
// userName.onclick = () => userName.innerHTML = `이름 : <b>KIMJY</b>`;

// 이름 영역을 클릭하면 김지연 <-> KIMJY 로 토글.
// userName.onclick = function() {
//     // contains는 특정 클래스(토큰)가 요소의 classList에 포함되어 있는지 확인해서 true/false를 반환합니다.
//     if(userName.classList.contains("alt-name")) {
//         userName.classList.remove("alt-name");
//         userName.innerHTML = "이름 : 김지연";
//     } else {
//         userName.classList.add("alt-name");
//         userName.innerHTML = `이름 : <b>KIMJY</b>`;
//     }
// };

userName.onclick = function() {
    const isAlt = userName.classList.toggle("alt-name");
    userName.innerHTML = isAlt ? `이름 : <b>KIMJY</b>` : "이름 : 김지연";
}

//------------------------------
// 이미지를 클릭하면 이미지의 경로(이미지)를 바꾼다.
// pfImage.onclick = () => pfImage.src = "images/pf2.png";


// 이미지 영역을 클릭하면 pf <-> pf2 로 토글.
pfImage.onclick = function() {
    const isAlt = pfImage.classList.toggle("alt-img");  
    pfImage.src = isAlt ? "images/pf2.png" : "images/pf.png";    
};