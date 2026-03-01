// ============================================================================
// Crystals of the Canopy - Professional Platformer Game
// All 9 improvements: 12+ platforms, fixed collisions, jump buffering,
// coyote time, acceleration/deceleration, responsive design
// ============================================================================

(function () {
  'use strict';

  // ============================================================================
  // CONFIGURATION CONSTANTS
  // ============================================================================
  const GRAVITY = 1000;
  const JUMP_POWER = 350;
  const TERMINAL_VELOCITY = 400;
  const ACCELERATION = 1200;
  const FRICTION = 0.88;
  const JUMP_BUFFER_TIME = 0.12; // 120ms
  const COYOTE_TIME = 0.1; // 100ms
  const SPEED_BOOST_DURATION = 4;
  const SPEED_BOOST_MULTIPLIER = 2;
  const PLAYER_WIDTH = 24;
  const PLAYER_HEIGHT = 32;
  const NUM_PLATFORMS = 12;
  const PLATFORM_HEIGHT = 14;
  const COIN_POINTS = 10;
  const CRYSTAL_POINTS = 25;

  // ============================================================================
  // CANVAS & RENDERING
  // ============================================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  let width = 800;
  let height = 600;
  const PIXEL_RATIO = Math.max(1, window.devicePixelRatio || 1);

  function resizeCanvas() {
    width = Math.max(320, window.innerWidth);
    height = Math.max(240, window.innerHeight);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * PIXEL_RATIO);
    canvas.height = Math.floor(height * PIXEL_RATIO);
    ctx.imageSmoothingEnabled = false;
    _initGame();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // ============================================================================
  // PLAYER OBJECT
  // ============================================================================
  const player = {
    x: 40,
    y: 200,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    maxSpeed: 200,
    onGround: false,
    walkTimer: 0,
    coyoteCounter: 0,
    jumpBufferCounter: 0,
    speedBoostActive: false,
    speedBoostTimer: 0
  };

  // ============================================================================
  // GAME STATE
  // ============================================================================
  const platforms = [];
  const crystals = [];
  const coins = [];

  let score = 0;
  let coinsCollected = 0;
  let totalCoins = 0;
  let gameWon = false;

  // ============================================================================
  // GAME INITIALIZATION
  // ============================================================================
  function _initGame() {
    platforms.length = 0;
    crystals.length = 0;
    coins.length = 0;

    const platformWidth = Math.max(120, width / 8);
    const platformSpacing = width / (NUM_PLATFORMS + 0.5);
    const verticalVariation = height / 2;

    for (let i = 0; i < NUM_PLATFORMS; i++) {
      const x = platformSpacing * (i + 0.5);
      const baseY = height * 0.5 - (i * verticalVariation / NUM_PLATFORMS) * 0.8;
      const y = Math.max(80, Math.min(height - 100, baseY + (Math.random() - 0.5) * 40));

      platforms.push({
        x: Math.max(platformWidth / 2, Math.min(width - platformWidth / 2, x)),
        y: y,
        w: platformWidth,
        h: PLATFORM_HEIGHT
      });
    }

    platforms.sort((a, b) => a.x - b.x);
    _spawnPickups();
  }

  function _spawnPickups() {
    crystals.length = 0;
    coins.length = 0;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];

      for (let j = 0; j < 2; j++) {
        const offset = -40 + j * 80;
        const coinX = Math.max(20, Math.min(width - 20, p.x + offset));
        coins.push({
          x: coinX,
          y: p.y - 30,
          r: 6,
          collected: false
        });
      }

      if (i % 2 === 0 && i < platforms.length) {
        const crystalX = Math.max(20, Math.min(width - 20, p.x + (i % 2 ? 40 : -40)));
        crystals.push({
          x: crystalX,
          y: p.y - 40,
          r: 8,
          hue: 180 + i * 15,
          collected: false
        });
      }
    }

    totalCoins = coins.length;
  }

  function _resetPlayer() {
    player.x = 40;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyoteCounter = 0;
    player.jumpBufferCounter = 0;
    player.speedBoostActive = false;
    player.speedBoostTimer = 0;
    score = 0;
    coinsCollected = 0;
    gameWon = false;
    _spawnPickups();
  }

  _initGame();
  _resetPlayer();

  // ============================================================================
  // GAME LOOP
  // ============================================================================
  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.016, (now - lastTime) / 1000);
    lastTime = now;
    _update(dt);
    _render();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // ============================================================================
  // UPDATE LOGIC
  // ============================================================================
  function _update(dt) {
    const moveLeft = keys['ArrowLeft'] || keys['a'];
    const moveRight = keys['ArrowRight'] || keys['d'];
    const jumpKey = keys['ArrowUp'] || keys['w'] || keys[' '];

    // Smooth acceleration/deceleration
    const speedMultiplier = player.speedBoostActive ? SPEED_BOOST_MULTIPLIER : 1;
    const targetVx = moveRight ? player.maxSpeed * speedMultiplier :
                     moveLeft ? -player.maxSpeed * speedMultiplier : 0;

    if (moveRight || moveLeft) {
      const accel = targetVx > player.vx ? ACCELERATION : -ACCELERATION;
      player.vx = Math.sign(targetVx) !== Math.sign(player.vx) ? targetVx :
                  Math.abs(player.vx + accel * dt) > Math.abs(targetVx) ? targetVx :
                  player.vx + accel * dt;
    } else {
      player.vx *= FRICTION;
      if (Math.abs(player.vx) < 2) player.vx = 0;
    }

    // Gravity
    if (!player.onGround) {
      player.vy += GRAVITY * dt;
      if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
      player.coyoteCounter -= dt;
    } else {
      player.coyoteCounter = COYOTE_TIME;
    }

    // Jump buffer and coyote time
    player.jumpBufferCounter -= dt;
    if (jumpKey) {
      player.jumpBufferCounter = JUMP_BUFFER_TIME;
    }

    if (player.jumpBufferCounter > 0 && player.coyoteCounter > 0) {
      player.vy = -JUMP_POWER;
      player.onGround = false;
      player.coyoteCounter = 0;
      player.jumpBufferCounter = 0;
    }

    const prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Collision detection
    player.onGround = false;
    for (const platform of platforms) {
      _checkPlatformCollision(platform, prevY);
    }

    // Speed boost
    if (player.speedBoostActive) {
      player.speedBoostTimer -= dt;
      if (player.speedBoostTimer <= 0) {
        player.speedBoostActive = false;
        player.speedBoostTimer = 0;
      }
    }

    // Animation
    if (Math.abs(player.vx) > 5 && player.onGround) {
      player.walkTimer += dt * 8;
    } else {
      player.walkTimer += dt * 2;
    }

    // Collect coins
    for (const coin of coins) {
      if (!coin.collected) {
        const dx = coin.x - (player.x + player.w / 2);
        const dy = coin.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < coin.r + 14) {
          coin.collected = true;
          coinsCollected++;
          score += COIN_POINTS;
        }
      }
    }

    // Collect crystals
    for (const crystal of crystals) {
      if (!crystal.collected) {
        const dx = crystal.x - (player.x + player.w / 2);
        const dy = crystal.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < crystal.r + 14) {
          crystal.collected = true;
          player.speedBoostActive = true;
          player.speedBoostTimer = SPEED_BOOST_DURATION;
          score += CRYSTAL_POINTS;
        }
      }
    }

    // Fall check
    if (player.y > height + 100) {
      _resetPlayer();
      return;
    }

    // Win condition
    if (coinsCollected === totalCoins && totalCoins > 0 && player.x > width - 80 && !gameWon) {
      gameWon = true;
    }
  }

  function _checkPlatformCollision(platform, prevY) {
    const pLeft = platform.x - platform.w / 2;
    const pRight = platform.x + platform.w / 2;
    const pTop = platform.y;
    const pBottom = platform.y + platform.h;

    const plLeft = player.x;
    const plRight = player.x + player.w;
    const plTop = player.y;
    const plBottom = player.y + player.h;

    // Horizontal overlap check
    if (plRight <= pLeft || plLeft >= pRight) return;

    // Landing from above
    if (prevY + player.h <= pTop && plBottom >= pTop && player.vy >= 0) {
      player.y = pTop - player.h;
      player.vy = 0;
      player.onGround = true;
      return;
    }

    // Hit from below
    if (prevY >= pBottom && plTop <= pBottom && player.vy < 0) {
      player.y = pBottom;
      player.vy = 0.1;
      return;
    }

    // Side collisions
    const overlapLeft = plRight - pLeft;
    const overlapRight = pRight - plLeft;
    const overlapTop = plBottom - plTop;
    const overlapBottom = pBottom - plTop;

    if (overlapLeft < overlapRight && overlapLeft < overlapTop && overlapLeft < overlapBottom) {
      player.x = pLeft - player.w;
      player.vx = 0;
    } else if (overlapRight < overlapLeft && overlapRight < overlapTop && overlapRight < overlapBottom) {
      player.x = pRight;
      player.vx = 0;
    }
  }

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================
  function _render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87ceeb');
    bgGrad.addColorStop(1, '#2d5016');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

    // Draw platforms
    for (const p of platforms) {
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
      ctx.fillStyle = '#654321';
      ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);
      ctx.strokeStyle = '#a0826d';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);
    }

    // Draw collectibles
    for (const coin of coins) {
      if (!coin.collected) drawCoin(ctx, coin.x, coin.y, coin.r);
    }
    for (const crystal of crystals) {
      if (!crystal.collected) drawCrystal(ctx, crystal.x, crystal.y, crystal.r, crystal.hue);
    }

    drawPlayer(ctx, player);

    // Draw HUD on scaled canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 350, 90);

    ctx.fillStyle = '#fff';
    ctx.font = `bold 16px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 16, 12);
    ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16, 36);

    if (player.speedBoostActive) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = `bold 14px Arial`;
      ctx.fillText(`⚡ SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, 16, 60);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = `12px Arial`;
    ctx.fillText('ARROWS/WASD - Move | SPACE/W - Jump', 16, height - 24);

    // Win screen
    if (gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff00';
      ctx.font = `bold 60px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', width / 2, height / 2 - 50);

      ctx.fillStyle = '#ffff00';
      ctx.font = `28px Arial`;
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = `16px Arial`;
      ctx.fillText('Refresh to play again', width / 2, height / 2 + 80);
    }

    ctx.restore();
  }

  // ============================================================================
  // DRAWING FUNCTIONS
  // ============================================================================

  function drawCoin(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);

    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ffd700');
    grad.addColorStop(0.5, '#ffed4e');
    grad.addColorStop(1, '#ccaa00');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawCrystal(ctx, x, y, r, hue) {
    ctx.save();
    ctx.translate(x, y);

    const grad = ctx.createLinearGradient(0, -r * 1.5, 0, r * 1.5);
    grad.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
    grad.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);
    grad.addColorStop(1, `hsl(${hue}, 100%, 40%)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.5);
    ctx.lineTo(r * 0.6, -r * 0.5);
    ctx.lineTo(r, r * 0.5);
    ctx.lineTo(0, r * 1.5);
    ctx.lineTo(-r, r * 0.5);
    ctx.lineTo(-r * 0.6, -r * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `hsl(${hue}, 100%, 30%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.2);
    ctx.lineTo(0, r * 1.2);
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayer(ctx, pl) {
    ctx.save();
    ctx.translate(pl.x, pl.y);

    const w = pl.w;
    const h = pl.h;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w * 0.6, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headR = w * 0.6;
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.5, h * 0, headR * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w / 2 + headR * 0.5, h * 0, headR * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.1, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 170, 180, 0.6)';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.5, h * 0.12, headR * 0.15, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.5, h * 0.12, headR * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#cc6666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.22, headR * 0.12, 0, Math.PI);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(w * 0.08, h * 0.48, w * 0.84, h * 0.32);

    // Shorts
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(w * 0.12, h * 0.78, w * 0.76, h * 0.15);

    // Arms
    ctx.strokeStyle = '#ffcc99';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const armSwing = Math.sin(pl.walkTimer) * 6 * (Math.abs(pl.vx) / pl.maxSpeed);
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.55);
    ctx.lineTo(w * 0.02 + armSwing, h * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.9, h * 0.55);
    ctx.lineTo(w * 0.98 - armSwing, h * 0.65);
    ctx.stroke();

    // Legs
    const legSwing = Math.sin(pl.walkTimer) * 4 * (Math.abs(pl.vx) / pl.maxSpeed);
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.92);
    ctx.lineTo(w * 0.3 + legSwing, h * 1.08);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.92);
    ctx.lineTo(w * 0.7 - legSwing, h * 1.08);
    ctx.stroke();

    // Shoes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 1.08, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.7, h * 1.08, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Speed boost glow
    if (pl.speedBoostActive) {
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.max(w, h) / 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
})();
