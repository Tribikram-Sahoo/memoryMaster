// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let score = 0;
let combo = 1;
let timer = 0;
let timerInterval = null;
let difficulty = 'easy';
let totalPairs = 0;
let gameStarted = false;
let isPaused = false;
let soundEnabled = true;

// Card Icons
const icons = [
    '🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎸', '🎺',
    '🎹', '🎬', '🎤', '🎧', '🎼', '🏀', '⚽', '🏈',
    '🎾', '🏐', '🎳', '🏓', '🎱', '🏆', '🎖️', '🏅'
];

// DOM Elements
const difficultyScreen = document.getElementById('difficultyScreen');
const gameBoardContainer = document.getElementById('gameBoardContainer');
const gameBoard = document.getElementById('gameBoard');
const timerEl = document.getElementById('timer');
const movesEl = document.getElementById('moves');
const scoreEl = document.getElementById('score');
const pairsFoundEl = document.getElementById('pairsFound');
const accuracyEl = document.getElementById('accuracy');
const comboEl = document.getElementById('combo');
const winModal = document.getElementById('winModal');
const leaderboardModal = document.getElementById('leaderboardModal');
const pauseModal = document.getElementById('pauseModal');
const soundToggle = document.getElementById('soundToggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    createParticles();
});

// Setup Event Listeners
function setupEventListeners() {
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            difficulty = btn.dataset.difficulty;
            startGame();
        });
    });
    
    // Game controls
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('quitBtn').addEventListener('click', quitGame);
    
    // Win modal buttons
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    document.getElementById('changeDifficultyBtn').addEventListener('click', () => {
        winModal.classList.remove('active');
        quitGame();
    });
    
    // Pause modal buttons
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('pauseRestartBtn').addEventListener('click', () => {
        pauseModal.classList.remove('active');
        restartGame();
    });
    document.getElementById('pauseQuitBtn').addEventListener('click', () => {
        pauseModal.classList.remove('active');
        quitGame();
    });
    
    // Leaderboard
    document.getElementById('showLeaderboardBtn').addEventListener('click', showLeaderboard);
    document.getElementById('closeLeaderboard').addEventListener('click', () => {
        leaderboardModal.classList.remove('active');
    });
    document.getElementById('clearLeaderboardBtn').addEventListener('click', clearLeaderboard);
    
    // Leaderboard tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateLeaderboardDisplay(btn.dataset.tab);
        });
    });
    
    // Sound toggle
    soundToggle.addEventListener('click', toggleSound);
    
    // Modal close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            leaderboardModal.classList.remove('active');
        }
    });
}

// Start Game
function startGame() {
    difficultyScreen.style.display = 'none';
    gameBoardContainer.style.display = 'block';
    
    // Reset game state
    matchedPairs = 0;
    moves = 0;
    score = 0;
    combo = 1;
    timer = 0;
    gameStarted = true;
    isPaused = false;
    
    // Set grid based on difficulty
    const gridSizes = {
        easy: { pairs: 6, cols: 4 },
        medium: { pairs: 8, cols: 4 },
        hard: { pairs: 12, cols: 6 }
    };
    
    const config = gridSizes[difficulty];
    totalPairs = config.pairs;
    
    gameBoard.className = `game-board ${difficulty}`;
    
    // Create cards
    createCards(config.pairs);
    
    // Start timer
    startTimer();
    
    // Update UI
    updateUI();
}

// Create Cards
function createCards(pairs) {
    gameBoard.innerHTML = '';
    cards = [];
    
    // Select random icons
    const selectedIcons = icons.slice(0, pairs);
    const cardIcons = [...selectedIcons, ...selectedIcons];
    
    // Shuffle
    cardIcons.sort(() => Math.random() - 0.5);
    
    // Create card elements
    cardIcons.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.icon = icon;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-face card-front">${icon}</div>
            <div class="card-face card-back">
                <i class="fas fa-question"></i>
            </div>
        `;
        
        card.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

// Flip Card
function flipCard(card) {
    if (isPaused || !gameStarted) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    playSound('flip');
    
    if (flippedCards.length === 2) {
        moves++;
        updateUI();
        setTimeout(checkMatch, 600);
    }
}

// Check Match
function checkMatch() {
    const [card1, card2] = flippedCards;
    const icon1 = card1.dataset.icon;
    const icon2 = card2.dataset.icon;
    
    if (icon1 === icon2) {
        // Match!
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        
        // Calculate score
        const timeBonus = Math.max(100 - timer, 10);
        const comboBonus = combo * 50;
        score += timeBonus + comboBonus;
        combo++;
        
        playSound('match');
        
        // Check if game won
        if (matchedPairs === totalPairs) {
            setTimeout(winGame, 500);
        }
    } else {
        // No match
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            playSound('wrong');
        }, 400);
        combo = 1;
    }
    
    flippedCards = [];
    updateUI();
}

// Timer
function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timer++;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update UI
function updateUI() {
    movesEl.textContent = moves;
    scoreEl.textContent = score;
    pairsFoundEl.textContent = `${matchedPairs} / ${totalPairs}`;
    comboEl.textContent = `x${combo}`;
    
    // Calculate accuracy
    const accuracy = moves > 0 ? ((matchedPairs / moves) * 100) : 100;
    accuracyEl.textContent = `${Math.round(accuracy)}%`;
}

// Win Game
function winGame() {
    stopTimer();
    gameStarted = false;
    
    // Calculate rating
    const rating = calculateRating();
    
    // Update final stats
    document.getElementById('finalTime').textContent = timerEl.textContent;
    document.getElementById('finalMoves').textContent = moves;
    document.getElementById('finalScore').textContent = score;
    
    // Show stars
    const starsContainer = document.getElementById('winStars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const star = document.createElement('i');
        star.className = i < rating ? 'fas fa-star filled' : 'far fa-star';
        starsContainer.appendChild(star);
    }
    
    // Show message
    const messages = ['Good Job!', 'Great Work!', 'Amazing!', 'Perfect!'];
    const messageIndex = Math.min(rating, messages.length - 1);
    document.getElementById('winMessage').textContent = messages[messageIndex];
    
    // Create confetti
    createConfetti();
    
    // Save to leaderboard
    saveToLeaderboard();
    
    // Show modal
    winModal.classList.add('active');
    
    playSound('win');
}

// Calculate Rating
function calculateRating() {
    const minMoves = totalPairs;
    const maxMoves = totalPairs * 3;
    
    if (moves <= minMoves * 1.5) return 3;
    if (moves <= maxMoves * 0.7) return 2;
    return 1;
}

// Pause/Resume
function pauseGame() {
    isPaused = true;
    pauseModal.classList.add('active');
}

function resumeGame() {
    isPaused = false;
    pauseModal.classList.remove('active');
}

// Restart Game
function restartGame() {
    stopTimer();
    winModal.classList.remove('active');
    startGame();
}

// Quit Game
function quitGame() {
    stopTimer();
    gameBoardContainer.style.display = 'none';
    difficultyScreen.style.display = 'flex';
    gameStarted = false;
}

// Leaderboard
function saveToLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('memoryLeaderboard')) || {
        easy: [],
        medium: [],
        hard: []
    };
    
    const entry = {
        score: score,
        time: timer,
        moves: moves,
        date: new Date().toISOString()
    };
    
    leaderboard[difficulty].push(entry);
    leaderboard[difficulty].sort((a, b) => b.score - a.score);
    leaderboard[difficulty] = leaderboard[difficulty].slice(0, 10);
    
    localStorage.setItem('memoryLeaderboard', JSON.stringify(leaderboard));
}

function showLeaderboard() {
    leaderboardModal.classList.add('active');
    updateLeaderboardDisplay('easy');
}

function updateLeaderboardDisplay(diff) {
    const leaderboard = JSON.parse(localStorage.getItem('memoryLeaderboard')) || {
        easy: [],
        medium: [],
        hard: []
    };
    
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';
    
    const entries = leaderboard[diff];
    
    if (entries.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No entries yet. Be the first!</p>';
        return;
    }
    
    entries.forEach((entry, index) => {
        const minutes = Math.floor(entry.time / 60);
        const seconds = entry.time % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-details">
                <div class="leaderboard-stats">
                    <span><i class="fas fa-star"></i> ${entry.score}</span>
                    <span><i class="fas fa-clock"></i> ${timeStr}</span>
                    <span><i class="fas fa-hand-pointer"></i> ${entry.moves}</span>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function clearLeaderboard() {
    if (confirm('Are you sure you want to clear the leaderboard?')) {
        localStorage.removeItem('memoryLeaderboard');
        updateLeaderboardDisplay(document.querySelector('.tab-btn.active').dataset.tab);
    }
}

// Sound Effects
function playSound(type) {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const sounds = {
        flip: { frequency: 400, duration: 0.1 },
        match: { frequency: 600, duration: 0.2 },
        wrong: { frequency: 200, duration: 0.15 },
        win: { frequency: 800, duration: 0.3 }
    };
    
    const sound = sounds[type];
    oscillator.frequency.value = sound.frequency;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.innerHTML = soundEnabled 
        ? '<i class="fas fa-volume-up"></i>' 
        : '<i class="fas fa-volume-mute"></i>';
    soundToggle.classList.toggle('muted');
}

// Particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 10 + 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = Math.random() * 10 + 10 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
    }
}

// Confetti
function createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    confettiContainer.innerHTML = '';
    
    const colors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcf7f', '#a06cd5'];
    
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        confettiContainer.appendChild(piece);
    }
}
