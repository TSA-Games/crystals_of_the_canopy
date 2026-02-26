// ============================================================================// Crystals of the Canopy - Perfect Platformer Game

// Crystals of the Canopy - Professional Platformer Game(function () {

// All collision glitches fixed, responsive design, 12+ platforms  // ============================================================================

// ============================================================================  // CANVAS & RENDERING SETUP

  // ============================================================================

(function () {  const canvas = document.getElementById('game');

  'use strict';  const ctx = canvas.getContext('2d');

  const fpsEl = document.getElementById('fps');

  // ============================================================================  const stateEl = document.getElementById('state');

  // CONFIGURATION CONSTANTS

  // ============================================================================  let width = 800;

  const GRAVITY = 1000;  let height = 600;

  const JUMP_POWER = 350;  const PIXEL_RATIO = Math.max(1, window.devicePixelRatio || 1);

  const TERMINAL_VELOCITY = 400;

  const ACCELERATION = 1200;  function resize() {

  const DECELERATION = 1400;    width = Math.max(320, window.innerWidth);

  const FRICTION = 0.88;    height = Math.max(240, window.innerHeight);

  const JUMP_BUFFER_TIME = 0.12; // 120ms jump buffer    canvas.style.width = width + 'px';

  const COYOTE_TIME = 0.1; // 100ms coyote time    canvas.style.height = height + 'px';

  const SPEED_BOOST_DURATION = 4;    canvas.width = Math.floor(width * pixelRatio);

  const SPEED_BOOST_MULTIPLIER = 2;    canvas.height = Math.floor(height * pixelRatio);

  const PLAYER_WIDTH = 24;    ctx.imageSmoothingEnabled = false;

  const PLAYER_HEIGHT = 32;  }

  const NUM_PLATFORMS = 12;  window.addEventListener('resize', resize);

  const PLATFORM_HEIGHT = 14;  resize();

  const COIN_POINTS = 10;

  const CRYSTAL_POINTS = 25;  // Input

  const keys = {};

  // ============================================================================  window.addEventListener('keydown', (e) => (keys[e.key] = true));

  // CANVAS & RENDERING  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // ============================================================================

  const canvas = document.getElementById('game');  // Player object - Kid character

  const ctx = canvas.getContext('2d');  const player = {

  const fpsEl = document.getElementById('fps');    x: 40,

  const stateEl = document.getElementById('state');    y: 200,

    w: 24,

  let width = 800;    h: 32,

  let height = 600;    vx: 0,

  const PIXEL_RATIO = Math.max(1, window.devicePixelRatio || 1);    vy: 0,

    speed: 200,

  function resizeCanvas() {    jumpPower: 350,

    width = Math.max(320, window.innerWidth);    gravity: 1000,

    height = Math.max(240, window.innerHeight);    friction: 0.85,

    canvas.style.width = width + 'px';    onGround: false,

    canvas.style.height = height + 'px';    walkTimer: 0,

    canvas.width = Math.floor(width * PIXEL_RATIO);    speedBoostActive: false,

    canvas.height = Math.floor(height * PIXEL_RATIO);    speedBoostTimer: 0,

    ctx.imageSmoothingEnabled = false;    speedBoostMultiplier: 2

      };

    // Reinitialize game on resize

    _initGame();  const platforms = [];

  }  const crystals = [];

  window.addEventListener('resize', resizeCanvas);  const coins = [];

  resizeCanvas();  

  const RESET_ZONE_Y = 600; // If player falls below this, reset

  // ============================================================================  const WIN_X = width - 60; // Win when reaching right side

  // INPUT HANDLING

  // ============================================================================  let score = 0;

  const keys = {};  let coinsCollected = 0;

  window.addEventListener('keydown', (e) => (keys[e.key] = true));  let gameWon = false;

  window.addEventListener('keyup', (e) => (keys[e.key] = false));  let totalCoins = 0;



  // ============================================================================  function _initGame() {

  // PLAYER OBJECT    platforms.length = 0;

  // ============================================================================    crystals.length = 0;

  const player = {    coins.length = 0;

    x: 40,    

    y: 200,    // Create 6 bridges spanning the screen width

    w: PLAYER_WIDTH,    const bridgeWidth = 140;

    h: PLAYER_HEIGHT,    const bridgeHeight = 12;

    vx: 0,    const spacing = width / 6.5;

    vy: 0,    

    maxSpeed: 200,    for (let i = 0; i < 6; i++) {

    onGround: false,      const x = 60 + i * spacing;

    walkTimer: 0,      const y = 150 + i * 60; // Increasing height for challenge

    coyoteCounter: 0,      platforms.push({ x, y, w: bridgeWidth, h: bridgeHeight });

    jumpBufferCounter: 0,    }

    speedBoostActive: false,    

    speedBoostTimer: 0,    // Spawn collectibles

    lastPlatformY: Infinity    _spawnPickups();

  };  }



  // ============================================================================  function _spawnPickups() {

  // GAME STATE    crystals.length = 0;

  // ============================================================================    coins.length = 0;

  const platforms = [];    

  const crystals = [];    // Place coins and crystals on or near platforms

  const coins = [];    for (let i = 0; i < platforms.length; i++) {

      const p = platforms[i];

  let score = 0;      

  let coinsCollected = 0;      // 2 coins per platform

  let totalCoins = 0;      for (let j = 0; j < 2; j++) {

  let gameWon = false;        const offset = -60 + j * 60;

        coins.push({

  // ============================================================================          x: p.x + offset,

  // GAME INITIALIZATION          y: p.y - 25,

  // ============================================================================          r: 6,

  function _initGame() {          collected: false

    platforms.length = 0;        });

    crystals.length = 0;      }

    coins.length = 0;      

          // 1-2 crystals per platform

    // Create NUM_PLATFORMS bridges evenly spaced      if (i % 2 === 0) {

    const platformWidth = Math.max(120, width / 8);        crystals.push({

    const platformSpacing = width / (NUM_PLATFORMS + 0.5);          x: p.x + (i % 2 ? 40 : -40),

    const verticalVariation = height / 2;          y: p.y - 35,

              r: 8,

    for (let i = 0; i < NUM_PLATFORMS; i++) {          hue: 180 + i * 30,

      const x = platformSpacing * (i + 0.5);          collected: false

      // Create a gentle slope with variation, never too high or low        });

      const baseY = height * 0.5 - (i * verticalVariation / NUM_PLATFORMS) * 0.8;      }

      const y = Math.max(80, Math.min(height - 100, baseY + (Math.random() - 0.5) * 40));    }

          

      platforms.push({    totalCoins = coins.length;

        x: Math.max(platformWidth / 2, Math.min(width - platformWidth / 2, x)),  }

        y: y,

        w: platformWidth,  function _resetPlayer() {

        h: PLATFORM_HEIGHT    player.x = 40;

      });    player.y = 200;

    }    player.vx = 0;

        player.vy = 0;

    // Sort platforms by X position to ensure proper spawning    player.onGround = false;

    platforms.sort((a, b) => a.x - b.x);    player.speedBoostActive = false;

        player.speedBoostTimer = 0;

    _spawnPickups();    score = 0;

  }    coinsCollected = 0;

    gameWon = false;

  function _spawnPickups() {    _spawnPickups();

    crystals.length = 0;  }

    coins.length = 0;

      _initGame();

    // Place coins and crystals safely on platforms  _resetPlayer();

    for (let i = 0; i < platforms.length; i++) {

      const p = platforms[i];  // Main game loop

        let lastTime = performance.now();

      // 2 coins per platform, positioned above platform center  function loop(now) {

      for (let j = 0; j < 2; j++) {    const dt = Math.min(0.016, (now - lastTime) / 1000);

        const offset = -40 + j * 80;    lastTime = now;

        const coinX = Math.max(20, Math.min(width - 20, p.x + offset));    _update(dt);

        coins.push({    _render();

          x: coinX,    requestAnimationFrame(loop);

          y: p.y - 30,  }

          r: 6,  requestAnimationFrame(loop);

          collected: false

        });  function _update(dt) {

      }    // Input handling

          const moveLeft = keys['ArrowLeft'] || keys['a'];

      // 1 crystal per 2 platforms    const moveRight = keys['ArrowRight'] || keys['d'];

      if (i % 2 === 0 && i < platforms.length) {    const jumpKey = keys['ArrowUp'] || keys['w'] || keys[' '];

        const crystalX = Math.max(20, Math.min(width - 20, p.x + (i % 2 ? 40 : -40)));

        crystals.push({    // Horizontal movement with friction

          x: crystalX,    if (moveRight && !moveLeft) {

          y: p.y - 40,      player.vx = player.speed * (player.speedBoostActive ? player.speedBoostMultiplier : 1);

          r: 8,    } else if (moveLeft && !moveRight) {

          hue: 180 + i * 15,      player.vx = -player.speed * (player.speedBoostActive ? player.speedBoostMultiplier : 1);

          collected: false    } else {

        });      player.vx *= player.friction;

      }      if (Math.abs(player.vx) < 5) player.vx = 0;

    }    }

    

    totalCoins = coins.length;    // Apply gravity

  }    if (!player.onGround) {

      player.vy += player.gravity * dt;

  function _resetPlayer() {      if (player.vy > 400) player.vy = 400; // Terminal velocity

    player.x = 40;    }

    player.y = 200;

    player.vx = 0;    // Store previous position for collision detection

    player.vy = 0;    const prevY = player.y;

    player.onGround = false;    

    player.coyoteCounter = 0;    // Update position

    player.jumpBufferCounter = 0;    player.x += player.vx * dt;

    player.speedBoostActive = false;    player.y += player.vy * dt;

    player.speedBoostTimer = 0;

    player.lastPlatformY = Infinity;    // Constrain to screen width

    score = 0;    player.x = Math.max(0, Math.min(width - player.w, player.x));

    coinsCollected = 0;

    gameWon = false;    // Platform collision detection

    _spawnPickups();    player.onGround = false;

  }    

    for (const platform of platforms) {

  _initGame();      const platformLeft = platform.x - platform.w / 2;

  _resetPlayer();      const platformRight = platform.x + platform.w / 2;

      const platformTop = platform.y;

  // ============================================================================      const platformBottom = platform.y + platform.h;

  // GAME LOOP

  // ============================================================================      const playerLeft = player.x;

  let lastTime = performance.now();      const playerRight = player.x + player.w;

  function gameLoop(now) {      const playerTop = player.y;

    const dt = Math.min(0.016, (now - lastTime) / 1000);      const playerBottom = player.y + player.h;

    lastTime = now;

    _update(dt);      // Check horizontal overlap

    _render();      if (playerRight > platformLeft && playerLeft < platformRight) {

    requestAnimationFrame(gameLoop);        // Check landing from above

  }        if (prevY + player.h <= platformTop && playerBottom >= platformTop && player.vy >= 0) {

  requestAnimationFrame(gameLoop);          player.y = platformTop - player.h;

          player.vy = 0;

  // ============================================================================          player.onGround = true;

  // UPDATE LOGIC        }

  // ============================================================================        // Check hitting from below

  function _update(dt) {        else if (prevY >= platformBottom && playerTop <= platformBottom && player.vy < 0) {

    // Input          player.y = platformBottom;

    const moveLeft = keys['ArrowLeft'] || keys['a'];          player.vy = 0;

    const moveRight = keys['ArrowRight'] || keys['d'];        }

    const jumpKey = keys['ArrowUp'] || keys['w'] || keys[' '];      }

    }

    // Smooth acceleration/deceleration for horizontal movement

    const speedMultiplier = player.speedBoostActive ? SPEED_BOOST_MULTIPLIER : 1;    // Jump

    const targetVx = moveRight ? player.maxSpeed * speedMultiplier : moveLeft ? -player.maxSpeed * speedMultiplier : 0;    if (jumpKey && player.onGround) {

          player.vy = -player.jumpPower;

    if (moveRight || moveLeft) {      player.onGround = false;

      // Accelerate toward target speed    }

      const accel = targetVx > player.vx ? ACCELERATION : -ACCELERATION;

      player.vx = Math.sign(targetVx) !== Math.sign(player.vx) ? targetVx :     // Speed boost timer

                   Math.abs(player.vx + accel * dt) > Math.abs(targetVx) ? targetVx : player.vx + accel * dt;    if (player.speedBoostActive) {

    } else {      player.speedBoostTimer -= dt;

      // Decelerate      if (player.speedBoostTimer <= 0) {

      player.vx *= FRICTION;        player.speedBoostActive = false;

      if (Math.abs(player.vx) < 2) player.vx = 0;        player.speedBoostTimer = 0;

    }      }

    }

    // Gravity (only when not on ground)

    if (!player.onGround) {    // Update walk animation

      player.vy += GRAVITY * dt;    if (Math.abs(player.vx) > 10 && player.onGround) {

      if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;      player.walkTimer += dt * 8;

      player.coyoteCounter -= dt;    } else {

    } else {      player.walkTimer += dt * 2;

      player.coyoteCounter = COYOTE_TIME;    }

    }

    // Collect coins

    // Jump buffer and coyote time    for (const coin of coins) {

    player.jumpBufferCounter -= dt;      if (!coin.collected) {

    if (jumpKey) {        const dx = coin.x - (player.x + player.w / 2);

      player.jumpBufferCounter = JUMP_BUFFER_TIME;        const dy = coin.y - (player.y + player.h / 2);

    }        if (Math.hypot(dx, dy) < coin.r + 12) {

              coin.collected = true;

    if (player.jumpBufferCounter > 0 && player.coyoteCounter > 0) {          coinsCollected++;

      player.vy = -JUMP_POWER;          score += 10;

      player.onGround = false;        }

      player.coyoteCounter = 0;      }

      player.jumpBufferCounter = 0;    }

    }

    // Collect crystals

    // Store previous position for collision detection    for (const crystal of crystals) {

    const prevY = player.y;      if (!crystal.collected) {

    const prevX = player.x;        const dx = crystal.x - (player.x + player.w / 2);

            const dy = crystal.y - (player.y + player.h / 2);

    // Update position        if (Math.hypot(dx, dy) < crystal.r + 12) {

    player.x += player.vx * dt;          crystal.collected = true;

    player.y += player.vy * dt;          player.speedBoostActive = true;

          player.speedBoostTimer = 4;

    // Constrain to screen width with padding          score += 25;

    player.x = Math.max(0, Math.min(width - player.w, player.x));        }

      }

    // Platform collision detection (improved)    }

    player.onGround = false;

        // Check fall

    for (const platform of platforms) {    if (player.y > RESET_ZONE_Y) {

      _checkPlatformCollision(platform, prevX, prevY);      _resetPlayer();

    }      return;

    }

    // Update speed boost

    if (player.speedBoostActive) {    // Check win condition

      player.speedBoostTimer -= dt;    if (coinsCollected === totalCoins && player.x > WIN_X) {

      if (player.speedBoostTimer <= 0) {      gameWon = true;

        player.speedBoostActive = false;    }

        player.speedBoostTimer = 0;  }

      }

    }  function _render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update walk animation

    if (Math.abs(player.vx) > 5 && player.onGround) {    // Draw background

      player.walkTimer += dt * 8;    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);

    } else {    bgGrad.addColorStop(0, '#87ceeb');

      player.walkTimer += dt * 2;    bgGrad.addColorStop(1, '#2d5016');

    }    ctx.fillStyle = bgGrad;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Collect coins

    for (const coin of coins) {    ctx.save();

      if (!coin.collected) {    ctx.scale(pixelRatio, pixelRatio);

        const dx = coin.x - (player.x + player.w / 2);

        const dy = coin.y - (player.y + player.h / 2);    // Draw platforms (brown bridges)

        if (Math.hypot(dx, dy) < coin.r + 14) {    for (const p of platforms) {

          coin.collected = true;      ctx.fillStyle = '#8b7355';

          coinsCollected++;      ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);

          score += COIN_POINTS;      

        }      // Platform shadow

      }      ctx.fillStyle = '#654321';

    }      ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);

      

    // Collect crystals      // Platform detail

    for (const crystal of crystals) {      ctx.strokeStyle = '#a0826d';

      if (!crystal.collected) {      ctx.lineWidth = 1;

        const dx = crystal.x - (player.x + player.w / 2);      ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);

        const dy = crystal.y - (player.y + player.h / 2);    }

        if (Math.hypot(dx, dy) < crystal.r + 14) {

          crystal.collected = true;    // Draw coins (yellow circles)

          player.speedBoostActive = true;    for (const coin of coins) {

          player.speedBoostTimer = SPEED_BOOST_DURATION;      if (!coin.collected) {

          score += CRYSTAL_POINTS;        drawCoin(ctx, coin.x, coin.y, coin.r);

        }      }

      }    }

    }

    // Draw crystals (cyan sparkling gems)

    // Check fall - reset if too far down    for (const crystal of crystals) {

    if (player.y > height + 100) {      if (!crystal.collected) {

      _resetPlayer();        drawCrystal(ctx, crystal.x, crystal.y, crystal.r, crystal.hue);

      return;      }

    }    }



    // Check win condition    // Draw player

    const WIN_THRESHOLD = coinsCollected === totalCoins && totalCoins > 0;    drawPlayer(ctx, player);

    const WIN_POSITION = player.x > width - 80;

        ctx.restore();

    if (WIN_THRESHOLD && WIN_POSITION && !gameWon) {

      gameWon = true;    // Draw HUD

    }    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

  }    ctx.fillRect(0, 0, 300 * pixelRatio, 80 * pixelRatio);

    

  function _checkPlatformCollision(platform, prevX, prevY) {    ctx.fillStyle = '#fff';

    const COLLISION_THRESHOLD = 2; // pixels of tolerance    ctx.font = `bold ${16 * pixelRatio}px Arial`;

        ctx.textBaseline = 'top';

    const platformLeft = platform.x - platform.w / 2;    ctx.fillText(`Score: ${score}`, 16 * pixelRatio, 12 * pixelRatio);

    const platformRight = platform.x + platform.w / 2;    ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16 * pixelRatio, 36 * pixelRatio);

    const platformTop = platform.y;    

    const platformBottom = platform.y + platform.h;    if (player.speedBoostActive) {

      ctx.fillStyle = '#ff6b6b';

    const playerLeft = player.x;      ctx.font = `bold ${14 * pixelRatio}px Arial`;

    const playerRight = player.x + player.w;      ctx.fillText(`⚡ SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, 16 * pixelRatio, 60 * pixelRatio);

    const playerTop = player.y;    }

    const playerBottom = player.y + player.h;

    // Draw controls

    // Check horizontal overlap    ctx.fillStyle = '#aaa';

    const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;    ctx.font = `${12 * pixelRatio}px Arial`;

    if (!horizontalOverlap) return;    ctx.fillText('ARROW KEYS/WASD - Move | SPACE/W - Jump', 16 * pixelRatio, height - 24 * pixelRatio);



    // Landing from above (most common case)    // Draw win screen

    const wasAbove = prevY + player.h <= platformTop;    if (gameWon) {

    const isNowOnOrBelow = playerBottom >= platformTop;      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

    const isMovingDown = player.vy >= 0;      ctx.fillRect(0, 0, canvas.width, canvas.height);

          

    if (wasAbove && isNowOnOrBelow && isMovingDown) {      ctx.fillStyle = '#00ff00';

      player.y = platformTop - player.h;      ctx.font = `bold ${60 * pixelRatio}px Arial`;

      player.vy = 0;      ctx.textAlign = 'center';

      player.onGround = true;      ctx.textBaseline = 'middle';

      player.lastPlatformY = platformTop;      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 40 * pixelRatio);

      return;      

    }      ctx.fillStyle = '#ffff00';

      ctx.font = `${28 * pixelRatio}px Arial`;

    // Hitting from below      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40 * pixelRatio);

    const wasBelow = prevY >= platformBottom;      

    const isNowOnOrAbove = playerTop <= platformBottom;      ctx.fillStyle = '#ffffff';

    const isMovingUp = player.vy < 0;      ctx.font = `${16 * pixelRatio}px Arial`;

          ctx.fillText('Refresh page to play again', canvas.width / 2, canvas.height / 2 + 80 * pixelRatio);

    if (wasBelow && isNowOnOrAbove && isMovingUp) {    }

      player.y = platformBottom;  }

      player.vy = 0.1; // Slight bounce downward

      return;  // Draw coin

    }  function drawCoin(ctx, x, y, r) {

    ctx.save();

    // Side collision prevention - push player out    ctx.translate(x * pixelRatio, y * pixelRatio);

    const overlapLeft = playerRight - platformLeft;

    const overlapRight = platformRight - playerLeft;    const grad = ctx.createLinearGradient(-r, -r, r, r);

    const overlapTop = playerBottom - platformTop;    grad.addColorStop(0, '#ffd700');

    const overlapBottom = platformBottom - playerTop;    grad.addColorStop(0.5, '#ffed4e');

    grad.addColorStop(1, '#ccaa00');

    if (overlapLeft < overlapRight && overlapLeft < overlapTop && overlapLeft < overlapBottom) {

      // Hit from left side    ctx.fillStyle = grad;

      player.x = platformLeft - player.w;    ctx.beginPath();

      player.vx = 0;    ctx.arc(0, 0, r, 0, Math.PI * 2);

    } else if (overlapRight < overlapLeft && overlapRight < overlapTop && overlapRight < overlapBottom) {    ctx.fill();

      // Hit from right side

      player.x = platformRight;    ctx.strokeStyle = '#cc8800';

      player.vx = 0;    ctx.lineWidth = 0.5;

    }    ctx.stroke();

  }

    // Shine

  // ============================================================================    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

  // RENDER LOGIC    ctx.beginPath();

  // ============================================================================    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);

  function _render() {    ctx.fill();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Background with gradient  }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);

    bgGrad.addColorStop(0, '#87ceeb');  // Draw crystal

    bgGrad.addColorStop(1, '#2d5016');  function drawCrystal(ctx, x, y, r, hue) {

    ctx.fillStyle = bgGrad;    ctx.save();

    ctx.fillRect(0, 0, canvas.width, canvas.height);    ctx.translate(x * pixelRatio, y * pixelRatio);



    ctx.save();    const grad = ctx.createLinearGradient(0, -r * 1.5, 0, r * 1.5);

    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);    grad.addColorStop(0, `hsl(${hue}, 100%, 70%)`);

    grad.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);

    // Draw platforms    grad.addColorStop(1, `hsl(${hue}, 100%, 40%)`);

    for (const p of platforms) {

      ctx.fillStyle = '#8b7355';    ctx.fillStyle = grad;

      ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);    ctx.beginPath();

          ctx.moveTo(0, -r * 1.5);

      ctx.fillStyle = '#654321';    ctx.lineTo(r * 0.6, -r * 0.5);

      ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);    ctx.lineTo(r, r * 0.5);

          ctx.lineTo(0, r * 1.5);

      ctx.strokeStyle = '#a0826d';    ctx.lineTo(-r, r * 0.5);

      ctx.lineWidth = 1;    ctx.lineTo(-r * 0.6, -r * 0.5);

      ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);    ctx.closePath();

    }    ctx.fill();



    // Draw coins    ctx.strokeStyle = `hsl(${hue}, 100%, 30%)`;

    for (const coin of coins) {    ctx.lineWidth = 0.5;

      if (!coin.collected) {    ctx.stroke();

        drawCoin(ctx, coin.x, coin.y, coin.r);

      }    // Sparkle

    }    ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;

    ctx.lineWidth = 1;

    // Draw crystals    ctx.beginPath();

    for (const crystal of crystals) {    ctx.moveTo(0, -r * 1.2);

      if (!crystal.collected) {    ctx.lineTo(0, r * 1.2);

        drawCrystal(ctx, crystal.x, crystal.y, crystal.r, crystal.hue);    ctx.moveTo(-r * 0.8, 0);

      }    ctx.lineTo(r * 0.8, 0);

    }    ctx.stroke();



    // Draw player    ctx.restore();

    drawPlayer(ctx, player);  }



    ctx.restore();  // Draw player (kid character)

  function drawPlayer(ctx, pl) {

    // Draw HUD    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';    ctx.translate(pl.x * pixelRatio, pl.y * pixelRatio);

    ctx.fillRect(0, 0, 350 * PIXEL_RATIO, 90 * PIXEL_RATIO);

        const w = pl.w;

    ctx.fillStyle = '#fff';    const h = pl.h;

    ctx.font = `bold ${16 * PIXEL_RATIO}px Arial`;

    ctx.textBaseline = 'top';    // Shadow

    ctx.fillText(`Score: ${score}`, 16 * PIXEL_RATIO, 12 * PIXEL_RATIO);    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';

    ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16 * PIXEL_RATIO, 36 * PIXEL_RATIO);    ctx.beginPath();

        ctx.ellipse(w / 2, h + 2, w * 0.6, h * 0.12, 0, 0, Math.PI * 2);

    if (player.speedBoostActive) {    ctx.fill();

      ctx.fillStyle = '#ff6b6b';

      ctx.font = `bold ${14 * PIXEL_RATIO}px Arial`;    // Head (large for kid)

      ctx.fillText(`⚡ SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, 16 * PIXEL_RATIO, 60 * PIXEL_RATIO);    const headR = w * 0.6;

    }    ctx.fillStyle = '#ffcc99';

    ctx.beginPath();

    // Draw controls at bottom    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI * 2);

    ctx.fillStyle = '#aaa';    ctx.fill();

    ctx.font = `${12 * PIXEL_RATIO}px Arial`;

    ctx.fillText('ARROWS/WASD - Move | SPACE/W - Jump', 16 * PIXEL_RATIO, height - 24 * PIXEL_RATIO);    // Hair (brown)

    ctx.fillStyle = '#d4a574';

    // Draw win screen    ctx.beginPath();

    if (gameWon) {    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';    ctx.fill();

      ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Hair tufts

      ctx.fillStyle = '#00ff00';    ctx.beginPath();

      ctx.font = `bold ${60 * PIXEL_RATIO}px Arial`;    ctx.arc(w / 2 - headR * 0.5, h * 0, headR * 0.4, 0, Math.PI * 2);

      ctx.textAlign = 'center';    ctx.fill();

      ctx.textBaseline = 'middle';    ctx.beginPath();

      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50 * PIXEL_RATIO);    ctx.arc(w / 2 + headR * 0.5, h * 0, headR * 0.4, 0, Math.PI * 2);

          ctx.fill();

      ctx.fillStyle = '#ffff00';

      ctx.font = `${28 * PIXEL_RATIO}px Arial`;    // Eyes (big and cute)

      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30 * PIXEL_RATIO);    ctx.fillStyle = '#fff';

          ctx.beginPath();

      ctx.fillStyle = '#ffffff';    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);

      ctx.font = `${16 * PIXEL_RATIO}px Arial`;    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);

      ctx.fillText('Refresh page to play again', canvas.width / 2, canvas.height / 2 + 80 * PIXEL_RATIO);    ctx.fill();

    }

  }    // Pupils

    ctx.fillStyle = '#1a1a1a';

  // ============================================================================    ctx.beginPath();

  // DRAWING FUNCTIONS    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.1, 0, Math.PI * 2);

  // ============================================================================    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.1, 0, Math.PI * 2);

    ctx.fill();

  function drawCoin(ctx, x, y, r) {

    ctx.save();    // Blush

    ctx.translate(x, y);    ctx.fillStyle = 'rgba(255, 170, 180, 0.6)';

    ctx.beginPath();

    const grad = ctx.createLinearGradient(-r, -r, r, r);    ctx.arc(w / 2 - headR * 0.5, h * 0.12, headR * 0.15, 0, Math.PI * 2);

    grad.addColorStop(0, '#ffd700');    ctx.arc(w / 2 + headR * 0.5, h * 0.12, headR * 0.15, 0, Math.PI * 2);

    grad.addColorStop(0.5, '#ffed4e');    ctx.fill();

    grad.addColorStop(1, '#ccaa00');

    // Smile

    ctx.fillStyle = grad;    ctx.strokeStyle = '#cc6666';

    ctx.beginPath();    ctx.lineWidth = 1;

    ctx.arc(0, 0, r, 0, Math.PI * 2);    ctx.beginPath();

    ctx.fill();    ctx.arc(w / 2, h * 0.22, headR * 0.12, 0, Math.PI);

    ctx.stroke();

    ctx.strokeStyle = '#cc8800';

    ctx.lineWidth = 0.5;    // Body (pink shirt)

    ctx.stroke();    ctx.fillStyle = '#ff69b4';

    ctx.fillRect(w * 0.08, h * 0.48, w * 0.84, h * 0.32);

    // Shine effect

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';    // Shorts (blue)

    ctx.beginPath();    ctx.fillStyle = '#4a90e2';

    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);    ctx.fillRect(w * 0.12, h * 0.78, w * 0.76, h * 0.15);

    ctx.fill();

    // Arms with animation

    ctx.restore();    ctx.strokeStyle = '#ffcc99';

  }    ctx.lineWidth = 2.5;

    ctx.lineCap = 'round';

  function drawCrystal(ctx, x, y, r, hue) {

    ctx.save();    const armSwing = Math.sin(pl.walkTimer) * 6 * (Math.abs(pl.vx) / pl.speed);

    ctx.translate(x, y);    ctx.beginPath();

    ctx.moveTo(w * 0.1, h * 0.55);

    // Gradient fill    ctx.lineTo(w * 0.02 + armSwing, h * 0.65);

    const grad = ctx.createLinearGradient(0, -r * 1.5, 0, r * 1.5);    ctx.stroke();

    grad.addColorStop(0, `hsl(${hue}, 100%, 70%)`);

    grad.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);    ctx.beginPath();

    grad.addColorStop(1, `hsl(${hue}, 100%, 40%)`);    ctx.moveTo(w * 0.9, h * 0.55);

    ctx.lineTo(w * 0.98 - armSwing, h * 0.65);

    ctx.fillStyle = grad;    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(0, -r * 1.5);    // Legs with animation

    ctx.lineTo(r * 0.6, -r * 0.5);    const legSwing = Math.sin(pl.walkTimer) * 4 * (Math.abs(pl.vx) / pl.speed);

    ctx.lineTo(r, r * 0.5);    ctx.beginPath();

    ctx.lineTo(0, r * 1.5);    ctx.moveTo(w * 0.3, h * 0.92);

    ctx.lineTo(-r, r * 0.5);    ctx.lineTo(w * 0.3 + legSwing, h * 1.08);

    ctx.lineTo(-r * 0.6, -r * 0.5);    ctx.stroke();

    ctx.closePath();

    ctx.fill();    ctx.beginPath();

    ctx.moveTo(w * 0.7, h * 0.92);

    ctx.strokeStyle = `hsl(${hue}, 100%, 30%)`;    ctx.lineTo(w * 0.7 - legSwing, h * 1.08);

    ctx.lineWidth = 0.5;    ctx.stroke();

    ctx.stroke();

    // Shoes

    // Sparkle effect    ctx.fillStyle = '#333';

    ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;    ctx.beginPath();

    ctx.lineWidth = 1;    ctx.ellipse(w * 0.3, h * 1.08, 2.5, 1.5, 0, 0, Math.PI * 2);

    ctx.beginPath();    ctx.ellipse(w * 0.7, h * 1.08, 2.5, 1.5, 0, 0, Math.PI * 2);

    ctx.moveTo(0, -r * 1.2);    ctx.fill();

    ctx.lineTo(0, r * 1.2);

    ctx.moveTo(-r * 0.8, 0);    // Speed boost glow

    ctx.lineTo(r * 0.8, 0);    if (pl.speedBoostActive) {

    ctx.stroke();      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';

      ctx.lineWidth = 2;

    ctx.restore();      ctx.beginPath();

  }      ctx.arc(w / 2, h / 2, Math.max(w, h) / 1.5, 0, Math.PI * 2);

      ctx.stroke();

  function drawPlayer(ctx, pl) {    }

    ctx.save();

    ctx.translate(pl.x, pl.y);    ctx.restore();

  }

    const w = pl.w;})();
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

    // Hair tufts
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

    // Pupils
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

    // Arms with animation
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

    // Legs with animation
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