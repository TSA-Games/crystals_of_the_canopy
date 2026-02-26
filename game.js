// Crystals of the Canopy - Perfect Platformer Game
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const fpsEl = document.getElementById('fps');
  const stateEl = document.getElementById('state');

  let width = 800;
  let height = 600;
  const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    width = Math.max(320, window.innerWidth);
    height = Math.max(240, window.innerHeight);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  resize();

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Player object - Kid character
  const player = {
    x: 40,
    y: 200,
    w: 24,
    h: 32,
    vx: 0,
    vy: 0,
    speed: 200,
    jumpPower: 350,
    gravity: 1000,
    friction: 0.85,
    onGround: false,
    walkTimer: 0,
    speedBoostActive: false,
    speedBoostTimer: 0,
    speedBoostMultiplier: 2
  };

  const platforms = [];
  const crystals = [];
  const coins = [];
  
  const RESET_ZONE_Y = 600; // If player falls below this, reset
  const WIN_X = width - 60; // Win when reaching right side

  let score = 0;
  let coinsCollected = 0;
  let gameWon = false;
  let totalCoins = 0;

  function _initGame() {
    platforms.length = 0;
    crystals.length = 0;
    coins.length = 0;
    
    // Create 6 bridges spanning the screen width
    const bridgeWidth = 140;
    const bridgeHeight = 12;
    const spacing = width / 6.5;
    
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * spacing;
      const y = 150 + i * 60; // Increasing height for challenge
      platforms.push({ x, y, w: bridgeWidth, h: bridgeHeight });
    }
    
    // Spawn collectibles
    _spawnPickups();
  }

  function _spawnPickups() {
    crystals.length = 0;
    coins.length = 0;
    
    // Place coins and crystals on or near platforms
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      
      // 2 coins per platform
      for (let j = 0; j < 2; j++) {
        const offset = -60 + j * 60;
        coins.push({
          x: p.x + offset,
          y: p.y - 25,
          r: 6,
          collected: false
        });
      }
      
      // 1-2 crystals per platform
      if (i % 2 === 0) {
        crystals.push({
          x: p.x + (i % 2 ? 40 : -40),
          y: p.y - 35,
          r: 8,
          hue: 180 + i * 30,
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
    player.speedBoostActive = false;
    player.speedBoostTimer = 0;
    score = 0;
    coinsCollected = 0;
    gameWon = false;
    _spawnPickups();
  }

  _initGame();
  _resetPlayer();

  // Main game loop
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.016, (now - lastTime) / 1000);
    lastTime = now;
    _update(dt);
    _render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function _update(dt) {
    // Input handling
    const moveLeft = keys['ArrowLeft'] || keys['a'];
    const moveRight = keys['ArrowRight'] || keys['d'];
    const jumpKey = keys['ArrowUp'] || keys['w'] || keys[' '];

    // Horizontal movement with friction
    if (moveRight && !moveLeft) {
      player.vx = player.speed * (player.speedBoostActive ? player.speedBoostMultiplier : 1);
    } else if (moveLeft && !moveRight) {
      player.vx = -player.speed * (player.speedBoostActive ? player.speedBoostMultiplier : 1);
    } else {
      player.vx *= player.friction;
      if (Math.abs(player.vx) < 5) player.vx = 0;
    }

    // Apply gravity
    if (!player.onGround) {
      player.vy += player.gravity * dt;
      if (player.vy > 400) player.vy = 400; // Terminal velocity
    }

    // Store previous position for collision detection
    const prevY = player.y;
    
    // Update position
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Constrain to screen width
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Platform collision detection
    player.onGround = false;
    
    for (const platform of platforms) {
      const platformLeft = platform.x - platform.w / 2;
      const platformRight = platform.x + platform.w / 2;
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.h;

      const playerLeft = player.x;
      const playerRight = player.x + player.w;
      const playerTop = player.y;
      const playerBottom = player.y + player.h;

      // Check horizontal overlap
      if (playerRight > platformLeft && playerLeft < platformRight) {
        // Check landing from above
        if (prevY + player.h <= platformTop && playerBottom >= platformTop && player.vy >= 0) {
          player.y = platformTop - player.h;
          player.vy = 0;
          player.onGround = true;
        }
        // Check hitting from below
        else if (prevY >= platformBottom && playerTop <= platformBottom && player.vy < 0) {
          player.y = platformBottom;
          player.vy = 0;
        }
      }
    }

    // Jump
    if (jumpKey && player.onGround) {
      player.vy = -player.jumpPower;
      player.onGround = false;
    }

    // Speed boost timer
    if (player.speedBoostActive) {
      player.speedBoostTimer -= dt;
      if (player.speedBoostTimer <= 0) {
        player.speedBoostActive = false;
        player.speedBoostTimer = 0;
      }
    }

    // Update walk animation
    if (Math.abs(player.vx) > 10 && player.onGround) {
      player.walkTimer += dt * 8;
    } else {
      player.walkTimer += dt * 2;
    }

    // Collect coins
    for (const coin of coins) {
      if (!coin.collected) {
        const dx = coin.x - (player.x + player.w / 2);
        const dy = coin.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < coin.r + 12) {
          coin.collected = true;
          coinsCollected++;
          score += 10;
        }
      }
    }

    // Collect crystals
    for (const crystal of crystals) {
      if (!crystal.collected) {
        const dx = crystal.x - (player.x + player.w / 2);
        const dy = crystal.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < crystal.r + 12) {
          crystal.collected = true;
          player.speedBoostActive = true;
          player.speedBoostTimer = 4;
          score += 25;
        }
      }
    }

    // Check fall
    if (player.y > RESET_ZONE_Y) {
      _resetPlayer();
      return;
    }

    // Check win condition
    if (coinsCollected === totalCoins && player.x > WIN_X) {
      gameWon = true;
    }
  }

  function _render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#87ceeb');
    bgGrad.addColorStop(1, '#2d5016');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    // Draw platforms (brown bridges)
    for (const p of platforms) {
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
      
      // Platform shadow
      ctx.fillStyle = '#654321';
      ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);
      
      // Platform detail
      ctx.strokeStyle = '#a0826d';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);
    }

    // Draw coins (yellow circles)
    for (const coin of coins) {
      if (!coin.collected) {
        drawCoin(ctx, coin.x, coin.y, coin.r);
      }
    }

    // Draw crystals (cyan sparkling gems)
    for (const crystal of crystals) {
      if (!crystal.collected) {
        drawCrystal(ctx, crystal.x, crystal.y, crystal.r, crystal.hue);
      }
    }

    // Draw player
    drawPlayer(ctx, player);

    ctx.restore();

    // Draw HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 300 * pixelRatio, 80 * pixelRatio);
    
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${16 * pixelRatio}px Arial`;
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 16 * pixelRatio, 12 * pixelRatio);
    ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16 * pixelRatio, 36 * pixelRatio);
    
    if (player.speedBoostActive) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = `bold ${14 * pixelRatio}px Arial`;
      ctx.fillText(`⚡ SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, 16 * pixelRatio, 60 * pixelRatio);
    }

    // Draw controls
    ctx.fillStyle = '#aaa';
    ctx.font = `${12 * pixelRatio}px Arial`;
    ctx.fillText('ARROW KEYS/WASD - Move | SPACE/W - Jump', 16 * pixelRatio, height - 24 * pixelRatio);

    // Draw win screen
    if (gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff00';
      ctx.font = `bold ${60 * pixelRatio}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 40 * pixelRatio);
      
      ctx.fillStyle = '#ffff00';
      ctx.font = `${28 * pixelRatio}px Arial`;
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40 * pixelRatio);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `${16 * pixelRatio}px Arial`;
      ctx.fillText('Refresh page to play again', canvas.width / 2, canvas.height / 2 + 80 * pixelRatio);
    }
  }

  // Draw coin
  function drawCoin(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x * pixelRatio, y * pixelRatio);

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

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw crystal
  function drawCrystal(ctx, x, y, r, hue) {
    ctx.save();
    ctx.translate(x * pixelRatio, y * pixelRatio);

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

    // Sparkle
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

  // Draw player (kid character)
  function drawPlayer(ctx, pl) {
    ctx.save();
    ctx.translate(pl.x * pixelRatio, pl.y * pixelRatio);

    const w = pl.w;
    const h = pl.h;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w * 0.6, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (large for kid)
    const headR = w * 0.6;
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.08, headR, 0, Math.PI * 2);
    ctx.fill();

    // Hair (brown)
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

    // Eyes (big and cute)
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

    // Body (pink shirt)
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(w * 0.08, h * 0.48, w * 0.84, h * 0.32);

    // Shorts (blue)
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(w * 0.12, h * 0.78, w * 0.76, h * 0.15);

    // Arms with animation
    ctx.strokeStyle = '#ffcc99';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const armSwing = Math.sin(pl.walkTimer) * 6 * (Math.abs(pl.vx) / pl.speed);
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.55);
    ctx.lineTo(w * 0.02 + armSwing, h * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.9, h * 0.55);
    ctx.lineTo(w * 0.98 - armSwing, h * 0.65);
    ctx.stroke();

    // Legs with animation
    const legSwing = Math.sin(pl.walkTimer) * 4 * (Math.abs(pl.vx) / pl.speed);
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