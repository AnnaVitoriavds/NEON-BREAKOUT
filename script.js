const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const levelClearedScreen = document.getElementById('level-cleared-screen');
const lifeLostScreen = document.getElementById('life-lost-screen');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');
const finalScoreDisplay = document.getElementById('final-score');
const milestonePopup = document.getElementById('milestone-popup');
const difficultyScreen = document.getElementById('difficulty-screen');

const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const nextLevelButton = document.getElementById('next-level-button');
const continueButton = document.getElementById('continue-button');
const restartFromZeroButton = document.getElementById('restart-from-zero-button');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let lives = 3;
let level = 0;
let bricksBrokenCount = 1;
let gameRunning = false;
let ballIsMoving = false;
let rightPressed = false;
let leftPressed = false;
let difficultySettings = {};

const ballColors = ['#ff00ff', '#00ffff', '#39ff14', '#ffff00'];
let colorIndex = 0;

const paddle = {
    height: 15, width: 150, x: canvas.width / 2 - 75,
    y: canvas.height - 30, speed: 10, dx: 0, color: '#ffffff'
};

const ball = {
    x: canvas.width / 2, y: canvas.height - 50, radius: 10,
    speed: 6, dx: 0, dy: 0, color: ballColors[colorIndex]
};

const brickInfo = {
    rowCount: 5, columnCount: 9, width: 75, height: 20,
    padding: 10, offsetTop: 50, offsetLeft: 30
};

let bricks = [];

const levelDesigns = [
    [[1,1,1,1,1,1,1,1,1],[0,2,2,2,2,2,2,2,0],[0,0,3,3,3,3,3,0,0],[0,0,0,4,4,4,0,0,0],[0,0,0,0,1,0,0,0,0]],
    [[4,0,4,0,4,0,4,0,4],[0,3,0,3,0,3,0,3,0],[2,0,2,0,2,0,2,0,2],[0,1,0,1,0,1,0,1,0],[4,3,2,1,1,2,3,4,4]],
    [[1,2,3,4,1,2,3,4,1],[2,3,4,1,2,3,4,1,2],[3,4,1,2,3,4,1,2,3],[4,1,2,3,4,1,2,3,4],[1,2,3,4,1,2,3,4,1]]
];

function createBricks() {
    bricks = [];
    const currentLevel = levelDesigns[level % levelDesigns.length];
    for (let r = 0; r < brickInfo.rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickInfo.columnCount; c++) {
            const brickType = currentLevel[r][c];
            if (brickType > 0) {
                const brickX = c * (brickInfo.width + brickInfo.padding) + brickInfo.offsetLeft;
                const brickY = r * (brickInfo.height + brickInfo.padding) + brickInfo.offsetTop;
                bricks[r][c] = { x: brickX, y: brickY, status: 1, color: ballColors[brickType - 1] };
            } else {
                 bricks[r][c] = { x: 0, y: 0, status: 0 };
            }
        }
    }
}

function startCountdown(callback) {
    countdownOverlay.classList.remove('hidden');
    let count = 3;
    countdownText.textContent = count;
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else if (count === 0) {
            countdownText.textContent = "VAI!";
        } else {
            clearInterval(interval);
            countdownOverlay.classList.add('hidden');
            callback();
        }
    }, 1000);
}

function launchBall() {
    const launchAngle = (Math.PI / 4) * (Math.random() * 0.5 + 0.75);
    const direction = (Math.random() > 0.5 ? 1 : -1);
    ball.dx = ball.speed * Math.cos(launchAngle) * direction;
    ball.dy = -ball.speed * Math.sin(launchAngle);
    ballIsMoving = true;
}

function showMilestoneMessage(message) {
    milestonePopup.textContent = message;
    milestonePopup.classList.add('show');
    setTimeout(() => {
        milestonePopup.classList.remove('show');
    }, 2500);
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = paddle.color;
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let r = 0; r < brickInfo.rowCount; r++) {
        for (let c = 0; c < brickInfo.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                ctx.beginPath();
                ctx.rect(b.x, b.y, brickInfo.width, brickInfo.height);
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    ctx.shadowBlur = 0;
}

function movePaddle() {
    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function moveBall() {
    if (!ballIsMoving) return;
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
    if (ball.y - ball.radius < 0) ball.dy *= -1;
    if (ball.y + ball.radius > canvas.height) {
        ballIsMoving = false;
        gameRunning = false;
        lives--;
        livesDisplay.textContent = `LIVES: ${lives}`;
        if (lives <= 0) {
            gameOver();
        } else {
            lifeLostScreen.classList.remove('hidden');
        }
    }
    if (ball.y + ball.radius > paddle.y && 
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x + ball.radius > paddle.x && 
        ball.x - ball.radius < paddle.x + paddle.width) {
        if(ball.dy > 0) {
            ball.y = paddle.y - ball.radius;
            let collidePoint = ball.x - (paddle.x + paddle.width / 2);
            collidePoint = collidePoint / (paddle.width / 2);
            let angle = collidePoint * (Math.PI / 3);
            ball.dx = ball.speed * Math.sin(angle);
            ball.dy = -ball.speed * Math.cos(angle);
            colorIndex = (colorIndex + 1) % ballColors.length;
            ball.color = ballColors[colorIndex];
        }
    }
}

function collisionDetection() {
    for (let r = 0; r < brickInfo.rowCount; r++) {
        for (let c = 0; c < brickInfo.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status !== 1) continue;
            const ballHalf = ball.radius;
            const brickHalfW = brickInfo.width / 2;
            const brickHalfH = brickInfo.height / 2;
            const ballCenterX = ball.x;
            const ballCenterY = ball.y;
            const brickCenterX = b.x + brickHalfW;
            const brickCenterY = b.y + brickHalfH;
            const diffX = ballCenterX - brickCenterX;
            const diffY = ballCenterY - brickCenterY;
            const penetrationX = (ballHalf + brickHalfW) - Math.abs(diffX);
            const penetrationY = (ballHalf + brickHalfH) - Math.abs(diffY);
            if (penetrationX > 0 && penetrationY > 0) {
                if (penetrationX < penetrationY) {
                    ball.dx *= -1;
                    ball.x += (diffX > 0 ? penetrationX : -penetrationX);
                } else {
                    ball.dy *= -1;
                    ball.y += (diffY > 0 ? penetrationY : -penetrationY);
                }
                if (ball.color === b.color) {
                    b.status = 0;
                    score += 10;
                    scoreDisplay.textContent = `SCORE: ${score}`;
                    if ((score / 10) >= bricksBrokenCount) {
                        showMilestoneMessage(`PARABÉNS! ${score} PONTOS!`);
                        bricksBrokenCount++;
                    }
                    if (checkWin()) {
                        levelCleared();
                    }
                }
                return;
            }
        }
    }
}

function checkWin() {
    return bricks.every(row => row.every(brick => brick.status === 0));
}

function levelCleared() {
    gameRunning = false;
    ballIsMoving = false;
    bricksBrokenCount = (score / 10) + 1;
    levelClearedScreen.classList.remove('hidden');
}

function startNextLevel() {
    level++;
    levelClearedScreen.classList.add('hidden');
    resetBallAndPaddle();
    createBricks();
    gameRunning = true;
    startCountdown(launchBall);
}

function gameOver() {
    gameRunning = false;
    finalScoreDisplay.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function resetBallAndPaddle() {
    paddle.x = canvas.width / 2 - paddle.width / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 0;
    ball.dy = 0;
    ballIsMoving = false;
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 0;
    bricksBrokenCount = 1;
    scoreDisplay.textContent = `SCORE: ${score}`;
    livesDisplay.textContent = `LIVES: ${lives}`;
    ball.speed = difficultySettings.ballSpeed;
    paddle.width = difficultySettings.paddleWidth;
    resetBallAndPaddle();
    createBricks();
}

function update() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawPaddle();
    drawBall();
    movePaddle();
    moveBall();
    collisionDetection();
    requestAnimationFrame(update);
}

function keyDown(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
    updatePaddleDirection();
}

function keyUp(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
    updatePaddleDirection();
}

function updatePaddleDirection() {
    if (rightPressed && !leftPressed) paddle.dx = paddle.speed;
    else if (leftPressed && !rightPressed) paddle.dx = -paddle.speed;
    else paddle.dx = 0;
}

function handleInteractionMove(clientX) {
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    let newX = (clientX - canvasRect.left) * scaleX;
    if (newX > paddle.width / 2 && newX < canvas.width - paddle.width / 2) {
        paddle.x = newX - paddle.width / 2;
    }
}

function mouseMoveHandler(e) {
    handleInteractionMove(e.clientX);
}

function touchHandler(e) {
    e.preventDefault();
    handleInteractionMove(e.touches[0].clientX);
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
document.addEventListener('mousemove', mouseMoveHandler);
canvas.addEventListener('touchstart', touchHandler, { passive: false });
canvas.addEventListener('touchmove', touchHandler, { passive: false });

function startGameFromZero() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lifeLostScreen.classList.add('hidden');
    resetGame();
    gameRunning = true;
    update();
    startCountdown(launchBall);
}

difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const difficulty = button.dataset.difficulty;
        if (difficulty === 'easy') {
            difficultySettings = { ballSpeed: 4, paddleWidth: 180 };
        } else if (difficulty === 'medium') {
            difficultySettings = { ballSpeed: 6, paddleWidth: 140 };
        } else if (difficulty === 'hard') {
            difficultySettings = { ballSpeed: 8, paddleWidth: 100 };
        }
        difficultyScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
});

startButton.addEventListener('click', startGameFromZero);
restartButton.addEventListener('click', startGameFromZero);
restartFromZeroButton.addEventListener('click', startGameFromZero);

continueButton.addEventListener('click', () => {
    lifeLostScreen.classList.add('hidden');
    resetBallAndPaddle();
    gameRunning = true;
    requestAnimationFrame(update);
    startCountdown(launchBall);
});

nextLevelButton.addEventListener('click', startNextLevel);

function drawInitialState() {
    createBricks();
    drawBricks();
    drawPaddle();
    drawBall();
}

drawInitialState();