// game.js — Core game state machine
const Game = (() => {
  // States
  const LOADING = 'LOADING';
  const MAIN_MENU = 'MAIN_MENU';
  const TRACK_SELECT = 'TRACK_SELECT';
  const HOW_TO_PLAY = 'HOW_TO_PLAY';
  const CREDITS = 'CREDITS';
  const COUNTDOWN = 'COUNTDOWN';
  const RACING = 'RACING';
  const PAUSED = 'PAUSED';
  const RESULTS = 'RESULTS';

  let state = LOADING;
  let selectedTrackIndex = 0;
  let menuIndex = 0;
  let resultsIndex = 0;

  // Race data
  let trackData = null;
  let trackCanvas = null;
  let cars = [];
  let aiControllers = [];
  let startFinishLine = null;
  let raceTime = 0;
  let countdownValue = 3;
  let countdownTimer = 0;
  let lastCountdownBeep = -1;
  let showTrackNameTimer = 3;
  let finalLapAlpha = 0;
  let finalLapShown = false;
  let checkeredAlpha = 0;
  let raceEndTimer = 0;
  let playerFinished = false;
  let squealCooldown = 0;

  // Input state
  const keys = {};
  let prevKeys = {};

  function initInput() {
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      keys[e.code] = true;
      // Prevent arrow keys from scrolling page
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      keys[e.key] = false;
      keys[e.code] = false;
    });
  }

  function justPressed(key) {
    return keys[key] && !prevKeys[key];
  }

  function setState(newState) {
    const oldState = state;
    state = newState;

    if (newState === MAIN_MENU) {
      menuIndex = 0;
      GameAudio.stopEngine();
      GameAudio.startMenuMusic();
    }
    if (oldState === MAIN_MENU) {
      GameAudio.stopMenuMusic();
    }
    if (newState === COUNTDOWN) {
      setupRace();
    }
  }

  function setupRace() {
    trackData = Track.getTrack(selectedTrackIndex);
    trackCanvas = Track.renderTrackToCanvas(trackData);
    startFinishLine = Track.getStartFinishLine(trackData);

    const gridPositions = Track.getGridPositions(trackData, 5);
    cars = [];
    aiControllers = [];

    // Player car
    const pg = gridPositions[0];
    cars.push(Car.createCar(0, pg.x, pg.y, pg.angle, true));

    // AI cars
    for (let i = 1; i < 5; i++) {
      const g = gridPositions[i];
      const aiCar = Car.createCar(i, g.x, g.y, g.angle, false);
      cars.push(aiCar);
      aiControllers.push(AI.createAIController(i - 1, trackData));
    }

    raceTime = 0;
    countdownValue = 3;
    countdownTimer = 0;
    lastCountdownBeep = -1;
    showTrackNameTimer = 3;
    finalLapAlpha = 0;
    finalLapShown = false;
    checkeredAlpha = 0;
    raceEndTimer = 0;
    playerFinished = false;
    squealCooldown = 0;

    UI.initSkidCanvas(Track.CANVAS_W, Track.CANVAS_H);
    UI.clearSkidMarks();

    GameAudio.startEngine();
  }

  function getPlayerCar() {
    return cars.find(c => c.isPlayer);
  }

  function update(dt) {
    switch (state) {
      case LOADING:
        // Immediately transition
        setState(MAIN_MENU);
        break;

      case MAIN_MENU:
        updateMainMenu(dt);
        break;

      case TRACK_SELECT:
        updateTrackSelect(dt);
        break;

      case HOW_TO_PLAY:
        if (justPressed('Escape') || justPressed('Enter')) {
          setState(MAIN_MENU);
        }
        break;

      case CREDITS:
        if (justPressed('Escape') || justPressed('Enter')) {
          setState(MAIN_MENU);
        }
        break;

      case COUNTDOWN:
        updateCountdown(dt);
        break;

      case RACING:
        updateRacing(dt);
        break;

      case PAUSED:
        if (justPressed('Escape')) {
          setState(RACING);
        }
        break;

      case RESULTS:
        updateResults(dt);
        break;
    }

    // Save previous key state
    prevKeys = { ...keys };
  }

  function updateMainMenu(dt) {
    if (justPressed('ArrowUp') || justPressed('w') || justPressed('W')) {
      menuIndex = (menuIndex - 1 + 4) % 4;
    }
    if (justPressed('ArrowDown') || justPressed('s') || justPressed('S')) {
      menuIndex = (menuIndex + 1) % 4;
    }
    if (justPressed('Enter')) {
      GameAudio.init();
      GameAudio.resume();
      switch (menuIndex) {
        case 0: setState(COUNTDOWN); break;
        case 1: setState(TRACK_SELECT); break;
        case 2: setState(HOW_TO_PLAY); break;
        case 3: setState(CREDITS); break;
      }
    }
  }

  function updateTrackSelect(dt) {
    if (justPressed('ArrowUp') || justPressed('w') || justPressed('W')) {
      selectedTrackIndex = (selectedTrackIndex - 1 + Track.getTrackCount()) % Track.getTrackCount();
    }
    if (justPressed('ArrowDown') || justPressed('s') || justPressed('S')) {
      selectedTrackIndex = (selectedTrackIndex + 1) % Track.getTrackCount();
    }
    if (justPressed('Enter')) {
      setState(MAIN_MENU);
    }
    if (justPressed('Escape')) {
      setState(MAIN_MENU);
    }
  }

  function updateCountdown(dt) {
    countdownTimer += dt;

    const newValue = 3 - Math.floor(countdownTimer);
    if (newValue !== countdownValue) {
      countdownValue = newValue;
    }

    // Play beeps
    const beepAt = Math.floor(countdownTimer);
    if (beepAt !== lastCountdownBeep && beepAt <= 3) {
      lastCountdownBeep = beepAt;
      GameAudio.playCountdownBeep(beepAt === 3);
    }

    if (countdownTimer >= 4) {
      setState(RACING);
    }
  }

  function updateRacing(dt) {
    if (justPressed('Escape')) {
      state = PAUSED;
      return;
    }

    raceTime += dt;
    showTrackNameTimer -= dt;

    const player = getPlayerCar();

    // Player input
    player.state.throttle = (keys['ArrowUp'] || keys['w'] || keys['W']) ? 1 : 0;
    player.state.brake = (keys['ArrowDown'] || keys['s'] || keys['S']) ? 1 : 0;
    player.state.steer = 0;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.state.steer = -1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.state.steer = 1;
    player.state.handbrake = keys[' '] || false;

    // Update all car physics
    for (const car of cars) {
      Physics.updateCarPhysics(car.state, dt, trackData);
    }

    // AI updates
    const aiCars = cars.filter(c => !c.isPlayer);
    for (let i = 0; i < aiCars.length; i++) {
      AI.updateAI(aiCars[i], aiControllers[i], trackData, cars, dt, player);
    }

    // Car-to-car collisions
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const result = Physics.resolveCarCollision(cars[i].state, cars[j].state);
        if (result.hit) {
          GameAudio.playCollision();
          UI.spawnCollisionParticles(result.x, result.y);
        }
      }
    }

    // Lap counting
    const prevPlayerLaps = player.laps;
    for (const car of cars) {
      const prevLaps = car.laps;
      Car.updateLapCounting(car, trackData, startFinishLine, raceTime);

      // Lap chime for player
      if (car.isPlayer && car.laps > prevLaps && car.laps > 0 && !car.finished) {
        GameAudio.playLapChime();
      }

      // Final lap detection
      if (car.isPlayer && car.laps === 2 && prevLaps === 1 && !finalLapShown) {
        finalLapAlpha = 2.0;
        finalLapShown = true;
      }

      // Finish detection
      if (car.isPlayer && car.finished && !playerFinished) {
        playerFinished = true;
        checkeredAlpha = 3.0;
        GameAudio.playFanfare();
        GameAudio.stopEngine();
      }
    }

    // Fade effects
    if (finalLapAlpha > 0) finalLapAlpha -= dt * 0.8;
    if (checkeredAlpha > 0) checkeredAlpha -= dt * 0.5;

    // Race end timer (after player finishes or all finish)
    if (playerFinished) {
      raceEndTimer += dt;
      if (raceEndTimer > 5 || cars.every(c => c.finished)) {
        setState(RESULTS);
      }
    }

    // Skid marks
    if (player.state.drifting) {
      UI.addSkidMark(player.state.x, player.state.y, player.state.angle);
      squealCooldown -= dt;
      if (squealCooldown <= 0) {
        GameAudio.playSqueal();
        squealCooldown = 0.3;
      }
    } else {
      squealCooldown = 0;
    }

    // Update audio engine
    GameAudio.updateEngine(player.state.speed, player.state.maxSpeed);

    // Update particles
    UI.updateParticles(dt);
  }

  function updateResults(dt) {
    if (justPressed('ArrowLeft') || justPressed('a') || justPressed('A')) {
      resultsIndex = 0;
    }
    if (justPressed('ArrowRight') || justPressed('d') || justPressed('D')) {
      resultsIndex = 1;
    }
    if (justPressed('Enter')) {
      if (resultsIndex === 0) {
        setState(COUNTDOWN);
      } else {
        setState(MAIN_MENU);
      }
    }
  }

  function render(ctx, W, H, time) {
    switch (state) {
      case LOADING:
        UI.drawLoading(ctx, W, H, 1);
        break;

      case MAIN_MENU:
        UI.drawMainMenu(ctx, W, H, menuIndex, time);
        break;

      case TRACK_SELECT:
        UI.drawMainMenu(ctx, W, H, 1, time);
        UI.drawTrackSelect(ctx, W, H, selectedTrackIndex, time);
        break;

      case HOW_TO_PLAY:
        UI.drawMainMenu(ctx, W, H, 2, time);
        UI.drawHowToPlay(ctx, W, H);
        break;

      case CREDITS:
        UI.drawMainMenu(ctx, W, H, 3, time);
        UI.drawCredits(ctx, W, H, time);
        break;

      case COUNTDOWN:
      case RACING:
      case PAUSED:
        renderRaceScene(ctx, W, H, time);
        break;

      case RESULTS:
        UI.drawResults(ctx, W, H, cars, time, resultsIndex);
        break;
    }
  }

  function renderRaceScene(ctx, W, H, time) {
    // Track (pre-rendered)
    if (trackCanvas) {
      ctx.drawImage(trackCanvas, 0, 0);
    }

    // Skid marks
    UI.drawSkidMarks(ctx);

    // Draw cars (sorted by y for basic depth)
    const sortedCars = [...cars].sort((a, b) => a.state.y - b.state.y);
    for (const car of sortedCars) {
      Car.drawCar(ctx, car, time);
    }

    // Particles
    UI.drawParticles(ctx);

    // HUD
    const player = getPlayerCar();
    if (player) {
      UI.drawHUD(ctx, W, H, player, cars, raceTime, trackData.name, showTrackNameTimer, time);

      // Minimap
      UI.drawMinimap(ctx, trackData, cars, 10, H - 120, 160, 100);
    }

    // Overlays
    if (state === COUNTDOWN) {
      const displayValue = countdownValue >= 1 ? countdownValue : 0;
      if (countdownTimer < 4) {
        UI.drawCountdown(ctx, W, H, displayValue, time);
      }
    }

    if (state === RACING) {
      UI.drawFinalLap(ctx, W, H, finalLapAlpha);
      UI.drawCheckeredFlag(ctx, W, H, checkeredAlpha);
    }

    if (state === PAUSED) {
      UI.drawPause(ctx, W, H);
    }
  }

  return {
    initInput,
    update,
    render,
    getState: () => state,
  };
})();
