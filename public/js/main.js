// main.js — Entry point, game loop
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const LOGICAL_W = Track.CANVAS_W; // 1400
  const LOGICAL_H = Track.CANVAS_H; // 900

  canvas.width = LOGICAL_W;
  canvas.height = LOGICAL_H;

  function resizeCanvas() {
    const windowW = window.innerWidth || document.documentElement.clientWidth || LOGICAL_W;
    const windowH = window.innerHeight || document.documentElement.clientHeight || LOGICAL_H;
    const scale = Math.min(windowW / LOGICAL_W, windowH / LOGICAL_H) || 1;
    canvas.style.width = Math.floor(LOGICAL_W * scale) + 'px';
    canvas.style.height = Math.floor(LOGICAL_H * scale) + 'px';
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  // Re-resize after a short delay to handle late layout
  setTimeout(resizeCanvas, 100);

  // Initialize systems
  Game.initInput();
  GameAudio.init();

  // Fixed timestep game loop
  const FIXED_DT = 1 / 60;
  const MAX_DT = 0.05; // Cap to prevent spiral of death
  let lastTime = 0;
  let accumulator = 0;
  let gameTime = 0;

  function gameLoop(timestamp) {
    if (lastTime === 0) {
      lastTime = timestamp;
    }

    const rawDt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap delta time
    const dt = Math.min(rawDt, MAX_DT);
    accumulator += dt;

    // Fixed timestep updates
    while (accumulator >= FIXED_DT) {
      Game.update(FIXED_DT);
      gameTime += FIXED_DT;
      accumulator -= FIXED_DT;
    }

    // Render
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    Game.render(ctx, LOGICAL_W, LOGICAL_H, gameTime);

    requestAnimationFrame(gameLoop);
  }

  // Start the loop
  requestAnimationFrame(gameLoop);
})();
