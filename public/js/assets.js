// assets.js — Procedural sprites (Race Arcade flat style)
const Assets = (() => {
  const CAR_WIDTH = 26;
  const CAR_HEIGHT = 42;
  const MAROON = '#7B0000';
  const MAROON_LIGHT = '#A30000';

  function drawCarSprite(color, number, isPlayer) {
    const pad = 6;
    const canvas = document.createElement('canvas');
    canvas.width = CAR_WIDTH + pad * 2;
    canvas.height = CAR_HEIGHT + pad * 2;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Drop shadow — flat
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(ctx, cx - CAR_WIDTH/2 + 2, cy - CAR_HEIGHT/2 + 2, CAR_WIDTH, CAR_HEIGHT, 5);
    ctx.fill();

    // Car body — flat solid color, rounded rect
    ctx.fillStyle = color;
    roundRect(ctx, cx - CAR_WIDTH/2, cy - CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT, 5);
    ctx.fill();

    // Bright outline
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - CAR_WIDTH/2, cy - CAR_HEIGHT/2, CAR_WIDTH, CAR_HEIGHT, 5);
    ctx.stroke();

    // Racing stripe (player)
    if (isPlayer) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cx - 2, cy - CAR_HEIGHT/2 + 4, 4, CAR_HEIGHT - 8);
    }

    // Windshield — bright flat
    ctx.fillStyle = 'rgba(200,230,255,0.7)';
    ctx.fillRect(cx - CAR_WIDTH/2 + 4, cy - CAR_HEIGHT/2 + 7, CAR_WIDTH - 8, 7);

    // Rear window
    ctx.fillStyle = 'rgba(200,230,255,0.4)';
    ctx.fillRect(cx - CAR_WIDTH/2 + 5, cy + CAR_HEIGHT/2 - 13, CAR_WIDTH - 10, 5);

    // Wheels — 4 solid dark blocks
    ctx.fillStyle = '#1A1A1A';
    const ww = 5, wh = 8;
    ctx.fillRect(cx - CAR_WIDTH/2 - 1, cy - CAR_HEIGHT/2 + 5, ww, wh);
    ctx.fillRect(cx + CAR_WIDTH/2 - ww + 1, cy - CAR_HEIGHT/2 + 5, ww, wh);
    ctx.fillRect(cx - CAR_WIDTH/2 - 1, cy + CAR_HEIGHT/2 - 13, ww, wh);
    ctx.fillRect(cx + CAR_WIDTH/2 - ww + 1, cy + CAR_HEIGHT/2 - 13, ww, wh);

    // Number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), cx, cy + 1);

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawLonghornLogo(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#F0E6D6';
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 18, 14, 10, 0, 0, Math.PI); ctx.fill();

    ctx.fillStyle = '#1A0808';
    ctx.beginPath(); ctx.ellipse(-5, 18, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, 18, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = MAROON;
    ctx.beginPath(); ctx.ellipse(-10, -4, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -4, 5, 5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1A0808';
    ctx.beginPath(); ctx.ellipse(-10, -4, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -4, 2.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#F0E6D6'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-28, -2); ctx.quadraticCurveTo(-65, -30, -80, -55); ctx.stroke();
    ctx.strokeStyle = MAROON; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-72, -45); ctx.quadraticCurveTo(-78, -52, -80, -55); ctx.stroke();

    ctx.strokeStyle = '#F0E6D6'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(28, -2); ctx.quadraticCurveTo(65, -30, 80, -55); ctx.stroke();
    ctx.strokeStyle = MAROON; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(72, -45); ctx.quadraticCurveTo(78, -52, 80, -55); ctx.stroke();

    ctx.restore();
  }

  function drawTrophy(ctx, x, y, scale, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const bob = Math.sin(time * 3) * 3;
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-25, -20 + bob); ctx.quadraticCurveTo(-28, 20 + bob, -12, 30 + bob);
    ctx.lineTo(12, 30 + bob); ctx.quadraticCurveTo(28, 20 + bob, 25, -20 + bob);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-25, -10 + bob); ctx.quadraticCurveTo(-38, 0 + bob, -25, 15 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, -10 + bob); ctx.quadraticCurveTo(38, 0 + bob, 25, 15 + bob); ctx.stroke();

    ctx.fillStyle = '#DAA520';
    ctx.fillRect(-15, 30 + bob, 30, 6); ctx.fillRect(-20, 36 + bob, 40, 5);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFF8DC';
    drawStar(ctx, 0, 5 + bob, 8, 5, 0.5);

    const glow = 0.3 + Math.sin(time * 4) * 0.15;
    ctx.fillStyle = `rgba(255,255,200,${glow})`;
    drawStar(ctx, -18, -30 + bob, 4, 4, 0.5);
    drawStar(ctx, 22, -25 + bob, 3, 4, 0.5);
    drawStar(ctx, 15, -33 + bob, 5, 4, 0.5);
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, radius, points, inset) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * inset;
      const a = (Math.PI * i) / points - Math.PI / 2;
      if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath(); ctx.fill();
  }

  function drawCone(ctx, x, y) {
    ctx.fillStyle = MAROON_LIGHT;
    ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 5, y + 4); ctx.lineTo(x + 5, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 3, y - 2, 6, 2);
  }

  return {
    CAR_WIDTH, CAR_HEIGHT, MAROON, MAROON_LIGHT,
    drawCarSprite, drawLonghornLogo, drawTrophy, drawStar, drawCone,
  };
})();
