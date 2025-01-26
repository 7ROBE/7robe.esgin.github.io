const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restart');

// Game constants
const ENEMY_TYPES = ['normal', 'fast', 'splitter'];
const POWERUP_TYPES = ['freeze', 'split', 'speed', 'invincible', 'shield'];
const COIN_TYPES = [
    { color: '#cd7f32', value: 10 }, // Bronze
    { color: '#c0c0c0', value: 20 }, // Silver
    { color: '#ffd700', value: 50 }  // Gold
];
const BASE_ENEMY_SPEED = 2.5;
const POWERUP_DURATION = 5000;
const PARTICLE_COUNT = 15;
const LEVEL_THRESHOLD = 100;
const BACKGROUND_MUSIC_VOLUME = 0.3;

// Game state
let player = {
    x: 400,
    y: 300,
    size: 30,
    speed: 5,
    baseSpeed: 5
};

let enemies = [];
let coins = [];
let powerUps = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let currentLevel = 1;
let isInvincible = false;
let shield = 0;
let gameRunning = true;

// Audio elements
const coinSound = document.getElementById('coinSound');
const powerupSound = document.getElementById('powerupSound');
const gameOverSound = document.getElementById('gameOverSound');
const bgMusic = document.getElementById('bgMusic');

class Enemy {
    constructor(type) {
        this.type = type;
        this.size = this.getSize();
        this.speed = this.getSpeed();
        this.health = this.type === 'splitter' ? 2 : 1;
        this.color = this.getColor();
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.isFrozen = false;
    }

    getSize() {
        return {
            normal: 30,
            fast: 25,
            splitter: 35
        }[this.type];
    }

    getSpeed() {
        return {
            normal: BASE_ENEMY_SPEED,
            fast: BASE_ENEMY_SPEED * 1.8,
            splitter: BASE_ENEMY_SPEED * 0.8
        }[this.type];
    }

    getColor() {
        return {
            normal: '#e74c3c',
            fast: '#ff4444',
            splitter: '#9b59b6'
        }[this.type];
    }

    move() {
        if (this.isFrozen) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.split();
            return true;
        }
        return false;
    }

    split() {
        if (this.type === 'splitter') {
            for (let i = 0; i < 2; i++) {
                enemies.push(new Enemy('normal'));
            }
            createParticles(this.x, this.y, this.color);
        }
    }
}

class Powerup {
    constructor() {
        this.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        this.size = 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = Math.random() * (canvas.height - this.size);
        this.spawnTime = Date.now();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((Date.now() - this.spawnTime) * 0.002);
        
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    getColor() {
        return {
            freeze: '#00b4d8',
            split: '#9b59b6',
            speed: '#2ecc71',
            invincible: '#f1c40f',
            shield: '#3498db'
        }[this.type];
    }
}

// Initialization
function init() {
    canvas.width = 800;
    canvas.height = 600;
    player = {
        x: canvas.width/2,
        y: canvas.height/2,
        size: 30,
        speed: 5,
        baseSpeed: 5
    };
    
    enemies = [];
    coins = [];
    powerUps = [];
    particles = [];
    score = 0;
    currentLevel = 1;
    isInvincible = false;
    shield = 0;
    gameRunning = true;

    // Initialize enemies
    for (let i = 0; i < 5; i++) {
        enemies.push(new Enemy(ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]));
    }

    // Initialize coins
    for (let i = 0; i < 10; i++) {
        spawnCoin();
    }

    // Audio setup
    bgMusic.volume = BACKGROUND_MUSIC_VOLUME;
    bgMusic.play();

    gameOverScreen.classList.add('hidden');
    updateHUD();
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Player movement
    handleControls();

    // Enemy logic
    enemies.forEach(enemy => {
        enemy.move();
        checkEnemyCollision(enemy);
    });

    // Coin collection
    coins.forEach((coin, index) => {
        if (checkCollision(player, coin)) {
            collectCoin(coin, index);
        }
    });

    // Powerup collection
    powerUps.forEach((powerup, index) => {
        if (checkCollision(player, powerup)) {
            activatePowerup(powerup, index);
        }
    });

    // Level progression
    if (score >= currentLevel * LEVEL_THRESHOLD) {
        currentLevel++;
        enemies.push(new Enemy(ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]));
        powerUps.push(new Powerup());
    }

    // Particle update
    updateParticles();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw shield
    if (shield > 0) {
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size/2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size/2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw coins
    coins.forEach(coin => {
        ctx.fillStyle = coin.color;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size/2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw powerups
    powerUps.forEach(powerup => powerup.draw());

    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw HUD
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${currentLevel}`, 10, 30);
    updateHUD();
}

// Helper functions
function spawnCoin() {
    const type = Math.random();
    const coinType = type < 0.05 ? COIN_TYPES[2] : 
                    type < 0.3 ? COIN_TYPES[1] : 
                    COIN_TYPES[0];
    
    coins.push({
        x: Math.random() * (canvas.width - 20) + 10,
        y: Math.random() * (canvas.height - 20) + 10,
        size: 20,
        ...coinType
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 4 + 2,
            alpha: 1,
            color: color
        });
    }
}

function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (a.size/2 + b.size/2);
}

// Event listeners
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

restartButton.addEventListener('click', init);

// Mobile controls
let touchStartX = 0, touchStartY = 0, touchX = 0, touchY = 0;
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    const rect = canvas.getBoundingClientRect();
    touchStartX = e.touches[0].clientX - rect.left;
    touchStartY = e.touches[0].clientY - rect.top;
    touchX = touchStartX;
    touchY = touchStartY;
}

function handleTouchMove(e) {
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    e.preventDefault();
}

function handleTouchEnd() {
    touchX = touchStartX;
    touchY = touchStartY;
}

function handleControls() {
    if (touchX !== 0 || touchY !== 0) {
        const moveX = touchX - touchStartX;
        const moveY = touchY - touchStartY;
        const distance = Math.sqrt(moveX * moveX + moveY * moveY);
        
        if (distance > 10) {
            player.x += (moveX / distance) * player.speed;
            player.y += (moveY / distance) * player.speed;
        }
    } else {
        // Keyboard controls
        if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
        if (keys.ArrowRight && player.x < canvas.width) player.x += player.speed;
        if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
        if (keys.ArrowDown && player.y < canvas.height) player.y += player.speed;
    }
}

// Powerup system
const powerupEffects = {
    freeze: () => {
        enemies.forEach(enemy => {
            enemy.isFrozen = true;
            enemy.color = '#2980b9';
        });
        setTimeout(() => {
            enemies.forEach(enemy => {
                enemy.isFrozen = false;
                enemy.color = enemy.getColor();
            });
        }, POWERUP_DURATION);
        addPowerupIndicator('freeze', 5);
    },
    split: () => {
        enemies.forEach(enemy => {
            if (enemy.takeDamage()) {
                createParticles(enemy.x, enemy.y, enemy.color);
            }
        });
    },
    speed: () => {
        player.speed *= 2;
        setTimeout(() => {
            player.speed = player.baseSpeed;
        }, POWERUP_DURATION);
        addPowerupIndicator('speed', 5);
    },
    invincible: () => {
        isInvincible = true;
        setTimeout(() => {
            isInvincible = false;
        }, POWERUP_DURATION);
        addPowerupIndicator('invincible', 5);
    },
    shield: () => {
        shield = 3;
        addPowerupIndicator('shield', 0);
    }
};

function activatePowerup(powerup, index) {
    powerupSound.play();
    powerupEffects[powerup.type]();
    powerUps.splice(index, 1);
    createParticles(powerup.x, powerup.y, powerup.getColor());
}

function addPowerupIndicator(type, duration) {
    const indicator = document.createElement('div');
    indicator.className = 'powerup-icon';
    indicator.innerHTML = `
        <span>${type}</span>
        ${duration > 0 ? `<div class="timer" style="width: 100%"></div>` : ''}
    `;
    document.getElementById('activePowerups').appendChild(indicator);

    if (duration > 0) {
        let timeLeft = duration;
        const timer = indicator.querySelector('.timer');
        const interval = setInterval(() => {
            timeLeft--;
            timer.style.width = `${(timeLeft / duration) * 100}%`;
            if (timeLeft <= 0) {
                indicator.remove();
                clearInterval(interval);
            }
        }, 1000);
    }
}

// Game state management
function updateHUD() {
    scoreElement.textContent = `Score: ${score}`;
    highScoreElement.textContent = `High Score: ${highScore}`;
}

function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    gameOverSound.play();
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Start the game
init();
