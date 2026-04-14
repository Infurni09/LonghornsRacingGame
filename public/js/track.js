// track.js — Track generation and rendering (Race Arcade flat style)
const Track = (() => {
  const TRACK_WIDTH = 76;
  const CURB_WIDTH = 5;
  const SAND_WIDTH = 22;
  const CANVAS_W = 1400;
  const CANVAS_H = 900;

  function catmullRom(points, numPerSegment) {
    const result = [];
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];
      for (let t = 0; t < numPerSegment; t++) {
        const f = t / numPerSegment;
        const f2 = f * f;
        const f3 = f2 * f;
        const x = 0.5 * ((2*p1.x) + (-p0.x+p2.x)*f + (2*p0.x-5*p1.x+4*p2.x-p3.x)*f2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*f3);
        const y = 0.5 * ((2*p1.y) + (-p0.y+p2.y)*f + (2*p0.y-5*p1.y+4*p2.y-p3.y)*f2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*f3);
        result.push({ x, y });
      }
    }
    return result;
  }

  function createTrack1() {
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2;
    const rx = 520, ry = 300;
    const controlPoints = [];
    const numCtrl = 24;
    for (let i = 0; i < numCtrl; i++) {
      const a = (Math.PI * 2 * i) / numCtrl;
      let x = cx + Math.cos(a) * rx;
      let y = cy + Math.sin(a) * ry;
      if (i === 0) y += 30;
      if (i === 1) y -= 30;
      if (i === 23) y += 30;
      if (i === 11) y += 30;
      if (i === 12) y -= 30;
      if (i === 13) y += 30;
      controlPoints.push({ x, y });
    }
    return catmullRom(controlPoints, 5);
  }

  function createTrack2() {
    return catmullRom([
      {x:700,y:150},{x:950,y:150},{x:1100,y:160},{x:1150,y:220},{x:1150,y:350},{x:1100,y:420},
      {x:950,y:430},{x:900,y:480},{x:900,y:580},{x:950,y:650},{x:1100,y:660},{x:1200,y:700},
      {x:1200,y:780},{x:1100,y:800},{x:700,y:800},{x:550,y:780},{x:450,y:700},{x:350,y:650},
      {x:250,y:600},{x:200,y:500},{x:220,y:380},{x:300,y:300},{x:400,y:260},{x:500,y:200},
    ], 5);
  }

  function createTrack3() {
    return catmullRom([
      {x:700,y:130},{x:900,y:150},{x:1100,y:200},{x:1250,y:300},{x:1250,y:420},{x:1150,y:500},
      {x:900,y:580},{x:700,y:650},{x:500,y:730},{x:300,y:750},{x:180,y:680},{x:150,y:560},
      {x:220,y:450},{x:500,y:370},{x:700,y:300},{x:500,y:220},{x:350,y:180},{x:280,y:150},
      {x:350,y:120},{x:500,y:120},
    ], 6);
  }

  const tracks = [
    { name: 'Darrell K Royal', create: createTrack1 },
    { name: 'Sixth Street Circuit', create: createTrack2 },
    { name: 'Hill Country Dash', create: createTrack3 },
  ];

  function getTrack(index) {
    return { name: tracks[index].name, waypoints: tracks[index].create(), trackWidth: TRACK_WIDTH };
  }
  function getTrackCount() { return tracks.length; }
  function getTrackName(index) { return tracks[index].name; }

  function getNormal(waypoints, i) {
    const n = waypoints.length;
    const next = waypoints[(i + 1) % n];
    const prev = waypoints[(i - 1 + n) % n];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: -dy / len, y: dx / len };
  }

  function getTangent(waypoints, i) {
    const n = waypoints.length;
    const next = waypoints[(i + 1) % n];
    const prev = waypoints[(i - 1 + n) % n];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function getStartFinishLine(trackData) {
    const wp = trackData.waypoints;
    const normal = getNormal(wp, 0);
    const hw = trackData.trackWidth / 2;
    return {
      x1: wp[0].x + normal.x * hw, y1: wp[0].y + normal.y * hw,
      x2: wp[0].x - normal.x * hw, y2: wp[0].y - normal.y * hw,
      pos: wp[0], tangent: getTangent(wp, 0),
    };
  }

  function getGridPositions(trackData, numCars) {
    const wp = trackData.waypoints;
    const normal = getNormal(wp, 0);
    const tangent = getTangent(wp, 0);
    const positions = [];
    for (let i = 0; i < numCars; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const lateralOffset = col === 0 ? -12 : 12;
      positions.push({
        x: wp[0].x - tangent.x * (50 + row * 55) + normal.x * lateralOffset,
        y: wp[0].y - tangent.y * (50 + row * 55) + normal.y * lateralOffset,
        angle: Math.atan2(tangent.y, tangent.x) - Math.PI / 2,
        waypointIndex: 0,
      });
    }
    return positions;
  }

  function findNearestWaypoint(waypoints, x, y) {
    let minDist = Infinity, minIdx = 0;
    for (let i = 0; i < waypoints.length; i++) {
      const dx = waypoints[i].x - x, dy = waypoints[i].y - y;
      const d = dx * dx + dy * dy;
      if (d < minDist) { minDist = d; minIdx = i; }
    }
    return minIdx;
  }

  function isOnTrack(trackData, x, y) {
    const wp = trackData.waypoints;
    const idx = findNearestWaypoint(wp, x, y);
    const normal = getNormal(wp, idx);
    const dx = x - wp[idx].x, dy = y - wp[idx].y;
    return Math.abs(dx * normal.x + dy * normal.y) < trackData.trackWidth / 2;
  }

  function distFromCenter(trackData, x, y) {
    const wp = trackData.waypoints;
    const idx = findNearestWaypoint(wp, x, y);
    const dx = x - wp[idx].x, dy = y - wp[idx].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ===================================
  // RACE ARCADE RENDERING — flat, bright, clean
  // ===================================
  function renderTrackToCanvas(trackData) {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    const wp = trackData.waypoints;
    const hw = trackData.trackWidth / 2;

    // ---- BRIGHT FLAT GRASS ----
    ctx.fillStyle = '#4CBB17'; // Kelly green, vivid and flat like Race Arcade
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ---- SAND/GRAVEL RUNOFF around track ----
    const sandHW = hw + CURB_WIDTH + SAND_WIDTH;
    drawTrackBand(ctx, wp, sandHW, '#D2B48C'); // tan sand

    // ---- WHITE TRACK BORDER ----
    const borderHW = hw + CURB_WIDTH;
    drawTrackBand(ctx, wp, borderHW, '#FFFFFF');

    // ---- CURB STRIPES (red/white alternating) ----
    for (let i = 0; i < wp.length; i++) {
      const next = (i + 1) % wp.length;
      const norm = getNormal(wp, i);
      const normN = getNormal(wp, next);
      const curbColor = Math.floor(i / 3) % 2 === 0 ? '#DD1111' : '#FFFFFF';
      ctx.fillStyle = curbColor;

      // Left curb
      ctx.beginPath();
      ctx.moveTo(wp[i].x + norm.x * (hw + CURB_WIDTH), wp[i].y + norm.y * (hw + CURB_WIDTH));
      ctx.lineTo(wp[i].x + norm.x * hw, wp[i].y + norm.y * hw);
      ctx.lineTo(wp[next].x + normN.x * hw, wp[next].y + normN.y * hw);
      ctx.lineTo(wp[next].x + normN.x * (hw + CURB_WIDTH), wp[next].y + normN.y * (hw + CURB_WIDTH));
      ctx.closePath();
      ctx.fill();

      // Right curb
      ctx.beginPath();
      ctx.moveTo(wp[i].x - norm.x * (hw + CURB_WIDTH), wp[i].y - norm.y * (hw + CURB_WIDTH));
      ctx.lineTo(wp[i].x - norm.x * hw, wp[i].y - norm.y * hw);
      ctx.lineTo(wp[next].x - normN.x * hw, wp[next].y - normN.y * hw);
      ctx.lineTo(wp[next].x - normN.x * (hw + CURB_WIDTH), wp[next].y - normN.y * (hw + CURB_WIDTH));
      ctx.closePath();
      ctx.fill();
    }

    // ---- TRACK SURFACE — light asphalt gray ----
    drawTrackBand(ctx, wp, hw, '#787878');

    // ---- RACING LINE — subtle lighter strip down the middle ----
    drawTrackBand(ctx, wp, 6, 'rgba(255,255,255,0.06)');

    // ---- WHITE EDGE LINES (thin crisp lines on track edge) ----
    drawTrackEdgeLine(ctx, wp, hw - 2, '#FFFFFF', 2);
    drawTrackEdgeLine(ctx, wp, -(hw - 2), '#FFFFFF', 2);

    // ---- CENTER DASHED LINE ----
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 14]);
    ctx.beginPath();
    ctx.moveTo(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) ctx.lineTo(wp[i].x, wp[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // ---- START/FINISH LINE ----
    const sf = getStartFinishLine(trackData);
    drawCheckeredLine(ctx, sf.x1, sf.y1, sf.x2, sf.y2);

    return canvas;
  }

  // Fill a band of given half-width around the track centerline
  function drawTrackBand(ctx, wp, halfWidth, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < wp.length; i++) {
      const next = (i + 1) % wp.length;
      const norm = getNormal(wp, i);
      const normN = getNormal(wp, next);
      ctx.beginPath();
      ctx.moveTo(wp[i].x + norm.x * halfWidth, wp[i].y + norm.y * halfWidth);
      ctx.lineTo(wp[i].x - norm.x * halfWidth, wp[i].y - norm.y * halfWidth);
      ctx.lineTo(wp[next].x - normN.x * halfWidth, wp[next].y - normN.y * halfWidth);
      ctx.lineTo(wp[next].x + normN.x * halfWidth, wp[next].y + normN.y * halfWidth);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw a thin line along one edge of the track
  function drawTrackEdgeLine(ctx, wp, offset, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= wp.length; i++) {
      const idx = i % wp.length;
      const norm = getNormal(wp, idx);
      const x = wp[idx].x + norm.x * offset;
      const y = wp[idx].y + norm.y * offset;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawCheckeredLine(ctx, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len, ny = dy / len;
    const px = -ny, py = nx;
    const sq = 7;
    const numSq = Math.floor(len / sq);
    for (let i = 0; i < numSq; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#FFFFFF' : '#111111';
        ctx.fillRect(
          x1 + nx * i * sq + px * j * 6,
          y1 + ny * i * sq + py * j * 6,
          sq, 6
        );
      }
    }
  }

  // ---- MINIMAP ----
  function renderMinimap(ctx, trackData, x, y, w, h) {
    const wp = trackData.waypoints;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of wp) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }
    const pad = 10;
    const scale = Math.min((w - pad*2) / (maxX - minX || 1), (h - pad*2) / (maxY - minY || 1));
    const offsetX = x + pad + ((w - pad*2) - (maxX - minX) * scale) / 2;
    const offsetY = y + pad + ((h - pad*2) - (maxY - minY) * scale) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < wp.length; i++) {
      const mx = offsetX + (wp[i].x - minX) * scale;
      const my = offsetY + (wp[i].y - minY) * scale;
      if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.stroke();

    return { minX, minY, scale, offsetX, offsetY };
  }

  function worldToMinimap(info, worldX, worldY) {
    return {
      x: info.offsetX + (worldX - info.minX) * info.scale,
      y: info.offsetY + (worldY - info.minY) * info.scale,
    };
  }

  return {
    TRACK_WIDTH, CANVAS_W, CANVAS_H,
    getTrack, getTrackCount, getTrackName,
    getNormal, getTangent, getStartFinishLine, getGridPositions,
    findNearestWaypoint, isOnTrack, distFromCenter,
    renderTrackToCanvas, renderMinimap, worldToMinimap,
  };
})();
