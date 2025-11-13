const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 공 객체 생성.
let balls = [
    {x: 100, y: 100, radius: 15, xSpeed: 2, ySpeed: 3, color: "pink"},
    {x: 200, y: 150, radius: 20, xSpeed: -3, ySpeed: 2, color: "skyblue"}
];

// 공 업데이트 함수 생성.
function update() {
    ctx.fillStyle = "rgba(255,255,255,0.1)";   // 캔버스 배경 색
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // 배경새으로 캔버스 지우기.

    // 공 이동
    balls.forEach(ball => {
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

        // 공 그리기
        ctx.beginPath();   // 원 그리기 시작.
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);  // 원 그리기
        ctx.fillStyle = ball.color;   // 원 색상.
        ctx.fill();   // 원 채우기
        ctx.closePath();  // 원 그리기 종료.
    });
    requestAnimationFrame(update); 
}

// 공 속도 증가 함수 생성.
function increaseSpeed() {
    balls.forEach(ball => {
        ball.xSpeed *= 1.2;
        ball.ySpeed *= 1.2;
    });    
}

// 공 속도 감소 함수 생성.
function decreaseSpeed() {
    balls.forEach(ball => {
        ball.xSpeed *= 0.7;
        ball.ySpeed *= 0.7;
    });  
}

update();