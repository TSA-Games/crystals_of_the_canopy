document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const fpsEl = document.getElementById('fps');
  const stateEl = document.getElementById('state');

  // Fixed game world resolution
  const BASE_WIDTH = 800;
  const BASE_HEIGHT = 600;

  // Ensure canvas has physical pixel size
  function fitCanvasToWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  fitCanvasToWindow();
  window.addEventListener('resize', fitCanvasToWindow);

  // Input
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false }
  };

  window.addEventListener('keydown', (e) => input.keys.add(e.key));
  window.addEventListener('keyup',   (e) => input.keys.delete(e.key));
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // scale is computed each frame; we’ll use lastScale to map mouse
    input.mouse.x = px / lastScale;
    input.mouse.y = py / lastScale;
  });
  canvas.addEventListener('mousedown', () => input.mouse.down = true);
  canvas.addEventListener('mouseup',   () => input.mouse.down = false);

  // Scenes
  const scenes = {
    menu: {
      enter() {},
      update(dt) {
        if (input.keys.has('Enter') || input.mouse.down) setScene('game');
      },
      draw() {
        clear();
        drawText('Your Game Title', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 20, 28, '#e2e8f0', 'center');
        drawText('Press Enter or Click to start', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 20, 16, '#94a3b8', 'center');
      },
      exit() {}
    },
    game: createGameScene(),
    pause: {
      enter() {},
      update(dt) {
        if (input.keys.has('Escape')) setScene('game');
      },
      draw() {
        scenes.game.draw();
        drawOverlay('Paused (press Esc)');
      },
      exit() {}
    }
  };

  let current = 'menu';
  scenes[current].enter();
  stateEl.textContent = current;

  function setScene(name) {
    if (name === current) return;
    if (scenes[current].exit) scenes[current].exit();
    current = name;
    if (scenes[current].enter) scenes[current].enter();
    stateEl.textContent = current;
  }

  // Time
  let last = performance.now();
  let accumulator = 0;
  const FIXED_DT = 1000 / 60; // 60 updates per second

  // FPS
  let frames = 0, fpsTimer = 0;

  // Scale cache for input mapping
  let lastScale = 1;

  function loop(now) {
    const delta = now - last;
    last = now;
    accumulator += delta;
    fpsTimer += delta; frames++;
    if (fpsTimer >= 1000) { fpsEl.textContent = frames; fpsTimer = 0; frames = 0; }

    // Compute scale to fit window while preserving aspect
    const scaleX = canvas.width / BASE_WIDTH;
    const scaleY = canvas.height / BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    lastScale = scale;

    // Apply transform and clear the virtual canvas
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // Fixed-step updates
    while (accumulator >= FIXED_DT) {
      scenes[current].update(FIXED_DT / 1000);
      accumulator -= FIXED_DT;
    }

    // Draw in game space (BASE_WIDTH x BASE_HEIGHT)
    scenes[current].draw();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Utility draw functions
  function clear() {
    ctx.fillStyle = '#0b1222';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }
  function drawText(text, x, y, size = 16, color = '#e2e8f0', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }
  function drawOverlay(message) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    drawText(message, BASE_WIDTH / 2, BASE_HEIGHT / 2, 24, '#e2e8f0', 'center');
  }

  // Example game scene
  function createGameScene() {
    const player = {
      x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, w: 24, h: 24, speed: 180, color: '#22c55e'
    };
    const coins = spawnCoins(10);
    let score = 0;

    function enter() {}

    function update(dt) {
      const ax = (input.keys.has('ArrowRight') || input.keys.has('d')) - (input.keys.has('ArrowLeft') || input.keys.has('a'));
      const ay = (input.keys.has('ArrowDown')  || input.keys.has('s')) - (input.keys.has('ArrowUp')   || input.keys.has('w'));
      const len = Math.hypot(ax, ay) || 1;
      player.x += (ax / len) * player.speed * dt;
      player.y += (ay / len) * player.speed * dt;

      player.x = Math.max(0, Math.min(BASE_WIDTH - player.w, player.x));
      player.y = Math.max(0, Math.min(BASE_HEIGHT - player.h, player.y));

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (rectsOverlap(player, c)) {
          coins.splice(i, 1);
          score += 10;
        }
      }

      if (input.keys.has('Escape')) setScene('pause');
      if (coins.length === 0) setScene('menu');
    }

    function draw() {
      clear();

      // Grid
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      for (let x = 0; x < BASE_WIDTH; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y < BASE_HEIGHT; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_WIDTH, y); ctx.stroke();
      }

      // Coins
      for (const c of coins) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.w, player.h);

      // HUD
      drawText(`Score: ${score}`, 12, 24, 16, '#e2e8f0', 'left');
    }

    return { enter, update, draw, exit() {} };
  }

  // Helpers
  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function spawnCoins(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ x: Math.random() * (BASE_WIDTH - 16), y: Math.random() * (BASE_HEIGHT - 16), w: 12, h: 12 });
    }
    return arr;
  }
});
