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
    {
        rotations: [
            [[-1,0], [0,0], [1,0], [-1,1]],  // J1
            [[0,-1], [0,0], [0,1], [-1,-1]], // J2
            [[-1,0], [0,0], [1,0], [1,-1]],  // J3
            [[0,-1], [0,0], [0,1], [1,1]]    // J4
        ],
        color: '#0000FF'
    },
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

// Variables for auto mode
let isAuto = false;
let usedAutoMode = false;  // tracks if autopilot has been used during this game
let autoMoveTarget = null;
let autoRestartScheduled = false;  // ensures only one auto restart is scheduled

// Check URL parameter for autopilot mode.
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('autopilot') === 'true') {
    isAuto = true;
    usedAutoMode = true;
    console.log('Autopilot triggered by URL parameter');
}

function spawnPiece() {
    const type = Math.floor(Math.random() * TETRIMINOS.length);
    currentPiece = { type, rotation: 0, x: Math.floor(boardWidth / 2) - 1, y: 0 };
    if (!isValidPosition(currentPiece)) {
        gameOver = true;
        // Schedule auto restart if game is over in auto mode
        if (isAuto && !autoRestartScheduled) {
            autoRestartScheduled = true;
            setTimeout(() => {
                startNewGame(true);
            }, 1500);
        }
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
        if (!usedAutoMode && score > highScore) {
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

// ----- Auto mode helper functions -----

function isValidPositionSimulated(piece, boardState) {
    const { type, rotation, x, y } = piece;
    const blocks = TETRIMINOS[type].rotations[rotation];
    for (const [dx, dy] of blocks) {
        const boardX = x + dx;
        const boardY = y + dy;
        if (boardX < 0 || boardX >= boardWidth || boardY >= boardHeight) return false;
        if (boardY >= 0 && boardState[boardY][boardX] !== null) return false;
    }
    return true;
}

function getValidPositionsForPiece(type, rotation) {
    const offsets = TETRIMINOS[type].rotations[rotation];
    let minX = Infinity, maxX = -Infinity;
    for (const [dx] of offsets) {
        if (dx < minX) minX = dx;
        if (dx > maxX) maxX = dx;
    }
    let positions = [];
    for (let x = -minX; x < boardWidth - maxX; x++) {
        positions.push(x);
    }
    return positions;
}

function simulateClearRows(boardState) {
    let newBoard = boardState.map(row => row.slice());
    let linesCleared = 0;
    for (let row = boardHeight - 1; row >= 0; row--) {
        if (newBoard[row].every(cell => cell !== null)) {
            newBoard.splice(row, 1);
            newBoard.unshift(Array(boardWidth).fill(null));
            linesCleared++;
            row++;
        }
    }
    return { newBoard, linesCleared };
}

function simulateLanding(piece, boardState) {
    let simPiece = { ...piece };
    while (isValidPositionSimulated(simPiece, boardState)) {
        simPiece.y++;
    }
    simPiece.y--; // Last valid position
    let newBoard = boardState.map(row => row.slice());
    const blocks = TETRIMINOS[simPiece.type].rotations[simPiece.rotation];
    for (const [dx, dy] of blocks) {
        const boardX = simPiece.x + dx;
        const boardY = simPiece.y + dy;
        if (boardY >= 0) newBoard[boardY][boardX] = TETRIMINOS[simPiece.type].color;
    }
    return simulateClearRows(newBoard);
}

function computeHeuristic(simResult) {
    const boardState = simResult.newBoard;
    const linesCleared = simResult.linesCleared;
    let aggregateHeight = 0;
    let holes = 0;
    let bumpiness = 0;
    let columnHeights = [];

    for (let x = 0; x < boardWidth; x++) {
        let colHeight = 0;
        for (let y = 0; y < boardHeight; y++) {
            if (boardState[y][x] !== null) {
                colHeight = boardHeight - y;
                break;
            }
        }
        columnHeights[x] = colHeight;
        aggregateHeight += colHeight;
        let blockFound = false;
        for (let y = 0; y < boardHeight; y++) {
            if (boardState[y][x] !== null) {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
        }
    }
    for (let x = 0; x < boardWidth - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }
    // Weighted heuristic: lower aggregate height, fewer holes and bumpiness are better; clearing lines gives a bonus.
    const score = -0.510066 * aggregateHeight + 0.760666 * linesCleared - 0.35663 * holes - 0.184483 * bumpiness;
    return score;
}

function getBestMove(piece, boardState) {
    let bestScore = -Infinity;
    let bestTarget = { targetRotation: piece.rotation, targetX: piece.x };

    for (let r = 0; r < TETRIMINOS[piece.type].rotations.length; r++) {
        const validXs = getValidPositionsForPiece(piece.type, r);
        for (let x of validXs) {
            const testPiece = { type: piece.type, rotation: r, x: x, y: piece.y };
            while (isValidPositionSimulated(testPiece, boardState)) {
                testPiece.y++;
            }
            testPiece.y--;
            if (testPiece.y < 0) continue;
            const simResult = simulateLanding(testPiece, boardState);
            const score = computeHeuristic(simResult);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = { targetRotation: r, targetX: x };
            }
        }
    }
    return bestTarget;
}

function update(time = 0) {
    if (!isPaused && !gameOver) {
        if (isAuto) {
            // Compute best move if not already computed for the current piece.
            if (!autoMoveTarget) {
                autoMoveTarget = getBestMove(currentPiece, board);
            }
            // Rotate until the piece reaches the target rotation.
            if (currentPiece.rotation !== autoMoveTarget.targetRotation) {
                rotatePiece();
            }
            // Move horizontally toward the target.
            else if (currentPiece.x < autoMoveTarget.targetX) {
                movePiece(1, 0);
            } else if (currentPiece.x > autoMoveTarget.targetX) {
                movePiece(-1, 0);
            }
            // Once aligned, perform a hard drop.
            else {
                while (movePiece(0, 1)) {}
                landPiece();
                autoMoveTarget = null;
            }
        } else {
            if (time - lastFallTime >= fallInterval) {
                if (!movePiece(0, 1)) landPiece();
                lastFallTime = time;
            }
        }
    }
    render();
    requestAnimationFrame(update);
}

// ----- New Game Helper -----
function startNewGame(autoRestart) {
    board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(null));
    score = 0;
    gameOver = false;
    isPaused = false;
    autoMoveTarget = null;
    if (!autoRestart) {
        isAuto = false;         // manual new game resets auto mode
        usedAutoMode = false;
    } else {
        // In auto restart, keep auto mode active and simply reset its usage.
        usedAutoMode = false;
    }
    autoRestartScheduled = false;
    spawnPiece();
}

// ----- Event Listeners -----
document.addEventListener('keydown', (e) => {
    // Disable manual controls if in auto mode.
    if (!isPaused && !gameOver && !isAuto) {
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
    startNewGame(false);
});

document.getElementById('pause').addEventListener('click', () => {
    if (!gameOver) isPaused = !isPaused;
});

document.getElementById('auto').addEventListener('click', () => {
    isAuto = !isAuto;
    if (isAuto) usedAutoMode = true;
    console.log(`Auto mode ${isAuto ? 'enabled' : 'disabled'}`);
    autoMoveTarget = null;
});

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.blur();
    });
});

spawnPiece();
requestAnimationFrame(update);
