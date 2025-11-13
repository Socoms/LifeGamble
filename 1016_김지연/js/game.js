const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 공 객체 생성.
let ball = {
    x: 250,  // 공 x축 위치
    y: 200,  // 공 y축 위치
    radius: 15,  // 공 반지름
    xSpeed: 2,  // 공 x축 속도
    ySpeed: 3,  // 공 y축 속도
    color: "orange"  // 공 색상
};

// 공 그리기 함수 생성.
function drawBall() {
    ctx.beginPath();   // 원 그리기 시작.
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);  // 원 그리기
    ctx.fillStyle = ball.color;   // 원 색상.
    ctx.fill();   // 원 채우기
    ctx.closePath();  // 원 그리기 종료.
}

// 공 업데이트 함수 생성.
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // 캔버스 지우기

    drawBall();   // 공 그리기

    // 공 이동
    ball.x += ball.xSpeed;
    ball.y += ball.ySpeed;

    // 벽 충돌 처리
    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.xSpeed *= -1;  // 공 반사 x 축
    }
    if(ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.ySpeed *= -1;  // 공 반사 y 축축
    }

    requestAnimationFrame(update);   // 공 업데이트
}

update();