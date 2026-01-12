document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const fpsEl = document.getElementById('fps');
  const stateEl = document.getElementById('state');

  // Dynamic world size
  let WIDTH = window.innerWidth;
  let HEIGHT = window.innerHeight;

  function fitCanvasToWindow() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
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
    input.mouse.x = e.clientX - r.left;
    input.mouse.y = e.clientY - r.top;
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
        drawText('Crystals of the Canopy', WIDTH / 2, HEIGHT / 2 - 20, 28, '#e2e8f0', 'center');
        drawText('Press Enter or Click to start', WIDTH / 2, HEIGHT / 2 + 20, 16, '#94a3b8', 'center');
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
    scenes[current].exit?.();
    current = name;
    scenes[current].enter?.();
    stateEl.textContent = current;
  }

  // Time
  let last = performance.now();
  let accumulator = 0;
  const FIXED_DT = 1000 / 60; // 60 updates per second

  // FPS
  let frames = 0, fpsTimer = 0;

  function loop(now) {
    const delta = now - last;
    last = now;
    accumulator += delta;
    fpsTimer += delta; frames++;
    if (fpsTimer >= 1000) { fpsEl.textContent = frames; fpsTimer = 0; frames = 0; }

    // Clear full dynamic canvas (transparent so forest background shows)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    clear();

    // Fixed-step updates
    while (accumulator >= FIXED_DT) {
      scenes[current].update(FIXED_DT / 1000);
      accumulator -= FIXED_DT;
    }

    // Draw using dynamic WIDTH/HEIGHT
    scenes[current].draw();

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Utility draw functions
  function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Optional: add a subtle overlay tint so text/sprites pop
    // ctx.fillStyle = 'rgba(11, 18, 34, 0.3)';
    // ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  function drawText(text, x, y, size = 16, color = '#e2e8f0', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }
  function drawOverlay(message) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(message, WIDTH / 2, HEIGHT / 2, 24, '#e2e8f0', 'center');
  }

  // Example game scene
  function createGameScene() {
    const player = {
      x: WIDTH / 2, y: HEIGHT / 2, w: 24, h: 24, speed: 180, color: '#22c55e'
    };
    let coins = spawnCoins(10);
    let score = 0;

    function enter() {
      coins = spawnCoins(10);
      score = 0;
      player.x = WIDTH / 2;
      player.y = HEIGHT / 2;
    }

    function update(dt) {
      const ax = (input.keys.has('ArrowRight') || input.keys.has('d')) - (input.keys.has('ArrowLeft') || input.keys.has('a'));
      const ay = (input.keys.has('ArrowDown')  || input.keys.has('s')) - (input.keys.has('ArrowUp')   || input.keys.has('w'));
      const len = Math.hypot(ax, ay) || 1;
      player.x += (ax / len) * player.speed * dt;
      player.y += (ay / len) * player.speed * dt;

      player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));
      player.y = Math.max(0, Math.min(HEIGHT - player.h, player.y));

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
      for (let x = 0; x < WIDTH; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
      }
      for (let y = 0; y < HEIGHT; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
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
      arr.push({ x: Math.random() * (WIDTH - 16), y: Math.random() * (HEIGHT - 16), w: 12, h: 12 });
    }
    return arr;
  }
});
