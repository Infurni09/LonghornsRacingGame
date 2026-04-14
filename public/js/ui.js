// ui.js — HUD, menus, lap counter, overlays (Crimson Maroon + Race Arcade style)
const UI = (() => {
  const MAROON = '#7B0000';
  const MAROON_LIGHT = '#A30000';
  const MAROON_DARK = '#500000';
  const CREAM = '#F0E6D6';
  const BG_DARK = '#1A0808';

  // ========================
  // MAIN MENU
  // ========================
  function drawMainMenu(ctx, W, H, selectedIndex, time) {
    // Deep crimson-black background
    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, W, H);

    // Subtle animated track outline in background
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = MAROON_LIGHT;
    ctx.lineWidth = 3;
    const scrollOffset = time * 20;
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const a = (Math.PI * 2 * i) / 80;
      const r = 280 + Math.sin(a * 3 + scrollOffset * 0.01) * 40;
      const x = W / 2 + Math.cos(a + scrollOffset * 0.002) * r;
      const y = H / 2 + Math.sin(a + scrollOffset * 0.002) * r * 0.6;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Longhorn logo
    Assets.drawLonghornLogo(ctx, W / 2, 220, 2.0);

    // Title — crimson maroon
    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF2222';
    ctx.shadowBlur = 12;
    ctx.fillText('LONGHORNS RACING', W / 2, 100);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = CREAM;
    ctx.font = 'italic 28px monospace';
    ctx.fillText('The Game', W / 2, 145);

    // Menu items
    const items = ['START RACE', 'SELECT TRACK', 'HOW TO PLAY', 'CREDITS'];
    const startY = 420;
    const spacing = 60;

    items.forEach((item, i) => {
      const y = startY + i * spacing;
      const isSelected = i === selectedIndex;
      const hover = isSelected ? Math.sin(time * 6) * 3 : 0;

      if (isSelected) {
        ctx.fillStyle = MAROON;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(W / 2 - 180, y - 22, 360, 44);
        ctx.globalAlpha = 1;

        ctx.fillStyle = MAROON_LIGHT;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('\u25B6', W / 2 - 140 + hover, y);
      }

      ctx.fillStyle = isSelected ? '#FFFFFF' : CREAM;
      ctx.font = `bold ${isSelected ? 30 : 26}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(item, W / 2, y);
    });

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Use \u2191\u2193 to navigate, ENTER to select', W / 2, H - 40);
  }

  // ========================
  // TRACK SELECT OVERLAY
  // ========================
  function drawTrackSelect(ctx, W, H, selectedTrack, time) {
    ctx.fillStyle = 'rgba(15,4,4,0.92)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT TRACK', W / 2, 100);

    const trackNames = [];
    for (let i = 0; i < Track.getTrackCount(); i++) trackNames.push(Track.getTrackName(i));

    trackNames.forEach((name, i) => {
      const y = 220 + i * 120;
      const isSelected = i === selectedTrack;

      ctx.strokeStyle = isSelected ? MAROON_LIGHT : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(W / 2 - 250, y - 35, 500, 80);

      if (isSelected) {
        ctx.fillStyle = 'rgba(123,0,0,0.2)';
        ctx.fillRect(W / 2 - 250, y - 35, 500, 80);
      }

      ctx.fillStyle = isSelected ? '#FFFFFF' : CREAM;
      ctx.font = `bold ${isSelected ? 28 : 24}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`TRACK ${i + 1}: ${name.toUpperCase()}`, W / 2, y);

      // Mini track preview
      const previewTrack = Track.getTrack(i);
      const wp = previewTrack.waypoints;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of wp) {
        if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
      }
      const pw = 80, ph = 50;
      const ps = Math.min(pw / (maxX - minX || 1), ph / (maxY - minY || 1));
      const px = W / 2 + 180, py = y;

      ctx.strokeStyle = isSelected ? MAROON_LIGHT : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let j = 0; j < wp.length; j++) {
        const mx = px + (wp[j].x - (minX + maxX) / 2) * ps;
        const my = py + (wp[j].y - (minY + maxY) / 2) * ps;
        if (j === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
      }
      ctx.closePath();
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Use \u2191\u2193 to select, ENTER to confirm, ESC to go back', W / 2, H - 60);
  }

  // ========================
  // HOW TO PLAY OVERLAY
  // ========================
  function drawHowToPlay(ctx, W, H) {
    ctx.fillStyle = 'rgba(15,4,4,0.95)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', W / 2, 100);

    const controls = [
      ['\u2191 / W', 'Accelerate'],
      ['\u2193 / S', 'Brake / Reverse'],
      ['\u2190 / A', 'Steer Left'],
      ['\u2192 / D', 'Steer Right'],
      ['SPACE', 'Handbrake (Drift)'],
      ['ESC', 'Pause'],
    ];

    ctx.font = '22px monospace';
    controls.forEach(([key, action], i) => {
      const y = 200 + i * 50;
      ctx.fillStyle = MAROON_LIGHT;
      ctx.textAlign = 'right';
      ctx.fillText(key, W / 2 - 30, y);
      ctx.fillStyle = CREAM;
      ctx.textAlign = 'left';
      ctx.fillText(action, W / 2 + 30, y);
    });

    ctx.fillStyle = CREAM;
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Complete 3 laps to finish the race!', W / 2, 550);
    ctx.fillText('Stay on the track for maximum speed.', W / 2, 585);
    ctx.fillText('Use the handbrake to drift around tight corners.', W / 2, 620);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px monospace';
    ctx.fillText('Press ESC or ENTER to go back', W / 2, H - 60);
  }

  // ========================
  // CREDITS OVERLAY
  // ========================
  function drawCredits(ctx, W, H, time) {
    ctx.fillStyle = 'rgba(15,4,4,0.95)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CREDITS', W / 2, 120);

    Assets.drawLonghornLogo(ctx, W / 2, 250, 1.5);

    const lines = [
      'LONGHORNS RACING: THE GAME', '',
      'Built with HTML5 Canvas & JavaScript', '',
      'Procedural Audio by Web Audio API',
      'No external assets required', '',
      'Hook \'em Horns! \ud83e\udd18',
    ];

    ctx.font = '20px monospace';
    ctx.fillStyle = CREAM;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 360 + i * 35));

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px monospace';
    ctx.fillText('Press ESC or ENTER to go back', W / 2, H - 60);
  }

  // ========================
  // RACE HUD
  // ========================
  function drawHUD(ctx, W, H, playerCar, cars, raceTime, trackName, showTrackName, time) {
    const positions = Car.getRacePositions(cars);
    const playerPos = positions.findIndex(c => c.isPlayer) + 1;
    const currentLap = Math.min(playerCar.laps + 1, 3);
    const lapTime = raceTime - playerCar.currentLapStart;
    const speed = Car.getSpeedKMH(playerCar);
    const gear = Car.getGear(playerCar);

    // Top-left: Lap info
    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(10, 10, 200, 85);
    ctx.strokeStyle = 'rgba(123,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 200, 85);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LAP ${currentLap} / 3`, 22, 38);

    ctx.fillStyle = CREAM;
    ctx.font = '18px monospace';
    ctx.fillText(formatTime(lapTime), 22, 62);

    if (playerCar.bestLap < Infinity) {
      ctx.fillStyle = '#66DD66';
      ctx.font = '16px monospace';
      ctx.fillText(`BEST: ${formatTime(playerCar.bestLap)}`, 22, 84);
    }

    // Top-center: Position
    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(W / 2 - 50, 10, 100, 55);
    ctx.strokeStyle = 'rgba(123,0,0,0.4)';
    ctx.strokeRect(W / 2 - 50, 10, 100, 55);

    ctx.fillStyle = playerPos === 1 ? '#FFD700' : '#FFFFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${playerPos}`, W / 2, 48);

    // Track name banner (fades)
    if (showTrackName > 0) {
      ctx.globalAlpha = Math.min(1, showTrackName);
      ctx.fillStyle = MAROON_LIGHT;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(trackName.toUpperCase(), W / 2, 90);
      ctx.globalAlpha = 1;
    }

    // Top-right: Standings
    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(W - 210, 10, 200, 30 * cars.length + 15);
    ctx.strokeStyle = 'rgba(123,0,0,0.4)';
    ctx.strokeRect(W - 210, 10, 200, 30 * cars.length + 15);

    positions.forEach((car, i) => {
      const y = 32 + i * 28;

      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.arc(W - 190, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = i === 0 ? '#FFD700' : (car.isPlayer ? MAROON_LIGHT : '#FFFFFF');
      ctx.font = car.isPlayer ? 'bold 16px monospace' : '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${car.name}`, W - 178, y + 5);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`L${Math.min(car.laps + 1, 3)}`, W - 18, y + 5);
    });

    // Bottom-center: Speed bar
    const barW = 250, barH = 20;
    const barX = W / 2 - barW / 2;
    const barY = H - 60;

    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(barX - 10, barY - 30, barW + 20, 65);
    ctx.strokeStyle = 'rgba(123,0,0,0.4)';
    ctx.strokeRect(barX - 10, barY - 30, barW + 20, 65);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, barH);

    const speedRatio = Math.abs(playerCar.state.speed) / playerCar.state.maxSpeed;
    ctx.fillStyle = MAROON_LIGHT;
    ctx.fillRect(barX, barY, barW * Math.min(speedRatio, 1), barH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speed} KM/H`, W / 2, barY - 8);

    // Bottom-right: Gear + Revs
    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(W - 140, H - 70, 130, 60);
    ctx.strokeStyle = 'rgba(123,0,0,0.4)';
    ctx.strokeRect(W - 140, H - 70, 130, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`GEAR ${gear}`, W - 130, H - 46);

    const revW = 110, revH = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(W - 130, H - 30, revW, revH);
    const revRatio = speedRatio % 0.25 * 4;
    ctx.fillStyle = revRatio > 0.8 ? '#FF3333' : MAROON_LIGHT;
    ctx.fillRect(W - 130, H - 30, revW * revRatio, revH);

    drawMuteButton(ctx, W - 40, 10 + 30 * cars.length + 30);
  }

  function drawMuteButton(ctx, x, y) {
    const muted = GameAudio.isMuted();
    ctx.fillStyle = 'rgba(10,2,2,0.6)';
    ctx.fillRect(x - 15, y, 30, 25);
    ctx.fillStyle = muted ? '#FF3333' : '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(muted ? 'MUTE' : '\u266A', x, y + 17);
  }

  // ========================
  // COUNTDOWN
  // ========================
  function drawCountdown(ctx, W, H, countValue, time) {
    const text = countValue > 0 ? String(countValue) : 'GO!';
    const scale = 1 + Math.sin(time * 12) * 0.05;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);

    ctx.fillStyle = countValue > 0 ? '#FFFFFF' : '#00FF44';
    ctx.font = `bold ${countValue > 0 ? 120 : 90}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = countValue > 0 ? MAROON_LIGHT : '#00FF44';
    ctx.shadowBlur = 20;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ========================
  // FINAL LAP BANNER
  // ========================
  function drawFinalLap(ctx, W, H, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(123,0,0,0.35)';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = MAROON_LIGHT;
    ctx.shadowBlur = 15;
    ctx.fillText('FINAL LAP!', W / 2, H / 2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ========================
  // CHECKERED FLAG
  // ========================
  function drawCheckeredFlag(ctx, W, H, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, H / 2 - 50, W, 100);

    const squareSize = 20;
    for (let x = W / 2 - 100; x < W / 2 + 100; x += squareSize) {
      for (let y = H / 2 - 50; y < H / 2 + 50; y += squareSize) {
        const col = Math.floor((x - (W / 2 - 100)) / squareSize);
        const row = Math.floor((y - (H / 2 - 50)) / squareSize);
        ctx.fillStyle = (col + row) % 2 === 0 ? '#FFFFFF' : '#1A1A1A';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH!', W / 2, H / 2 + 80);
    ctx.restore();
  }

  // ========================
  // PAUSE OVERLAY
  // ========================
  function drawPause(ctx, W, H) {
    ctx.fillStyle = 'rgba(15,4,4,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', W / 2, H / 2 - 30);

    ctx.font = '24px monospace';
    ctx.fillStyle = CREAM;
    ctx.fillText('Press ESC to resume', W / 2, H / 2 + 30);
  }

  // ========================
  // RESULTS SCREEN
  // ========================
  function drawResults(ctx, W, H, cars, time, selectedIndex) {
    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, W, H);

    const positions = Car.getRacePositions(cars);
    const winner = positions[0];

    if (winner && winner.isPlayer) {
      Assets.drawTrophy(ctx, W / 2, 130, 1.5, time);
    }

    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RACE RESULTS', W / 2, winner && winner.isPlayer ? 230 : 100);

    const startY = winner && winner.isPlayer ? 290 : 180;
    positions.forEach((car, i) => {
      const y = startY + i * 65;
      const isPlayer = car.isPlayer;

      if (isPlayer) {
        ctx.fillStyle = 'rgba(123,0,0,0.25)';
        ctx.fillRect(W / 2 - 300, y - 22, 600, 50);
      }

      const posColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#FFFFFF', '#FFFFFF'];
      ctx.fillStyle = posColors[i] || '#FFFFFF';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}.`, W / 2 - 260, y + 8);

      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.arc(W / 2 - 210, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isPlayer ? MAROON_LIGHT : CREAM;
      ctx.font = `${isPlayer ? 'bold ' : ''}24px monospace`;
      ctx.fillText(car.name, W / 2 - 190, y + 8);

      ctx.fillStyle = CREAM;
      ctx.font = '22px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(car.finished ? formatTime(car.finishTime) : 'DNF', W / 2 + 260, y + 8);
    });

    // Buttons
    const buttons = ['RACE AGAIN', 'MAIN MENU'];
    const buttonY = startY + positions.length * 65 + 40;
    buttons.forEach((label, i) => {
      const x = W / 2 + (i === 0 ? -120 : 120);
      const isSelected = i === selectedIndex;

      ctx.fillStyle = isSelected ? MAROON : 'rgba(255,255,255,0.1)';
      ctx.fillRect(x - 100, buttonY - 20, 200, 45);
      ctx.strokeStyle = isSelected ? MAROON_LIGHT : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 100, buttonY - 20, 200, 45);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, buttonY + 10);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Use \u2190\u2192 to select, ENTER to confirm', W / 2, H - 40);
  }

  // ========================
  // LOADING SCREEN
  // ========================
  function drawLoading(ctx, W, H, progress) {
    ctx.fillStyle = BG_DARK;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = MAROON_LIGHT;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING...', W / 2, H / 2 - 30);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(W / 2 - 150, H / 2, 300, 20);
    ctx.fillStyle = MAROON_LIGHT;
    ctx.fillRect(W / 2 - 150, H / 2, 300 * progress, 20);
  }

  // ========================
  // MINIMAP
  // ========================
  function drawMinimap(ctx, trackData, cars, x, y, w, h) {
    const info = Track.renderMinimap(ctx, trackData, x, y, w, h);
    for (const car of cars) {
      const pos = Track.worldToMinimap(info, car.state.x, car.state.y);
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, car.isPlayer ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (car.isPlayer) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // ========================
  // PARTICLES
  // ========================
  const particles = [];

  function spawnCollisionParticles(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color: Math.random() > 0.5 ? '#FFAA44' : '#FFDD88',
        size: 2 + Math.random() * 2,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles(ctx) {
    for (const p of particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ========================
  // SKID MARKS
  // ========================
  let skidCanvas = null;
  let skidCtx = null;
  const MAX_SKIDS = 200;
  let skidCount = 0;

  function initSkidCanvas(W, H) {
    skidCanvas = document.createElement('canvas');
    skidCanvas.width = W;
    skidCanvas.height = H;
    skidCtx = skidCanvas.getContext('2d');
    skidCount = 0;
  }

  function addSkidMark(x, y, angle) {
    if (!skidCtx) return;
    if (skidCount >= MAX_SKIDS) {
      skidCtx.clearRect(0, 0, skidCanvas.width, skidCanvas.height);
      skidCount = 0;
    }
    skidCtx.save();
    skidCtx.translate(x, y);
    skidCtx.rotate(angle);
    skidCtx.fillStyle = 'rgba(30,30,30,0.35)';
    skidCtx.beginPath();
    skidCtx.ellipse(0, 0, 3, 8, 0, 0, Math.PI * 2);
    skidCtx.fill();
    skidCtx.restore();
    skidCount++;
  }

  function drawSkidMarks(ctx) {
    if (skidCanvas) ctx.drawImage(skidCanvas, 0, 0);
  }

  function clearSkidMarks() {
    if (skidCtx) {
      skidCtx.clearRect(0, 0, skidCanvas.width, skidCanvas.height);
      skidCount = 0;
    }
  }

  // ========================
  // HELPERS
  // ========================
  function formatTime(ms) {
    if (ms === undefined || ms === null || ms < 0) return '0:00.00';
    const totalSeconds = ms;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(2)}`;
  }

  return {
    drawMainMenu, drawTrackSelect, drawHowToPlay, drawCredits,
    drawHUD, drawCountdown, drawFinalLap, drawCheckeredFlag,
    drawPause, drawResults, drawLoading, drawMinimap, drawMuteButton,
    spawnCollisionParticles, updateParticles, drawParticles,
    initSkidCanvas, addSkidMark, drawSkidMarks, clearSkidMarks,
    formatTime,
  };
})();
