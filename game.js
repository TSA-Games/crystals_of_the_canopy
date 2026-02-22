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
     ctx.fillStyle = 'rgba(11, 18, 34, 0.3)';
     ctx.fillRect(0, 0, WIDTH, HEIGHT);
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

  // Platformer game scene
   function createGameScene() {
     const player = {
       x: 100,
       y: 100,
       w: 20,
       h: 20,
       vx: 0,
       vy: 0,
       speed: 150,
       color: '#10b981',
       onGround: false,
       speedBoost: 1,
       speedBoostTimer: 0
     };

     const GRAVITY = 600;
     const JUMP_POWER = 300;
     const MAX_FALL_SPEED = 400;

     let platforms = [];
     let coins = [];
     let crystals = [];
     let score = 0;

     function enter() {
       score = 0;
       player.x = 100;
       player.y = 100;
       player.vx = 0;
       player.vy = 0;
       player.speedBoost = 1;
       player.speedBoostTimer = 0;
       
       // Create platforms (x, y, width, height)
       platforms = [
         { x: 0, y: HEIGHT - 40, w: WIDTH, h: 40 },  // Ground
         { x: 150, y: HEIGHT - 150, w: 200, h: 20 },
         { x: 450, y: HEIGHT - 200, w: 220, h: 20 },
         { x: 800, y: HEIGHT - 120, w: 200, h: 20 },
         { x: 300, y: HEIGHT - 300, w: 180, h: 20 },
         { x: 650, y: HEIGHT - 320, w: 200, h: 20 },
         { x: 100, y: HEIGHT - 400, w: 220, h: 20 }
       ];

       coins = spawnCoins(12);
       crystals = spawnCrystals(4);
     }

     function update(dt) {
       // Horizontal movement
       const ax = (input.keys.has('ArrowRight') || input.keys.has('d')) - (input.keys.has('ArrowLeft') || input.keys.has('a'));
       player.vx = ax * player.speed * player.speedBoost;

       // Gravity
       player.vy += GRAVITY * dt;
       player.vy = Math.min(player.vy, MAX_FALL_SPEED);

       // Update position
       player.x += player.vx * dt;
       player.y += player.vy * dt;

       // Horizontal bounds
       player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

       // Check ground collision
       player.onGround = false;
       for (const p of platforms) {
         if (rectsOverlap(player, p)) {
           if (player.vy > 0 && player.y + player.h - player.vy * dt <= p.y + 5) {
             player.y = p.y - player.h;
             player.vy = 0;
             player.onGround = true;
           }
         }
       }

       // Jump
       if ((input.keys.has(' ') || input.keys.has('w') || input.keys.has('ArrowUp')) && player.onGround) {
         player.vy = -JUMP_POWER;
       }

       // Collect coins
       for (let i = coins.length - 1; i >= 0; i--) {
         if (rectsOverlap(player, coins[i])) {
           coins.splice(i, 1);
           score += 10;
         }
       }

       // Collect crystals (speed boost)
       for (let i = crystals.length - 1; i >= 0; i--) {
         if (rectsOverlap(player, crystals[i])) {
           crystals.splice(i, 1);
           player.speedBoost = 2;
           player.speedBoostTimer = 5;
         }
       }

       // Speed boost timer
       if (player.speedBoostTimer > 0) {
         player.speedBoostTimer -= dt;
       } else {
         player.speedBoost = 1;
       }

       // Fall off screen
       if (player.y > HEIGHT) {
         setScene('menu');
       }

       if (input.keys.has('Escape')) setScene('pause');
       if (coins.length === 0 && crystals.length === 0) setScene('menu');
     }

     function draw() {
       ctx.setTransform(1, 0, 0, 1, 0, 0);
       
       // Greenish background
       ctx.fillStyle = '#2d5a3d';
       ctx.fillRect(0, 0, WIDTH, HEIGHT);
       
       // Lighter green overlay gradient effect
       const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
       gradient.addColorStop(0, '#4a7c59');
       gradient.addColorStop(1, '#1f3a28');
       ctx.fillStyle = gradient;
       ctx.fillRect(0, 0, WIDTH, HEIGHT);

       // Draw platforms (brown bridges)
       ctx.fillStyle = '#8b6f47';
       for (const p of platforms) {
         ctx.fillRect(p.x, p.y, p.w, p.h);
         // Platform shadow
         ctx.fillStyle = '#6b5238';
         ctx.fillRect(p.x, p.y + p.h, p.w, 3);
         ctx.fillStyle = '#8b6f47';
       }

       // Draw coins (yellow circles)
       for (const c of coins) {
         ctx.fillStyle = '#fbbf24';
         ctx.beginPath();
         ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
         ctx.fill();
         // Coin shine
         ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
         ctx.beginPath();
         ctx.arc(c.x + c.w / 2 - 2, c.y + c.h / 2 - 2, c.w / 4, 0, Math.PI * 2);
         ctx.fill();
       }

       // Draw crystals (cyan/turquoise diamonds)
       for (const cr of crystals) {
         ctx.fillStyle = '#06b6d4';
         ctx.beginPath();
         ctx.moveTo(cr.x + cr.w / 2, cr.y); // top
         ctx.lineTo(cr.x + cr.w, cr.y + cr.h / 2); // right
         ctx.lineTo(cr.x + cr.w / 2, cr.y + cr.h); // bottom
         ctx.lineTo(cr.x, cr.y + cr.h / 2); // left
         ctx.closePath();
         ctx.fill();
         // Crystal glow
         ctx.strokeStyle = '#0891b2';
         ctx.lineWidth = 2;
         ctx.stroke();
       }

       // Player
       ctx.fillStyle = player.speedBoostTimer > 0 ? '#ff6b6b' : '#10b981';
       ctx.fillRect(player.x, player.y, player.w, player.h);
       // Player eyes
       ctx.fillStyle = '#000';
       ctx.fillRect(player.x + 5, player.y + 5, 3, 3);
       ctx.fillRect(player.x + 12, player.y + 5, 3, 3);

       // HUD
       drawText(`Score: ${score}`, 12, 24, 16, '#e2e8f0', 'left');
       if (player.speedBoostTimer > 0) {
         drawText(`SPEED BOOST! ${player.speedBoostTimer.toFixed(1)}s`, WIDTH / 2, 24, 14, '#ff6b6b', 'center');
       }
       drawText('ARROW KEYS / WASD to move, SPACE/W to jump', WIDTH / 2, HEIGHT - 20, 12, '#b0c4de', 'center');
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
       arr.push({ x: Math.random() * (WIDTH - 16), y: Math.random() * (HEIGHT - 100), w: 10, h: 10 });
     }
     return arr;
   }
   function spawnCrystals(n) {
     const arr = [];
     for (let i = 0; i < n; i++) {
       arr.push({ x: Math.random() * (WIDTH - 20), y: Math.random() * (HEIGHT - 150), w: 16, h: 16 });
     }
     return arr;
   }
 });
