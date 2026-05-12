// Crystals of the Canopy - Professional Platformer Game (patched)
// Corrected: removed background image, fixed brace, added Level 3

(function () {
  'use strict';

  // Game state for start screen
  let showStartScreen = true;
  let showHowToPlay = false;
  let showCredits = false;
  let startScreenSelection = 0; // 0: Play, 1: How to Play, 2: Credits


  // Alternating background music logic
  const backgroundMusic1 = new Audio('sounds/backgground.mp3');
  backgroundMusic1.loop = false;
  backgroundMusic1.volume = 0.5;
  backgroundMusic1.addEventListener('error', () => {
    console.warn('Background music failed to load. Check if sounds/backgground.mp3 exists.');
  });

  const backgroundMusic2 = new Audio('sounds/vlog-beat-background-349853.mp3');
  backgroundMusic2.loop = false;
  backgroundMusic2.volume = 0.5;
  backgroundMusic2.addEventListener('error', () => {
    console.warn('Background music failed to load. Check if sounds/vlog-beat-background-349853.mp3 exists.');
  });

  let musicStarted = false;
  let musicTimeout = null;
  let currentMusic = 1;


  function playBackgroundMusic1() {
    clearTimeout(musicTimeout);
    backgroundMusic2.pause();
    backgroundMusic2.currentTime = 0;
    backgroundMusic1.currentTime = 0;
    backgroundMusic1.play();
    currentMusic = 1;
    // Remove any previous listener
    backgroundMusic1.ontimeupdate = null;
    backgroundMusic1.ontimeupdate = function() {
      if (backgroundMusic1.duration && backgroundMusic1.currentTime >= backgroundMusic1.duration - 2) {
        backgroundMusic1.ontimeupdate = null;
        backgroundMusic1.pause();
        playBackgroundMusic2();
      }
    };
    // Also switch after 35 seconds if that's sooner
    musicTimeout = setTimeout(() => {
      backgroundMusic1.ontimeupdate = null;
      backgroundMusic1.pause();
      playBackgroundMusic2();
    }, 35000);
  }

  function playBackgroundMusic2() {
    clearTimeout(musicTimeout);
    backgroundMusic1.pause();
    backgroundMusic1.currentTime = 0;
    backgroundMusic2.currentTime = 0;
    backgroundMusic2.play();
    currentMusic = 2;
    // Play for 35 seconds, then switch
    musicTimeout = setTimeout(() => {
      playBackgroundMusic1();
    }, 35000);
  }

  function startMusic() {
    if (!musicStarted) {
      playBackgroundMusic1();
      musicStarted = true;
    }
  }

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

  // Load forest background image for game
  const forestBg = new Image();
  forestBg.src = 'images/forest background.png';

  // Load start screen background image
  const startScreenBg = new Image();
  startScreenBg.src = 'images/start page.png';

  // Load how to play background image
  const howToPlayBg = new Image();
  howToPlayBg.src = 'images/How To Play.png';

  // Load credits background image
  const creditsBg = new Image();
  creditsBg.src = 'images/Credits.png';

  // Load player animation frames from images/ANIMATION (new character)
  const animationFrames = [];
  for (let i = 1; i <= 17; i++) {
    const img = new Image();
    img.src = `images/ANIMATION/${String(100 + i).padStart(4, '0')}.png`;
    animationFrames.push(img);
  }

  // Load jump animation frames (used when player is in the air)
  const jumpFrames = [];
  // Jump frames: files named 0101.png..0115.png in this project
  for (let i = 1; i <= 15; i++) {
    const img = new Image();
    img.src = `images/animation jump/${String(100 + i).padStart(4, '0')}.png`;
    jumpFrames.push(img);
  }

  // Note: backwards animation uses the forward frames played in reverse

  // Load mascott animation (played on YOU WIN screen)
  const mascottFrames = [];
  for (let i = 1; i <= 39; i++) {
    const img = new Image();
    img.src = `images/animation mascott/${String(i).padStart(4, '0')}.png`;
    mascottFrames.push(img);
  }

  // Load per-level backgrounds from images/vg/level N.png
  const vgBackgrounds = {};
  for (let i = 1; i <= 7; i++) {
    const img = new Image();
    img.src = `images/vg/level ${i}.png`;
    vgBackgrounds[i] = img;
  }

  // Load magnet animation frames
  const magnetFrames = [];
  for (let i = 1; i <= 50; i++) {
    const img = new Image();
    img.src = `images/magnet .pngs/${String(i).padStart(4, '0')}.png`;
    magnetFrames.push(img);
  }

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
    startMusic(); // Start music on any key press
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.code) keys[e.code] = false;
  });
  window.addEventListener('mousedown', startMusic);
  window.addEventListener('touchstart', startMusic);

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
    speedBoostTimer: 0,
    magnetActive: false,
    magnetTimer: 0,
    animationFrame: 0,
    animationTimer: 0,
    isMoving: false
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
  let levelScore = 0;
  let lives = 5;

  // Level 6 timer
  let level6Timer = 15;
  const LEVEL6_TIME_LIMIT = 15;

  // Flash transition state
  let flashTransitionActive = false;
  let flashTransitionTimer = 0;
  let flashTransitionNextLevel = null;

  // Track the moving platform the player is standing on (Level 7)
  let playerOnMovingPlatform = null;
  let playerOffsetOnPlatformX = 0; // Horizontal offset from platform center
  let playerOffsetOnPlatformY = 0; // Vertical offset from platform top

  // Mascott animation timer for the win screen
  let mascottTimer = 0;
  let mascottFrame = 0;

  // Swoosh sound effect
  const wooshSound = new Audio('sounds/swoosh.mp3');
  wooshSound.volume = 0.7;

  // ============================================================================
  // GAME INITIALIZATION
  // ============================================================================
  function _createMagnet(x, y) {
    return {
      x: x,
      y: y,
      r: 18,
      collected: false,
      animationFrame: 0,
      animationTimer: 0
    };
  }

  function _initGame() {
  lives = 5; // Reset lives at the start of each level
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
  magnets.push(_createMagnet(160 * baseScale, 410));
  magnets.push(_createMagnet(600 * baseScale, 370));

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
  magnets.push(_createMagnet(120 * baseScale, 470));
  magnets.push(_createMagnet(680 * baseScale, 410));

  } else if (currentLevel === 3) {
      // Level 3: EXTREME - zig-zag, high jumps, varied widths
  platforms.push({ x: 60 * baseScale,  y: 520, w: 80,  h: PLATFORM_HEIGHT });   // Start, a bit wider
  platforms.push({ x: 160 * baseScale, y: 350, w: 200, h: PLATFORM_HEIGHT });   // Huge jump up, even wider
  platforms.push({ x: 320 * baseScale, y: 500, w: 90,  h: PLATFORM_HEIGHT });   // Drop down, a bit wider
  platforms.push({ x: 420 * baseScale, y: 320, w: 140, h: PLATFORM_HEIGHT });   // Big jump up, a bit wider
  platforms.push({ x: 540 * baseScale, y: 480, w: 100,  h: PLATFORM_HEIGHT });   // Drop down, a bit wider
  platforms.push({ x: 640 * baseScale, y: 300, w: 120, h: PLATFORM_HEIGHT });   // Highest platform, a bit wider
  platforms.push({ x: 720 * baseScale, y: 420, w: 80,  h: PLATFORM_HEIGHT });   // Drop down, a bit wider
  platforms.push({ x: 800 * baseScale, y: 350, w: 160, h: PLATFORM_HEIGHT });   // Final wide platform, a bit wider
  // Magnets
  magnets.push(_createMagnet(320 * baseScale, 480));
  magnets.push(_createMagnet(700 * baseScale, 340));
  } else if (currentLevel === 4) {
      // Level 4: IMPOSSIBLE - extreme gaps, heights, and narrow bridges
  platforms.push({ x: 50 * baseScale,  y: 540, w: 50,  h: PLATFORM_HEIGHT });   // Start, ultra-narrow
  platforms.push({ x: 200 * baseScale, y: 320, w: 60,  h: PLATFORM_HEIGHT });   // Huge jump up, narrow
  platforms.push({ x: 350 * baseScale, y: 520, w: 40,  h: PLATFORM_HEIGHT });   // Drop down, ultra-narrow
  platforms.push({ x: 500 * baseScale, y: 280, w: 80,  h: PLATFORM_HEIGHT });   // Highest platform, wide
  platforms.push({ x: 650 * baseScale, y: 500, w: 50,  h: PLATFORM_HEIGHT });   // Drop down, narrow
  platforms.push({ x: 800 * baseScale, y: 250, w: 60,  h: PLATFORM_HEIGHT });   // Final, highest, narrow
  // Magnets
  magnets.push(_createMagnet(350 * baseScale, 500));
  magnets.push(_createMagnet(800 * baseScale, 230));
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
      magnets.push(_createMagnet(160 * baseScale, 340));
      magnets.push(_createMagnet(800 * baseScale, 330));
    } else if (currentLevel === 6) {
      // Level 6: Timed challenge - reach end in 15 seconds
      platforms.push({ x: 80 * baseScale, y: 500, w: 120, h: PLATFORM_HEIGHT });
      platforms.push({ x: 220 * baseScale, y: 420, w: 80, h: PLATFORM_HEIGHT });
      platforms.push({ x: 340 * baseScale, y: 480, w: 100, h: PLATFORM_HEIGHT });
      platforms.push({ x: 480 * baseScale, y: 400, w: 120, h: PLATFORM_HEIGHT });
      platforms.push({ x: 620 * baseScale, y: 470, w: 90, h: PLATFORM_HEIGHT });
      platforms.push({ x: 720 * baseScale, y: 350, w: 140, h: PLATFORM_HEIGHT });
      // Magnets
      magnets.push(_createMagnet(220 * baseScale, 410));
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
    } else if (currentLevel === 7) {
      // Level 7: Complex moving bridges, all visible, impossible design
      // All platforms move horizontally or vertically, spaced for visibility
      platforms.push({ x: 80 * baseScale, y: 540, w: 80, h: PLATFORM_HEIGHT, moving: 'x', range: 120, speed: 1.2 }); // Start, moves horizontally
      platforms.push({ x: 200 * baseScale, y: 480, w: 60, h: PLATFORM_HEIGHT, moving: 'y', range: 80, speed: 1.5 }); // Moves vertically
      platforms.push({ x: 320 * baseScale, y: 420, w: 100, h: PLATFORM_HEIGHT, moving: 'x', range: 140, speed: 1.1 }); // Moves horizontally
      platforms.push({ x: 440 * baseScale, y: 360, w: 60, h: PLATFORM_HEIGHT, moving: 'y', range: 100, speed: 1.3 }); // Moves vertically
      platforms.push({ x: 560 * baseScale, y: 300, w: 80, h: PLATFORM_HEIGHT, moving: 'x', range: 120, speed: 1.4 }); // Moves horizontally
      platforms.push({ x: 680 * baseScale, y: 240, w: 60, h: PLATFORM_HEIGHT, moving: 'y', range: 90, speed: 1.6 }); // Moves vertically
      platforms.push({ x: 800 * baseScale, y: 180, w: 100, h: PLATFORM_HEIGHT, moving: 'x', range: 160, speed: 1.2 }); // Final, moves horizontally
      platforms.push({ x: 400 * baseScale, y: 520, w: 60, h: PLATFORM_HEIGHT, moving: 'y', range: 120, speed: 1.7 }); // Extra, moves vertically
      platforms.push({ x: 600 * baseScale, y: 400, w: 80, h: PLATFORM_HEIGHT, moving: 'x', range: 100, speed: 1.5 }); // Extra, moves horizontally
      // Store base positions for moving platforms
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        p.baseX = p.x;
        p.baseY = p.y;
      }
      // Magnets
      magnets.push(_createMagnet(320 * baseScale, 420));
      magnets.push(_createMagnet(800 * baseScale, 180));
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
    player.magnetActive = false;
    player.magnetTimer = 0;
    player.animationFrame = 0;
    player.animationTimer = 0;
    player.isMoving = false;
    // Reset coins/crystals for current level
    for (const coin of coins) coin.collected = false;
    for (const crystal of crystals) crystal.collected = false;
    for (const magnet of magnets) magnet.collected = false;
    coinsCollected = 0;
    totalCoins = coins.length;
    // Reset points earned in this level
    score -= levelScore;
    levelScore = 0;
    if (currentLevel === 6) {
      // Respawn crystals for Level 6
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
      level6Timer = LEVEL6_TIME_LIMIT;
    }
  }

  // Initialize once, then hook resize
  resizeCanvas(false); // set canvas size without reinitializing game yet
  _initGame();
  _resetPlayer();
  window.addEventListener('resize', () => resizeCanvas(true));

  // Start screen input handler (keyboard)
  window.addEventListener('keydown', function(e) {
    if (!showStartScreen) return;
    if (e.key === 'ArrowUp' || e.key === 'w') {
      startScreenSelection = (startScreenSelection + 2) % 3;
      startMusic(); // Try to start music on any interaction
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      startScreenSelection = (startScreenSelection + 1) % 3;
      startMusic(); // Try to start music on any interaction
    } else if (e.key === 'Enter' || e.key === ' ') {
      startMusic(); // Ensure music starts when Play is selected
      if (startScreenSelection === 0) {
        showStartScreen = false;
      } else if (startScreenSelection === 1) {
        showHowToPlay = true;
      } else if (startScreenSelection === 2) {
        showCredits = true;
      }
    }
  });

  // Start screen input handler (mouse)
  canvas.addEventListener('mousedown', function(e) {
    if (!showStartScreen) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / (rect.right - rect.left) * width;
    const my = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
    // Button hitboxes (centered)
    const btnY0 = 220, btnYStep = 60, btnH = 40, btnW = 320;
    for (let i = 0; i < 3; i++) {
      const bx = width/2 - btnW/2, by = btnY0 + i*btnYStep - btnH/2;
      if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
        // Immediately navigate when clicked
        if (i === 0) {
          startMusic(); // Ensure music starts when Play button is clicked
          showStartScreen = false;
        } else if (i === 1) {
          showHowToPlay = true;
          showStartScreen = false;
        } else if (i === 2) {
          showCredits = true;
          showStartScreen = false;
        }
        break;
      }
    }
  });

  // Start screen rendering function
  function _renderStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    // Draw start screen background image if loaded, else fallback
    if (startScreenBg.complete && startScreenBg.naturalWidth > 0) {
      ctx.drawImage(startScreenBg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Crystals of the Canopy', width/2, 80);
    ctx.font = 'bold 28px Arial';
    const options = ['Play', 'How to Play', 'Credits'];
    for (let i = 0; i < options.length; i++) {
      // Draw button background for mouse hitbox (no highlight)
      const btnW = 320, btnH = 40;
      const bx = width/2 - btnW/2, by = 220 + i*60 - btnH/2;
      ctx.fillStyle = '#444';
      ctx.globalAlpha = 0.10;
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillText(options[i], width/2, 220 + i*60);
    }
  // (Removed instruction text at bottom)
    ctx.restore();
  }

  // How to Play screen rendering function
  function _renderHowToPlay() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    // Draw how to play background image if loaded, else fallback
    if (howToPlayBg.complete && howToPlayBg.naturalWidth > 0) {
      ctx.drawImage(howToPlayBg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
    }
    // Draw back button at top-left
    const backBtnW = 120, backBtnH = 40;
    const backBtnX = 20, backBtnY = 20;
    ctx.fillStyle = '#ff2d55';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('← BACK', backBtnX + 10, backBtnY + backBtnH / 2);
    ctx.restore();
  }

  // Credits screen rendering function
  function _renderCredits() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
    // Draw credits background image if loaded, else fallback
    if (creditsBg.complete && creditsBg.naturalWidth > 0) {
      ctx.drawImage(creditsBg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
    }
    // Draw back button at top-left
    const backBtnW = 120, backBtnH = 40;
    const backBtnX = 20, backBtnY = 20;
    ctx.fillStyle = '#ff2d55';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('← BACK', backBtnX + 10, backBtnY + backBtnH / 2);
    ctx.restore();
  }

  // Handle back button clicks for How to Play and Credits
  canvas.addEventListener('mousedown', function(e) {
    if (!showHowToPlay && !showCredits) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / (rect.right - rect.left) * width;
    const my = (e.clientY - rect.top) / (rect.bottom - rect.top) * height;
    // Back button hitbox
    const backBtnW = 120, backBtnH = 40;
    const backBtnX = 20, backBtnY = 20;
    if (mx >= backBtnX && mx <= backBtnX + backBtnW && my >= backBtnY && my <= backBtnY + backBtnH) {
      showHowToPlay = false;
      showCredits = false;
      showStartScreen = true;
      startScreenSelection = 0;
    }
  });

  // Handle back button presses for How to Play and Credits
  window.addEventListener('keydown', function(e) {
    if (!showHowToPlay && !showCredits) return;
    if (e.key === 'Escape' || e.key === 'Backspace') {
      showHowToPlay = false;
      showCredits = false;
      showStartScreen = true;
      startScreenSelection = 0;
    }
  });

  // ============================================================================
  // GAME LOOP
  // ============================================================================
  let lastTime = performance.now();
  function gameLoop(now) {
    const rawDt = (now - lastTime) / 1000;
    const dt = Math.min(0.05, rawDt);
    lastTime = now;
    if (showStartScreen) {
      _renderStartScreen();
      requestAnimationFrame(gameLoop);
      return;
    }
    if (showHowToPlay) {
      _renderHowToPlay();
      requestAnimationFrame(gameLoop);
      return;
    }
    if (showCredits) {
      _renderCredits();
      requestAnimationFrame(gameLoop);
      return;
    }
    if (flashTransitionActive) {
      flashTransitionTimer += dt;
      if (flashTransitionTimer >= 0.7) {
        // End flash, start next level
        flashTransitionActive = false;
        flashTransitionTimer = 0;
        if (flashTransitionNextLevel !== null) {
          if (flashTransitionNextLevel <= 7) {
            currentLevel = flashTransitionNextLevel;
            gameWon = false;
            levelScore = 0;
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
    // Keep the loop running so animations (like mascott on win) continue
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // ============================================================================
  // UPDATE LOGIC
  // ============================================================================
  function _update(dt) {
    if (flashTransitionActive) return; // Pause gameplay during flash
    
    // Move platforms for Level 7 (each frame)
    if (currentLevel === 7) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.moving === 'x' && p.baseX !== undefined) {
          p.x = p.baseX + Math.sin(performance.now() / 1000 * p.speed) * p.range;
        } else if (p.moving === 'y' && p.baseY !== undefined) {
          p.y = p.baseY + Math.sin(performance.now() / 1000 * p.speed) * p.range;
        }
      }
      
      // Move player with the platform they're standing on
      if (playerOnMovingPlatform && player.onGround) {
        if (playerOnMovingPlatform.moving === 'x') {
          player.x = playerOnMovingPlatform.x + playerOffsetOnPlatformX;
        } else if (playerOnMovingPlatform.moving === 'y') {
          // For vertical platforms, keep the player exactly on top of the platform
          player.y = playerOnMovingPlatform.y - player.h;
          player.x = playerOnMovingPlatform.x + playerOffsetOnPlatformX;
        }
      }
    }
    
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
    playerOnMovingPlatform = null; // Clear platform tracking when leaving ground
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

    // Update animation: choose frame set based on state
    const inAir = !player.onGround;
    const movingLeft = player.vx < -5 && player.onGround;
    const movingRight = player.vx > 5 && player.onGround;

    player.animationTimer += dt;
    // Frame change interval (fast enough)
    const frameInterval = 0.045;

    if (inAir && jumpFrames.length > 0) {
      // Use jump frames (loop)
      if (player.animationTimer >= frameInterval) {
        player.animationTimer = 0;
        player.animationFrame = (player.animationFrame + 1) % jumpFrames.length;
      }
      player._currentFrameSet = 'jump';
    } else if ((movingRight || movingLeft || player.isMoving) && animationFrames.length > 0) {
      // Forward or backwards walking animation (uses forward frames reversed when moving left)
      if (player.animationTimer >= frameInterval) {
        player.animationTimer = 0;
        player.animationFrame = (player.animationFrame + 1) % animationFrames.length;
      }
      player._currentFrameSet = movingLeft ? 'backwards' : 'forward';
    } else {
      // Idle frame
      player.animationFrame = 0;
      player.animationTimer = 0;
      player._currentFrameSet = 'forward';
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
        let magnetRadius = player.magnetActive ? 300 : 120;
        let collected = false;
        // If magnet power is active, pull coins in very fast
        if (player.magnetActive) {
          const dx = (player.x + player.w / 2) - coin.x;
          const dy = (player.y + player.h / 2) - coin.y;
          const dist = Math.hypot(dx, dy);
          if (dist < magnetRadius) {
            // Pull coin toward player very quickly
            const angle = Math.atan2(dy, dx);
            const pullSpeed = 1200 * dt * (magnetRadius - dist) / magnetRadius; // much faster
            coin.x += Math.cos(angle) * Math.min(pullSpeed, dist);
            coin.y += Math.sin(angle) * Math.min(pullSpeed, dist);
            if (dist < coin.r + 14) {
              coin.collected = true;
              coinsCollected++;
              score += COIN_POINTS;
              levelScore += COIN_POINTS;
              const coinSound = new Audio('sounds/swoosh.mp3');
              coinSound.volume = 0.7;
              coinSound.play();
              collected = true;
            }
          }
        }
        // Otherwise, normal collection by touch
        if (!collected) {
          const dx = coin.x - (player.x + player.w / 2);
          const dy = coin.y - (player.y + player.h / 2);
          if (Math.hypot(dx, dy) < coin.r + 14) {
            coin.collected = true;
            coinsCollected++;
            score += COIN_POINTS;
            levelScore += COIN_POINTS;
            const coinSound = new Audio('sounds/swoosh.mp3');
            coinSound.volume = 0.7;
            coinSound.play();
          }
        }
      }
    }
    // Update magnet animations
    for (const magnet of magnets) {
      if (!magnet.collected && magnetFrames.length > 0) {
        magnet.animationTimer += dt;
        if (magnet.animationTimer >= 0.05) {
          magnet.animationTimer = 0;
          magnet.animationFrame = (magnet.animationFrame + 1) % magnetFrames.length;
        }
      }
    }
    // Magnet collect logic
    for (const magnet of magnets) {
      if (!magnet.collected) {
        const dx = magnet.x - (player.x + player.w / 2);
        const dy = magnet.y - (player.y + player.h / 2);
        if (Math.hypot(dx, dy) < magnet.r + 14) {
          magnet.collected = true;
          player.magnetActive = true;
          player.magnetTimer = 3.0;
        }
      }
    }
    // Magnet timer
    if (player.magnetActive) {
      player.magnetTimer -= dt;
      if (player.magnetTimer <= 0) {
        player.magnetActive = false;
        player.magnetTimer = 0;
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
        // Make collection easier by increasing the touch radius
        if (Math.hypot(dx, dy) < crystal.r + 20) {
          crystal.collected = true;
          player.speedBoostActive = true;
          player.speedBoostTimer = SPEED_BOOST_DURATION;
          score += CRYSTAL_POINTS;
          levelScore += CRYSTAL_POINTS;
        }
      }
    }

    if (player.y > height + 100) {
      lives--;
      if (lives > 0) {
        _resetPlayer();
      } else {
        // Out of lives: reset to level 1 and restore lives
        currentLevel = 1;
        lives = 5;
        score = 0;
        levelScore = 0;
        _initGame();
        _resetPlayer();
      }
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
      if (currentLevel < 7) {
        // Start flash transition to next level
        flashTransitionActive = true;
        flashTransitionTimer = 0;
        flashTransitionNextLevel = currentLevel + 1;
        // Play woosh sound
        if (wooshSound) {
          wooshSound.currentTime = 0;
          wooshSound.play();
        }
      } else if (currentLevel === 7) {
        // Start flash transition to YOU WIN
        flashTransitionActive = true;
        flashTransitionTimer = 0;
        flashTransitionNextLevel = 8;
        // Play woosh sound
        if (wooshSound) {
          wooshSound.currentTime = 0;
          wooshSound.play();
        }
      }
    }
    // Advance mascott animation when game is won
    if (gameWon) {
      mascottTimer += dt;
      if (mascottTimer >= 0.06) {
        mascottTimer = 0;
        mascottFrame = (mascottFrame + 1) % (mascottFrames.length || 1);
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

    // Enhanced landing logic for moving platforms (especially vertical)
    let platformVy = 0;
    if (currentLevel === 7 && platform.moving === 'y' && platform.baseY !== undefined) {
      // Approximate platform vertical velocity
      const t = performance.now() / 1000;
      const prevYPlat = platform.baseY + Math.sin((t - 0.016) * platform.speed) * platform.range;
      platformVy = (platform.y - prevYPlat) / 0.016;
    }
    let landing = false;
    if (
      prevY + player.h <= pTop && plBottom >= pTop &&
      (
        player.vy >= 0 ||
        (currentLevel === 7 && platform.moving === 'y' && platformVy > 0 && player.vy > platformVy - 2)
      )
    ) {
      landing = true;
    }
    if (landing) {
      player.y = pTop - player.h;
      player.vy = 0;
      player.onGround = true;
      // If player lands on a moving platform in Level 7, track it
      if (currentLevel === 7 && (platform.moving === 'x' || platform.moving === 'y')) {
        playerOnMovingPlatform = platform;
        playerOffsetOnPlatformX = player.x - platform.x;
        playerOffsetOnPlatformY = platform.h;
      } else {
        playerOnMovingPlatform = null;
      }
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

    // Draw per-level background if available, otherwise forest fallback
    const bgImg = vgBackgrounds[currentLevel] || forestBg;
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else if (forestBg.complete && forestBg.naturalWidth > 0) {
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
  ctx.fillStyle = '#ff2222'; // bright red
  ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
  ctx.fillStyle = '#ff5555'; // lighter red for bottom edge
  ctx.fillRect(p.x - p.w / 2, p.y + p.h, p.w, 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x - p.w / 2, p.y, p.w, p.h);
      }
    }
    // Draw magnets as animated frames
    for (const magnet of magnets) {
      if (!magnet.collected) {
        if (magnetFrames && magnetFrames.length > 0) {
          const frame = magnetFrames[magnet.animationFrame % magnetFrames.length];
          if (frame.complete && frame.naturalWidth > 0 && frame.naturalHeight > 0) {
            // Scale magnet animation to match the size of the drawn magnet (r: 18)
            // The magnet animation frames should be scaled appropriately
            const scale = 0.8; // Adjust this to match desired magnet size
            const drawW = frame.naturalWidth * scale;
            const drawH = frame.naturalHeight * scale;
            // Draw centered on magnet position
            ctx.save();
            ctx.drawImage(frame, magnet.x - drawW / 2, magnet.y - drawH / 2, drawW, drawH);
            ctx.restore();
          }
        }
      }
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
  ctx.fillRect(0, 0, 350, 130);

  ctx.fillStyle = '#fff';
  ctx.font = `bold 16px Arial`;
  ctx.textBaseline = 'top';
  ctx.fillText(`Level: ${currentLevel}`, 16, 12);
  ctx.fillText(`Score: ${score}`, 16, 32);
  ctx.fillText(`Coins: ${coinsCollected}/${totalCoins}`, 16, 52);

    // Draw lives as hearts at the top right
    const heartCount = 5;
    const heartSize = 22;
    const heartPad = 8;
    const startX = width - (heartSize + heartPad) * heartCount - 16 + heartPad;
    const y = 18;
    for (let i = 0; i < heartCount; i++) {
      const x = startX + i * (heartSize + heartPad);
      ctx.save();
      ctx.beginPath();
      // Draw a heart shape
      ctx.moveTo(x + heartSize/2, y + heartSize*0.72);
      ctx.bezierCurveTo(x + heartSize*1.1, y + heartSize*0.15, x + heartSize*0.8, y - heartSize*0.25, x + heartSize/2, y + heartSize*0.18);
      ctx.bezierCurveTo(x + heartSize*0.2, y - heartSize*0.25, x - heartSize*0.1, y + heartSize*0.15, x + heartSize/2, y + heartSize*0.72);
      ctx.closePath();
      ctx.fillStyle = i < lives ? '#ff2d55' : '#bbb';
      ctx.globalAlpha = i < lives ? 1 : 0.3;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
    // Level 6 timer progress bar (center top, red)
    if (currentLevel === 6 && !gameWon) {
      let timerBarW = 220, timerBarH = 18;
      let timerBarX = Math.floor((width - timerBarW) / 2);
      let timerBarY = 48;
      ctx.fillStyle = '#222';
      ctx.fillRect(timerBarX, timerBarY, timerBarW, timerBarH);
      ctx.fillStyle = '#ff3333';
      let pct = Math.max(0, Math.min(1, level6Timer / LEVEL6_TIME_LIMIT));
      ctx.fillRect(timerBarX, timerBarY, timerBarW * pct, timerBarH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(timerBarX, timerBarY, timerBarW, timerBarH);
      ctx.font = 'bold 15px Arial';
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(`Time Left: ${level6Timer.toFixed(1)}s`, timerBarX + timerBarW / 2, timerBarY + timerBarH / 2);
    }


    // Status bars for powerups - top center
    let barW = 180, barH = 16, pad = 8;
    let totalBars = (player.speedBoostActive ? 1 : 0) + (player.magnetActive ? 1 : 0);
    let barsDrawn = 0;
    let startY = 16; // distance from top
    let totalHeight = totalBars * barH + (totalBars > 1 ? (totalBars - 1) * pad : 0);
    let barX = Math.floor((width - barW) / 2);
    let barY = startY + Math.floor((0.5 * (60 - totalHeight))); // center in 60px region
    if (player.speedBoostActive) {
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ff6b6b';
      let pct = Math.max(0, Math.min(1, player.speedBoostTimer / SPEED_BOOST_DURATION));
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.font = 'bold 13px Arial';
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ SPEED BOOST', barX + 8, barY + barH / 2);
      barY += barH + pad;
      barsDrawn++;
    }
    if (player.magnetActive) {
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ff3333';
      let pct = Math.max(0, Math.min(1, player.magnetTimer / 3.0));
      ctx.fillRect(barX, barY, barW * pct, barH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.font = 'bold 13px Arial';
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('🧲 MAGNET POWER', barX + 8, barY + barH / 2);
      barY += barH + pad;
      barsDrawn++;
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

      // Draw mascott animation to the right of the YOU WIN text
      if (mascottFrames && mascottFrames.length > 0) {
        const mf = mascottFrames[mascottFrame % mascottFrames.length];
        if (mf.complete && mf.naturalWidth > 0 && mf.naturalHeight > 0) {
          const scale = 0.35; // medium size
          const drawW = mf.naturalWidth * scale;
          const drawH = mf.naturalHeight * scale;
          const x = width / 2 + 220; // place to the right of text
          const y = height / 2 - drawH / 2 - 20;
          ctx.drawImage(mf, x - drawW/2, y, drawW, drawH);
        }
      }

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
    // Translate to player position
    ctx.translate(pl.x, pl.y);

    const w = pl.w;
    const h = pl.h;

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 2, w * 0.6, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Determine which frame set to draw
    let frame = null;
    const set = pl._currentFrameSet || 'forward';
    if (set === 'jump' && jumpFrames.length > 0) {
      frame = jumpFrames[pl.animationFrame % jumpFrames.length];
    } else if (set === 'backwards' && animationFrames.length > 0) {
      // Play forward frames in reverse order for backwards animation
      const idx = pl.animationFrame % animationFrames.length;
      const revIdx = (animationFrames.length - 1) - idx;
      frame = animationFrames[revIdx];
    } else if (animationFrames.length > 0) {
      frame = animationFrames[pl.animationFrame % animationFrames.length];
    }
    if (frame && frame.complete && frame.naturalWidth > 0 && frame.naturalHeight > 0) {
      // Use the same visual scale as other animations (match previous small scale)
      const scale = 0.18;
      const drawW = frame.naturalWidth * scale;
      const drawH = frame.naturalHeight * scale;
      // Keep the touch/bridge point at the same relative position as before (0.62)
      const offsetX = (w / 2) - (drawW / 2);
      const offsetY = h - (drawH * 0.62);
      ctx.save();
      ctx.filter = 'brightness(1.55)';
      ctx.drawImage(frame, offsetX, offsetY, drawW, drawH);
      ctx.filter = 'none';
      ctx.restore();
    }


    ctx.restore();
  }

  // ==========================================================================
  // BACKDOOR: Type 'snr' to skip level with max points
  // ==========================================================================
  const keyBuffer = [];
  window.addEventListener('keydown', (e) => {
    // Only allow letters for the cheat
    if (/^[a-zA-Z]$/.test(e.key)) {
      keyBuffer.push(e.key);
      if (keyBuffer.length > 4) keyBuffer.shift();
      if (keyBuffer.join('') === 'snr') {
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
    if (currentLevel < 7) {
      currentLevel++;
      gameWon = false;
      _resetPlayer();
      _initGame();
    } else {
      gameWon = true;
    }
  }

})();

