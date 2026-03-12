// Crystals of the Canopy - Professional Platformer Game (patched)
// Corrected: removed background image, fixed brace, added Level 3

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
  const PLATFORM_HEIGHT = 14;
  const COIN_POINTS = 10;
  const CRYSTAL_POINTS = 25;

  // ============================================================================
  // CANVAS & RENDERING
  // ============================================================================
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Load forest background image
  // Load new PNG background image
  const forestBg = new Image();
  forestBg.src = 'images/Untitled design.png';

  let width = 800;
  let height = 600;
  const PIXEL_RATIO = Math.max(1, window.devicePixelRatio || 1);

  function resizeCanvas(shouldInit = true) {
    const newWidth = Math.max(320, window.innerWidth);
    const newHeight = Math.max(240, window.innerHeight);

    const sizeChanged = newWidth !== width || newHeight !== height;
    width = newWidth;
    height = newHeight;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * PIXEL_RATIO);
    canvas.height = Math.floor(height * PIXEL_RATIO);
    ctx.imageSmoothingEnabled = false;

    if (shouldInit && sizeChanged) {
      _initGame();
      _resetPlayer();
    }
  }

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.code) keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.code) keys[e.code] = false;
  });

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
  const magnets = [];

  let score = 0;
  let coinsCollected = 0;
  let totalCoins = 0;
  let gameWon = false;
  let currentLevel = 1;

  // Level 6 timer
  let level6Timer = 10;
  const LEVEL6_TIME_LIMIT = 10;

  // Flash transition state
  let flashTransitionActive = false;
  let flashTransitionTimer = 0;
  let flashTransitionNextLevel = null;

  // Woosh sound effect
  const wooshSound = new Audio('sounds/woosh.mp3');
  wooshSound.volume = 0.7;

  // ============================================================================
  // GAME INITIALIZATION
  // ============================================================================
  function _initGame() {
    platforms.length = 0;
    crystals.length = 0;
    coins.length = 0;
    magnets.length = 0;
    const baseScale = width / 800;

  if (currentLevel === 1) {
      // Level 1: EASY - Wide, evenly spaced platforms with gentle slope
  platforms.push({ x: 80 * baseScale, y: 450, w: 140, h: PLATFORM_HEIGHT });
  platforms.push({ x: 200 * baseScale, y: 420, w: 140, h: PLATFORM_HEIGHT });
  platforms.push({ x: 320 * baseScale, y: 390, w: 140, h: PLATFORM_HEIGHT });
  platforms.push({ x: 440 * baseScale, y: 380, w: 140, h: PLATFORM_HEIGHT });
  platforms.push({ x: 560 * baseScale, y: 390, w: 140, h: PLATFORM_HEIGHT });
  platforms.push({ x: 680 * baseScale, y: 420, w: 140, h: PLATFORM_HEIGHT });
  // Magnets
  magnets.push({ x: 160 * baseScale, y: 410, r: 18 });
  magnets.push({ x: 600 * baseScale, y: 370, r: 18 });

  } else if (currentLevel === 2) {
      // Level 2: HARD - Smaller, tricky platforms with challenging gaps and heights
  platforms.push({ x: 60 * baseScale, y: 480, w: 115, h: PLATFORM_HEIGHT });
  platforms.push({ x: 160 * baseScale, y: 420, w: 95, h: PLATFORM_HEIGHT });
  platforms.push({ x: 240 * baseScale, y: 370, w: 105, h: PLATFORM_HEIGHT });
  platforms.push({ x: 340 * baseScale, y: 400, w: 85, h: PLATFORM_HEIGHT });
  platforms.push({ x: 420 * baseScale, y: 330, w: 100, h: PLATFORM_HEIGHT });
  platforms.push({ x: 520 * baseScale, y: 380, w: 90, h: PLATFORM_HEIGHT });
  platforms.push({ x: 600 * baseScale, y: 330, w: 95, h: PLATFORM_HEIGHT });
  platforms.push({ x: 700 * baseScale, y: 400, w: 110, h: PLATFORM_HEIGHT });
  platforms.push({ x: 770 * baseScale, y: 450, w: 115, h: PLATFORM_HEIGHT });
  // Magnets
  magnets.push({ x: 120 * baseScale, y: 470, r: 18 });
  magnets.push({ x: 680 * baseScale, y: 410, r: 18 });

  } else if (currentLevel === 3) {
      // Level 3: EXTREME - zig-zag, high jumps, varied widths
  platforms.push({ x: 60 * baseScale,  y: 520, w: 60,  h: PLATFORM_HEIGHT });   // Start, very narrow
  platforms.push({ x: 160 * baseScale, y: 350, w: 180, h: PLATFORM_HEIGHT });   // Huge jump up, very wide
  platforms.push({ x: 320 * baseScale, y: 500, w: 70,  h: PLATFORM_HEIGHT });   // Drop down, narrow
  platforms.push({ x: 420 * baseScale, y: 320, w: 120, h: PLATFORM_HEIGHT });   // Big jump up
  platforms.push({ x: 540 * baseScale, y: 480, w: 80,  h: PLATFORM_HEIGHT });   // Drop down
  platforms.push({ x: 640 * baseScale, y: 300, w: 100, h: PLATFORM_HEIGHT });   // Highest platform
  platforms.push({ x: 720 * baseScale, y: 420, w: 60,  h: PLATFORM_HEIGHT });   // Drop down, very narrow
  platforms.push({ x: 800 * baseScale, y: 350, w: 140, h: PLATFORM_HEIGHT });   // Final wide platform
  // Magnets
  magnets.push({ x: 320 * baseScale, y: 480, r: 18 });
  magnets.push({ x: 700 * baseScale, y: 340, r: 18 });
  } else if (currentLevel === 4) {
      // Level 4: IMPOSSIBLE - extreme gaps, heights, and narrow bridges
  platforms.push({ x: 50 * baseScale,  y: 540, w: 50,  h: PLATFORM_HEIGHT });   // Start, ultra-narrow
  platforms.push({ x: 200 * baseScale, y: 320, w: 60,  h: PLATFORM_HEIGHT });   // Huge jump up, narrow
  platforms.push({ x: 350 * baseScale, y: 520, w: 40,  h: PLATFORM_HEIGHT });   // Drop down, ultra-narrow
  platforms.push({ x: 500 * baseScale, y: 280, w: 80,  h: PLATFORM_HEIGHT });   // Highest platform, wide
  platforms.push({ x: 650 * baseScale, y: 500, w: 50,  h: PLATFORM_HEIGHT });   // Drop down, narrow
  platforms.push({ x: 800 * baseScale, y: 250, w: 60,  h: PLATFORM_HEIGHT });   // Final, highest, narrow
  // Magnets
  magnets.push({ x: 350 * baseScale, y: 500, r: 18 });
  magnets.push({ x: 800 * baseScale, y: 230, r: 18 });
  } else if (currentLevel === 5) {
      // Level 5: BLINKING - identical to Level 3, but platforms blink
      platforms.push({ x: 60 * baseScale,  y: 520, w: 60,  h: PLATFORM_HEIGHT });
      platforms.push({ x: 160 * baseScale, y: 350, w: 180, h: PLATFORM_HEIGHT });
      platforms.push({ x: 320 * baseScale, y: 500, w: 70,  h: PLATFORM_HEIGHT });
      platforms.push({ x: 420 * baseScale, y: 320, w: 120, h: PLATFORM_HEIGHT });
      platforms.push({ x: 540 * baseScale, y: 480, w: 80,  h: PLATFORM_HEIGHT });
      platforms.push({ x: 640 * baseScale, y: 300, w: 100, h: PLATFORM_HEIGHT });
      platforms.push({ x: 720 * baseScale, y: 420, w: 60,  h: PLATFORM_HEIGHT });
      platforms.push({ x: 800 * baseScale, y: 350, w: 140, h: PLATFORM_HEIGHT });
      // Magnets
      magnets.push({ x: 160 * baseScale, y: 340, r: 18 });
      magnets.push({ x: 800 * baseScale, y: 330, r: 18 });
    } else if (currentLevel === 6) {
      // Level 6: Timed challenge - reach end in 10 seconds
      platforms.push({ x: 80 * baseScale, y: 500, w: 120, h: PLATFORM_HEIGHT });
      platforms.push({ x: 220 * baseScale, y: 420, w: 80, h: PLATFORM_HEIGHT });
      platforms.push({ x: 340 * baseScale, y: 480, w: 100, h: PLATFORM_HEIGHT });
      platforms.push({ x: 480 * baseScale, y: 400, w: 120, h: PLATFORM_HEIGHT });
      platforms.push({ x: 620 * baseScale, y: 470, w: 90, h: PLATFORM_HEIGHT });
      platforms.push({ x: 720 * baseScale, y: 350, w: 140, h: PLATFORM_HEIGHT });
      // Magnets
      magnets.push({ x: 220 * baseScale, y: 410, r: 18 });
      // Speed boost crystals
      crystals.length = 0;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        const crystalOffset = (i % 2 === 0) ? -40 : 40;
        const crystalX = Math.max(20, Math.min(width - 20, p.x + crystalOffset));
        crystals.push({
          x: crystalX,
          y: p.y - 40,
          r: 8,
          hue: (180 + i * 15) % 360,
          collected: false
        });
      }
      // Timer reset
      level6Timer = LEVEL6_TIME_LIMIT;
    }

  platforms.sort((a, b) => a.x - b.x);
  _spawnPickups();
  }

  function _spawnPickups() {
    if (currentLevel !== 6) {
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
        const crystalOffset = (i % 2 === 0) ? -40 : 40;
        const crystalX = Math.max(20, Math.min(width - 20, p.x + crystalOffset));
        crystals.push({
          x: crystalX,
          y: p.y - 40,
          r: 8,
          hue: (180 + i * 15) % 360,
          collected: false
        });
      }
    } else {
      coins.length = 0;
      // Level 6: coins only, crystals already spawned in _initGame
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
    coinsCollected = 0;
    gameWon = false;
    _spawnPickups();
    if (currentLevel === 6) {
      level6Timer = LEVEL6_TIME_LIMIT;
    }
  }

  // Initialize once, then hook resize
  resizeCanvas(false); // set canvas size without reinitializing game yet
  _initGame();
  _resetPlayer();
  window.addEventListener('resize', () => resizeCanvas(true));

  // ============================================================================
  // GAME LOOP
  // ============================================================================
  let lastTime = performance.now();
  function gameLoop(now) {
    const rawDt = (now - lastTime) / 1000;
    const dt = Math.min(0.05, rawDt);
    lastTime = now;
    if (flashTransitionActive) {
      flashTransitionTimer += dt;
      if (flashTransitionTimer >= 0.7) {
        // End flash, start next level
        flashTransitionActive = false;
        flashTransitionTimer = 0;
        if (flashTransitionNextLevel !== null) {
          if (flashTransitionNextLevel <= 6) {
            currentLevel = flashTransitionNextLevel;
            gameWon = false;
            _resetPlayer();
            _initGame();
          } else {
            gameWon = true;
          }
          flashTransitionNextLevel = null;
        }
      }
    } else {
      _update(dt);
    }
    _render();
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // ============================================================================
  // UPDATE LOGIC
  // ============================================================================
  function _update(dt) {
    if (flashTransitionActive) return; // Pause gameplay during flash
    const moveLeft = keys['ArrowLeft'] || keys['a'];
    const moveRight = keys['ArrowRight'] || keys['d'];
    const jumpKey = keys['ArrowUp'] || keys['w'] || keys['Space'] || keys['Spacebar'] || keys[' '];

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

    if (!player.onGround) {
      player.vy += GRAVITY * dt;
      if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY;
      player.coyoteCounter -= dt;
    } else {
      player.coyoteCounter = COYOTE_TIME;
    }

    player.jumpBufferCounter -= dt;
    if (jumpKey) {
      player.jumpBufferCounter = JUMP_BUFFER_TIME;
    }

    if (player.jumpBufferCounter > 0 && player.coyoteCounter > 0) {
      const jumpPower = player.speedBoostActive ? JUMP_POWER * SPEED_BOOST_MULTIPLIER : JUMP_POWER;
      player.vy = -jumpPower;
      player.onGround = false;
      player.coyoteCounter = 0;
      player.jumpBufferCounter = 0;
    }

    const prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(0, Math.min(width - player.w, player.x));

    player.onGround = false;
    for (const platform of platforms) {
      _checkPlatformCollision(platform, prevY);
    }

    if (player.speedBoostActive) {
      player.speedBoostTimer -= dt;
      if (player.speedBoostTimer <= 0) {
        player.speedBoostActive = false;
        player.speedBoostTimer = 0;
      }
    }

    if (Math.abs(player.vx) > 5 && player.onGround) {
      player.walkTimer += dt * 8;
    } else {
      player.walkTimer += dt * 2;
    }

    // Level 6 timer logic
    if (currentLevel === 6 && !gameWon) {
      level6Timer -= dt;
      if (level6Timer <= 0) {
        _resetPlayer();
        return;
      }
    }
    // Magnet attraction for coins
    for (const coin of coins) {
      if (!coin.collected) {
        let attracted = false;
        for (const magnet of magnets) {
          const dist = Math.hypot(coin.x - magnet.x, coin.y - magnet.y);
          if (dist < 120) {
            // Move coin toward magnet
            const angle = Math.atan2(magnet.y - coin.y, magnet.x - coin.x);
            coin.x += Math.cos(angle) * 2.5 * dt * (120 - dist) / 120;
            coin.y += Math.sin(angle) * 2.5 * dt * (120 - dist) / 120;
            attracted = true;
          }
        }
        const dx = coin.x - (player.x + player.w / 2);
        const dy = coin.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < coin.r + 14) {
          coin.collected = true;
          coinsCollected++;
          score += COIN_POINTS;
        }
      }
    }

    for (const crystal of crystals) {
      if (!crystal.collected) {
        // Move crystals in Level 6
        if (currentLevel === 6 && crystal.moving) {
          crystal.x = 200 + 150 * (crystal.movePhase + Math.sin(performance.now() / 1000 + crystal.movePhase));
          crystal.y = 350 + 60 * Math.sin(performance.now() / 1000 + crystal.movePhase);
        }
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

    if (player.y > height + 100) {
      _resetPlayer();
      return;
    }
    // Level 6 timer logic
    if (currentLevel === 6 && !gameWon) {
      level6Timer -= dt;
      if (level6Timer <= 0) {
        _resetPlayer();
        level6Timer = LEVEL6_TIME_LIMIT;
        return;
      }
    }

    // Win/Level progression
    // Find the rightmost platform
    const lastPlatform = platforms.reduce((max, p) => p.x > max.x ? p : max, platforms[0]);
    // Check if player is standing on the last platform
    const pLeft = lastPlatform.x - lastPlatform.w / 2;
    const pRight = lastPlatform.x + lastPlatform.w / 2;
    const playerBottom = player.y + player.h;
    const onLastPlatform =
      player.x + player.w / 2 > pLeft &&
      player.x - player.w / 2 < pRight &&
      Math.abs(playerBottom - lastPlatform.y) < 8 && player.vy >= 0;

    if (onLastPlatform && !gameWon) {
      if (currentLevel < 6) {
        // Start flash transition to next level
        flashTransitionActive = true;
        flashTransitionTimer = 0;
        flashTransitionNextLevel = currentLevel + 1;
        // Play woosh sound
        if (wooshSound) {
          wooshSound.currentTime = 0;
          wooshSound.play();
        }
      } else if (currentLevel === 6) {
        // Start flash transition to YOU WIN
        flashTransitionActive = true;
        flashTransitionTimer = 0;
        flashTransitionNextLevel = 7;
        // Play woosh sound
        if (wooshSound) {
          wooshSound.currentTime = 0;
          wooshSound.play();
        }
      }
    }
  } // end of _update

  function _checkPlatformCollision(platform, prevY) {
    const pLeft = platform.x - platform.w / 2;
    const pRight = platform.x + platform.w / 2;
    const pTop = platform.y;
    const pBottom = platform.y + platform.h;

    const plLeft = player.x;
    const plRight = player.x + player.w;
    const plTop = player.y;
    const plBottom = player.y + player.h;

    if (plRight <= pLeft || plLeft >= pRight) return;

    if (prevY + player.h <= pTop && plBottom >= pTop && player.vy >= 0) {
      player.y = pTop - player.h;
      player.vy = 0;
      player.onGround = true;
      return;
    }

    if (prevY >= pBottom && plTop <= pBottom && player.vy < 0) {
      player.y = pBottom;
      player.vy = 0.1;
      return;
    }

    const overlapLeft = plRight - pLeft;
    const overlapRight = pRight - plLeft;
    const overlapTop = plBottom - pTop;
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
    // Clear full canvas (pixel ratio aware)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw forest background image if loaded, otherwise fallback to blue
    if (forestBg.complete && forestBg.naturalWidth > 0) {
      ctx.drawImage(forestBg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#4da6ff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

    // Draw platforms
    let blinkOn = true;
    if (currentLevel === 5) {
      // Blink platforms: on for 0.5s, off for 0.5s
      const blinkPeriod = 1.0; // seconds
      const blinkTime = (performance.now() / 1000) % blinkPeriod;
      blinkOn = blinkTime < blinkPeriod / 2;
    }
    for (const p of platforms) {
      if (currentLevel !== 5 || blinkOn) {
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
        ctx.fillStyle = '#654321';
        ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);
        ctx.strokeStyle = '#a0826d';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);
      }
    }
    // Draw magnets
    for (const magnet of magnets) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(magnet.x, magnet.y, magnet.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3333';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
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
    ctx.fillRect(0, 0, 350, 110);

    ctx.fillStyle = '#fff';
    ctx.font = `bold 16px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillText(`Level: ${currentLevel}`, 16, 12);
    ctx.fillText(`Score: ${score}`, 16, 32);
    ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16, 52);
    if (currentLevel === 6 && !gameWon) {
      ctx.fillStyle = '#ff3333';
      ctx.font = `bold 18px Arial`;
      ctx.fillText(`Time Left: ${level6Timer.toFixed(1)}s`, 16, 72);
    }

    if (player.speedBoostActive) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = `bold 14px Arial`;
      ctx.fillText(`⚡ SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, 16, 76);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = `12px Arial`;
    ctx.fillText('ARROWS/WASD - Move | SPACE/W - Jump', 16, height - 24);

    if (gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff00';
      ctx.font = `bold 60px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!!', width / 2, height / 2 - 50);

      ctx.fillStyle = '#ffff00';
      ctx.font = `28px Arial`;
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = `16px Arial`;
      ctx.fillText('Refresh to play again', width / 2, height / 2 + 80);
    }

    // Flash transition overlay
    if (flashTransitionActive) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.abs(Math.sin(Math.PI * flashTransitionTimer / 0.7)) * 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
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
    ctx.fillStyle = '#8b6f47';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI);
    ctx.fill();

    // Hair spikes
    ctx.fillStyle = '#8b6f47';
    ctx.beginPath();
    ctx.moveTo(w / 2 - headR * 0.4, h * -0.05);
    ctx.lineTo(w / 2 - headR * 0.3, h * -0.15);
    ctx.lineTo(w / 2 - headR * 0.1, h * -0.05);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2, h * -0.08);
    ctx.lineTo(w / 2 + headR * 0.05, h * -0.18);
    ctx.lineTo(w / 2 + headR * 0.2, h * -0.08);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2 + headR * 0.4, h * -0.05);
    ctx.lineTo(w / 2 + headR * 0.3, h * -0.15);
    ctx.lineTo(w / 2 + headR * 0.1, h * -0.05);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0055aa';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.12, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2 - headR * 0.3, h * 0.05, headR * 0.08, 0, Math.PI * 2);
    ctx.arc(w / 2 + headR * 0.3, h * 0.05, headR * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.22, headR * 0.1, 0, Math.PI);
    ctx.stroke();

    // Shirt
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(w * 0.08, h * 0.45, w * 0.84, h * 0.48);

    // Collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(w * 0.25, h * 0.45);
    ctx.lineTo(w / 2, h * 0.35);
    ctx.lineTo(w * 0.75, h * 0.45);
    ctx.closePath();
    ctx.fill();

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
    ctx.strokeStyle = '#ffcc99';
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

  // ==========================================================================
  // BACKDOOR: Type '0315' to skip level with max points
  // ==========================================================================
  const keyBuffer = [];
  window.addEventListener('keydown', (e) => {
    // Only allow digits for the cheat
    if (/^[0-9]$/.test(e.key)) {
      keyBuffer.push(e.key);
      if (keyBuffer.length > 4) keyBuffer.shift();
      if (keyBuffer.join('') === '0315') {
        _cheatSkipLevel();
        keyBuffer.length = 0;
      }
    } else {
      // Clear buffer on any non-digit key
      keyBuffer.length = 0;
    }
  });

  function _cheatSkipLevel() {
    // Mark all coins and crystals as collected and add their points
    let coinsToAdd = 0;
    let crystalsToAdd = 0;
    for (const coin of coins) {
      if (!coin.collected) {
        coin.collected = true;
        coinsToAdd++;
      }
    }
    for (const crystal of crystals) {
      if (!crystal.collected) {
        crystal.collected = true;
        crystalsToAdd++;
      }
    }
    score += coinsToAdd * COIN_POINTS + crystalsToAdd * CRYSTAL_POINTS;
    coinsCollected += coinsToAdd;

    // Instantly move to next level or win
    if (currentLevel < 5) {
      currentLevel++;
      gameWon = false;
      _resetPlayer();
      _initGame();
    } else {
      gameWon = true;
    }
  }

})();
