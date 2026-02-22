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

  const groundY = 900; // world coordinate of the flat ground
  const platforms = [];
  const crystals = [];
  const coins = [];

  let score = 0;
  let coinsCollected = 0;

  function _spawnPlatforms() {
    platforms.length = 0;
    // spread platforms across world space
    platforms.push({ x: 0, y: groundY, w: 10000, h: 48 }); // ground (very wide)
    platforms.push({ x: 200, y: groundY - 160, w: 220, h: 16 });
    platforms.push({ x: 520, y: groundY - 220, w: 200, h: 16 });
    platforms.push({ x: 880, y: groundY - 120, w: 240, h: 16 });
    platforms.push({ x: 1280, y: groundY - 300, w: 260, h: 16 });
    platforms.push({ x: 1640, y: groundY - 220, w: 180, h: 16 });
    platforms.push({ x: -320, y: groundY - 280, w: 200, h: 16 });
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

    // ground fallback if no platform landed
    if (!player.onGround && player.y + halfH > groundY) {
      player.y = groundY - halfH;
      player.vy = 0;
      player.onGround = true;
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

    ctx.restore();
  }

  // drawPlayer: simple human with swinging limbs
  function drawPlayer(ctx, pl, pr) {
    const s = worldToScreen(pl.x, pl.y);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pr, pr);

    const bodyW = pl.w;
    const bodyH = pl.h;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, bodyH / 2 + 2, bodyW * 0.9, bodyH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // body
    const bodyGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
    bodyGrad.addColorStop(0, '#ffdca6');
    bodyGrad.addColorStop(1, '#ffb86b');
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, Math.min(bodyW, bodyH) / 6);
    ctx.fill();
    ctx.strokeStyle = '#4b2b18';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // head
    const headR = Math.min(bodyW, bodyH) * 0.36;
    ctx.beginPath();
    ctx.fillStyle = '#fff2dc';
    ctx.arc(0, -bodyH / 2 - headR * 0.2, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // limb swing
    const walk = Math.sin(player.walkTimer) * Math.min(1, Math.abs(player.vx) / player.speed);
    // legs
    ctx.strokeStyle = '#392417';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, bodyH / 2 - 2);
    ctx.lineTo(-6 + walk * 8, bodyH / 2 + 12);
    ctx.moveTo(6, bodyH / 2 - 2);
    ctx.lineTo(6 - walk * 8, bodyH / 2 + 12);
    ctx.stroke();

    // arms
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2 + 4, -bodyH / 4);
    ctx.lineTo(-bodyW / 2 + 4 + walk * 8, -bodyH / 4 + 8);
    ctx.moveTo(bodyW / 2 - 4, -bodyH / 4);
    ctx.lineTo(bodyW / 2 - 4 - walk * 8, -bodyH / 4 + 8);
    ctx.stroke();

    // eyes
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(-headR * 0.35, -bodyH / 2 - headR * 0.2, headR * 0.12, 0, Math.PI * 2);
    ctx.arc(headR * 0.05, -bodyH / 2 - headR * 0.2, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();

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
    lg.addColorStop(0, `hsl(${hue} 85% 78%)`.replace(/\s/g, ''));
    lg.addColorStop(0.45, `hsl(${hue} 85% 55%)`.replace(/\s/g, ''));
    lg.addColorStop(1, `hsl(${hue} 85% 36%)`.replace(/\s/g, ''));
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
