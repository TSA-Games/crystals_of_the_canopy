// Clean, self-contained canvas game script
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

  // World
  const player = {
    x: 400,
    y: 300,
    w: 28,
    h: 40,
    vx: 0,
    vy: 0,
    speed: 260,
    jumpSpeed: 820, // higher jump
    gravity: 2200,
    friction: 8,
    onGround: false,
    walkTimer: 0,
  };

  const groundY = 900; // world coordinate of the flat ground - INSTANT RESET ZONE
  const platforms = [];
  const crystals = [];
  const coins = [];
  const levelEndX = 9300; // winning x position (end of last bridge)

  let score = 0;
  let coinsCollected = 0;
  let gameWon = false;
  let justReset = false;

  function _resetGame() {
    player.x = 400;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    score = 0;
    coinsCollected = 0;
    gameWon = false;
    justReset = true;
    _spawnPickups(14, 10);
  }

  function _spawnPlatforms() {
    platforms.length = 0;
    // NO GROUND PLATFORM - falling to groundY means instant reset!
    // Bridge platforms span across the whole scene horizontally
    platforms.push({ x: 600, y: groundY - 120, w: 1200, h: 16 });   // Start bridge - spans across
    platforms.push({ x: 1800, y: groundY - 180, w: 1300, h: 16 });  // Second bridge - spans across
    platforms.push({ x: 3200, y: groundY - 140, w: 1400, h: 16 });  // Third bridge - spans across
    platforms.push({ x: 4800, y: groundY - 220, w: 1200, h: 16 });  // Fourth bridge - spans across
    platforms.push({ x: 6300, y: groundY - 160, w: 1300, h: 16 });  // Fifth bridge - spans across
    platforms.push({ x: 7900, y: groundY - 240, w: 1400, h: 16 });  // Final bridge to win - spans across
  }

  function _spawnPickups(nCrystals = 12, nCoins = 8) {
    crystals.length = 0;
    coins.length = 0;
    for (let i = 0; i < nCrystals; i++) {
      // place some crystals on platforms or floating
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      const x = (p.x - 200) + Math.random() * (p.w + 400);
      const y = (Math.random() < 0.7) ? p.y - 28 - Math.random() * 8 : groundY - 200 - Math.random() * 500;
      crystals.push({ x: x + Math.random() * 40 - 20, y: y + Math.random() * 10 - 5, r: 10 + Math.random() * 12, hue: Math.floor(Math.random() * 360) });
    }
    for (let i = 0; i < nCoins; i++) {
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      const x = p.x + 20 + Math.random() * Math.max(16, p.w - 40);
      const y = p.y - 18 - Math.random() * 6;
      coins.push({ x, y, r: 8 + Math.random() * 6 });
    }
  }

  _spawnPlatforms();
  _spawnPickups(14, 10);
  _resetGame();

  // helpers for world->screen
  function worldToScreen(wx, wy) {
    // simple camera centered on player
    const camX = player.x - width / 2;
    const camY = player.y - height / 2;
    return { x: Math.round((wx - camX) * pixelRatio), y: Math.round((wy - camY) * pixelRatio) };
  }

  // physics and update
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    _update(dt);
    _render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function _update(dt) {
    // input
    const left = keys.ArrowLeft || keys.a;
    const right = keys.ArrowRight || keys.d;
    const jump = keys.ArrowUp || keys.w || keys[' '];

    // horizontal
    if (left && !right) player.vx = -player.speed;
    else if (right && !left) player.vx = player.speed;
    else {
      player.vx *= Math.max(0, 1 - player.friction * dt);
      if (Math.abs(player.vx) < 1) player.vx = 0;
    }

    // jump
    if (jump && player.onGround) {
      player.vy = -player.jumpSpeed;
      player.onGround = false;
    }

    // gravity
    player.vy += player.gravity * dt;

    // integrate with prevY for platform collision detection
    const prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // platform collisions
    player.onGround = false;
    const halfH = player.h / 2;
    for (const p of platforms) {
      const top = p.y - p.h; // since platform stored with y as bottom for convenience
      // We'll treat p.y as the top of platform (we stored top earlier), but to be robust accept either
      const platTop = p.y - p.h >= 0 ? p.y - p.h : p.y; // fallback
      const platLeft = p.x - p.w / 2;
      const platRight = p.x + p.w / 2;
      // treat platform as rectangle at (p.x - p.w/2, p.y - p.h) width p.w height p.h
      const px = p.x - p.w / 2;
      const py = p.y - p.h;
      if (player.x + player.w / 2 > px && player.x - player.w / 2 < px + p.w) {
        // was above and now below or touching
        if (prevY + halfH <= py && player.y + halfH >= py) {
          player.y = py - halfH;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }

    // CHECK IF TOUCHED GROUND - INSTANT RESET!
    if (player.y + halfH > groundY) {
      _resetGame();
      return; // skip the rest of this update
    }

    // CHECK IF WON - REACHED THE END
    if (player.x > levelEndX && !gameWon) {
      gameWon = true;
    }

    // update walk timer for animation
    if (Math.abs(player.vx) > 1 && player.onGround) player.walkTimer += dt * (Math.abs(player.vx) / player.speed) * 8;
    else player.walkTimer += dt * 1.2; // idle breathing

    // collect crystals
    for (let i = crystals.length - 1; i >= 0; i--) {
      const c = crystals[i];
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      if (Math.hypot(dx, dy) < c.r + Math.max(player.w, player.h) / 2) {
        crystals.splice(i, 1);
        score += 5;
      }
    }

    // collect coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      const dx = c.x - player.x;
      const dy = c.y - player.y;
      if (Math.hypot(dx, dy) < c.r + Math.max(player.w, player.h) / 2) {
        coins.splice(i, 1);
        coinsCollected++;
        score += 10;
      }
    }

    // respawn pickups if cleared
    if (crystals.length + coins.length === 0) _spawnPickups(14, 10);

    // Clear reset flag after first frame
    justReset = false;
  }

  // rendering
  function _render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#7ec8ff');
    g.addColorStop(1, '#2b6b3b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // camera
    const camX = player.x - width / 2;
    const camY = player.y - height / 2;

    // draw platforms
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    ctx.translate(-camX, -camY);
    for (const p of platforms) {
      ctx.fillStyle = '#6b4b2b';
      ctx.fillRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
      ctx.fillStyle = '#533f2a';
      ctx.fillRect(p.x - p.w / 2, p.y - p.h + p.h, p.w, 3);
    }

    // draw crystals
    for (const c of crystals) drawCrystal(ctx, c.x, c.y, c.r, c.hue, pixelRatio);

    // draw coins
    for (const c of coins) drawCoin(ctx, c.x, c.y, c.r, pixelRatio);

    // draw player (human-ish) with simple limbs animation
    drawPlayer(ctx, player, pixelRatio);

    // HUD
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8 * pixelRatio, 8 * pixelRatio, 180 * pixelRatio, 40 * pixelRatio);
    ctx.fillStyle = '#fff';
    ctx.font = `${14 * pixelRatio}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText(`Score: ${score}`, 16 * pixelRatio, 28 * pixelRatio);
    ctx.fillText(`Coins: ${coinsCollected}`, 110 * pixelRatio, 28 * pixelRatio);

    // Draw WIN message
    if (gameWon) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff00';
      ctx.font = `bold ${80 * pixelRatio}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
      ctx.fillStyle = '#ffff00';
      ctx.font = `${32 * pixelRatio}px Arial`;
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 60 * pixelRatio);
    }

    ctx.restore();
  }

  // drawPlayer: more realistic human character with better proportions
  function drawPlayer(ctx, pl) {
    const s = worldToScreen(pl.x, pl.y);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pixelRatio, pixelRatio);

    const bodyW = pl.w;
    const bodyH = pl.h;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, bodyH / 2 + 4, bodyW * 0.95, bodyH * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headR = bodyW * 0.45;
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.35, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hair
    ctx.fillStyle = '#3d2817';
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.35, headR, 0, Math.PI);
    ctx.fill();

    // Torso/Shirt
    const shirtGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH * 0.15, bodyW / 2, bodyH * 0.25);
    shirtGrad.addColorStop(0, '#e74c3c');
    shirtGrad.addColorStop(1, '#c0392b');
    ctx.fillStyle = shirtGrad;
    roundRect(ctx, -bodyW * 0.5, -bodyH * 0.15, bodyW, bodyH * 0.5, 3);
    ctx.fill();
    ctx.strokeStyle = '#8b2e23';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pants
    const pantsGrad = ctx.createLinearGradient(-bodyW / 2, bodyH * 0.35, bodyW / 2, bodyH / 2);
    pantsGrad.addColorStop(0, '#2c3e50');
    pantsGrad.addColorStop(1, '#1a2634');
    ctx.fillStyle = pantsGrad;
    ctx.fillRect(-bodyW * 0.4, bodyH * 0.35, bodyW * 0.8, bodyH * 0.25);

    // Left arm
    ctx.strokeStyle = '#f4a460';
    ctx.lineWidth = bodyW * 0.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const leftSwing = Math.sin(player.walkTimer) * 0.3 * Math.min(1, Math.abs(player.vx) / player.speed);
    ctx.moveTo(-bodyW * 0.35, -bodyH * 0.05);
    ctx.lineTo(-bodyW * 0.6 + leftSwing * 6, bodyH * 0.2);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    const rightSwing = Math.sin(player.walkTimer + Math.PI) * 0.3 * Math.min(1, Math.abs(player.vx) / player.speed);
    ctx.moveTo(bodyW * 0.35, -bodyH * 0.05);
    ctx.lineTo(bodyW * 0.6 + rightSwing * 6, bodyH * 0.2);
    ctx.stroke();

    // Left leg
    ctx.beginPath();
    const leftLegSwing = Math.sin(player.walkTimer) * 12 * Math.min(1, Math.abs(player.vx) / player.speed);
    ctx.moveTo(-bodyW * 0.2, bodyH * 0.6);
    ctx.lineTo(-bodyW * 0.15 + leftLegSwing, bodyH * 0.95);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    const rightLegSwing = Math.sin(player.walkTimer + Math.PI) * 12 * Math.min(1, Math.abs(player.vx) / player.speed);
    ctx.moveTo(bodyW * 0.2, bodyH * 0.6);
    ctx.lineTo(bodyW * 0.15 + rightLegSwing, bodyH * 0.95);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-headR * 0.25, -bodyH * 0.38, headR * 0.15, 0, Math.PI * 2);
    ctx.arc(headR * 0.25, -bodyH * 0.38, headR * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-headR * 0.25, -bodyH * 0.38, headR * 0.08, 0, Math.PI * 2);
    ctx.arc(headR * 0.25, -bodyH * 0.38, headR * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.3, headR * 0.15, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  // draw a simple faceted crystal
  function drawCrystal(ctx, x, y, r, hue, pixelRatio) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = `hsla(${hue},90%,60%,0.9)`;
    ctx.shadowBlur = 14 * pixelRatio;

    const rx = r;
    const ry = r * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -ry);
    ctx.lineTo(rx * 0.6, -ry * 0.2);
    ctx.lineTo(rx, ry * 0.2);
    ctx.lineTo(0, ry);
    ctx.lineTo(-rx, ry * 0.2);
    ctx.lineTo(-rx * 0.6, -ry * 0.2);
    ctx.closePath();

    const lg = ctx.createLinearGradient(0, -ry, 0, ry);
    lg.addColorStop(0, `hsl(${hue},85%,78%)`);
    lg.addColorStop(0.45, `hsl(${hue},85%,55%)`);
    lg.addColorStop(1, `hsl(${hue},85%,36%)`);
    ctx.fillStyle = lg;
    ctx.fill();

    // facets
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.moveTo(0, -ry);
    ctx.lineTo(rx * 0.5, -ry * 0.15);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.moveTo(0, ry);
    ctx.lineTo(rx, ry * 0.2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `hsla(${hue},60%,20%,0.8)`;
    ctx.lineWidth = Math.max(1, 1 * pixelRatio);
    ctx.stroke();
    ctx.restore();
  }

  // draw coin
  function drawCoin(ctx, x, y, r, pixelRatio) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6 * pixelRatio;

    // rim
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#ffd880');
    grad.addColorStop(0.5, '#ffcf40');
    grad.addColorStop(1, '#cca000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // edge stroke
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1 * pixelRatio;
    ctx.stroke();
    ctx.restore();
  }

  // rounded rectangle path
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w / 2), Math.abs(h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // expose for debugging
  window.game = { player, platforms, crystals, coins, spawn: _spawnPickups };
})();
