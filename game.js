const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 30;
const boardWidth = 10;
const boardHeight = 20;

const TETRIMINOS = [
    { rotations: [[[-1,0], [0,0], [1,0], [2,0]], [[0,-1], [0,0], [0,1], [0,2]]], color: '#00FFFF' }, // I
    { rotations: [[[0,0], [1,0], [0,1], [1,1]]], color: '#FFFF00' }, // O
    { rotations: [[[-1,0], [0,0], [1,0], [0,-1]], [[0,-1], [0,0], [0,1], [1,0]], [[-1,0], [0,0], [1,0], [0,1]], [[0,-1], [0,0], [0,1], [-1,0]]], color: '#800080' }, // T
    { rotations: [[[0,0], [1,0], [-1,-1], [0,-1]], [[0,0], [0,1], [1,-1], [1,0]]], color: '#008000' }, // S
    { rotations: [[[-1,0], [0,0], [0,-1], [1,-1]], [[0,-1], [0,0], [1,0], [1,1]]], color: '#FF0000' }, // Z
    // J piece
    {
        rotations: [
            [[-1,0], [0,0], [1,0], [-1,1]],  // J1
            [[0,-1], [0,0], [0,1], [-1,-1]], // J2
            [[-1,0], [0,0], [1,0], [1,-1]],  // J3
            [[0,-1], [0,0], [0,1], [1,1]]    // J4
        ],
        color: '#0000FF'
    },
    // L piece
    {
        rotations: [
            [[-1,0], [0,0], [1,0], [1,1]],   // L1
            [[0,-1], [0,0], [0,1], [1,-1]],  // L2
            [[-1,0], [0,0], [1,0], [-1,-1]], // L3
            [[0,-1], [0,0], [0,1], [-1,1]]   // L4
        ],
        color: '#FFA500'
    },
];

let board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null));
let currentPiece = null;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let isPaused = false;
let gameOver = false;
let lastFallTime = 0;
const fallInterval = 1000;

function spawnPiece() {
    const type = Math.floor(Math.random() * TETRIMINOS.length);
    currentPiece = { type, rotation: 0, x: Math.floor(boardWidth / 2) - 1, y: 0 };
    if (!isValidPosition(currentPiece)) {
        gameOver = true;
    }
}

function isValidPosition(piece) {
    const { type, rotation, x, y } = piece;
    const blocks = TETRIMINOS[type].rotations[rotation];
    for (const [dx, dy] of blocks) {
        const boardX = x + dx;
        const boardY = y + dy;
        if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight) return false;
        if (boardY >= 0 && board[boardY][boardX] !== null) return false;
    }
    return true;
}

function movePiece(dx, dy) {
    const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };
    if (isValidPosition(newPiece)) {
        currentPiece = newPiece;
        return true;
    }
    return false;
}

function rotatePiece() {
    const newRotation = (currentPiece.rotation + 1) % TETRIMINOS[currentPiece.type].rotations.length;
    const newPiece = { ...currentPiece, rotation: newRotation };
    if (isValidPosition(newPiece)) {
        currentPiece = newPiece;
    }
}

function landPiece() {
    const { type, rotation, x, y } = currentPiece;
    const blocks = TETRIMINOS[type].rotations[rotation];
    for (const [dx, dy] of blocks) {
        const boardX = x + dx;
        const boardY = y + dy;
        if (boardY >= 0) board[boardY][boardX] = TETRIMINOS[type].color;
    }
    clearRows();
    spawnPiece();
}

function clearRows() {
    let rowsCleared = 0;
    for (let row = boardHeight - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== null)) {
            board.splice(row, 1);
            board.unshift(Array(boardWidth).fill(null));
            rowsCleared++;
            row++;
        }
    }
    if (rowsCleared > 0) {
        score += [0, 100, 300, 500, 800][rowsCleared];
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    ctx.strokeStyle = '#ccc';
    for (let x = 0; x <= boardWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gridSize, 0);
        ctx.lineTo(x * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= boardHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gridSize);
        ctx.lineTo(canvas.width, y * gridSize);
        ctx.stroke();
    }
    // Draw landed blocks
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
            }
        }
    }
    // Draw current piece
    if (currentPiece) {
        const { type, rotation, x, y } = currentPiece;
        const blocks = TETRIMINOS[type].rotations[rotation];
        ctx.fillStyle = TETRIMINOS[type].color;
        for (const [dx, dy] of blocks) {
            const boardX = x + dx;
            const boardY = y + dy;
            if (boardY >= 0) ctx.fillRect(boardX * gridSize, boardY * gridSize, gridSize - 1, gridSize - 1);
        }
    }
    // Overlay messages
    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else if (isPaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
    }
    // Update score display
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
}

function update(time = 0) {
    if (!isPaused && !gameOver) {
        if (time - lastFallTime >= fallInterval) {
            if (!movePiece(0, 1)) landPiece();
            lastFallTime = time;
        }
    }
    render();
    requestAnimationFrame(update);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (!isPaused && !gameOver) {
        switch (e.key) {
            case 'ArrowLeft': movePiece(-1, 0); break;
            case 'ArrowRight': movePiece(1, 0); break;
            case 'ArrowDown': movePiece(0, 1); break;
            case 'ArrowUp': rotatePiece(); break;
            case ' ': while (movePiece(0, 1)) {}; landPiece(); break;
        }
    }
});

document.getElementById('newGame').addEventListener('click', () => {
    board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null));
    score = 0;
    gameOver = false;
    isPaused = false;
    spawnPiece();
});

document.getElementById('pause').addEventListener('click', () => {
    if (!gameOver) isPaused = !isPaused;
});

document.getElementById('auto').addEventListener('click', () => {
    console.log('Auto mode not implemented');
});

// Attach a generic event listener to all buttons so that they lose focus after being clicked.
// This fixes an issue where the button remains focused, causing subsequent spacebar keyup events
// to trigger the button's click event (e.g., inadvertently starting a new game).
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.blur();
    });
});

// Start the game
spawnPiece();
requestAnimationFrame(update);