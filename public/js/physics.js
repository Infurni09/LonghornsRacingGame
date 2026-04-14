// physics.js — Car physics (bumper-car collisions, forgiving)
const Physics = (() => {
  const MAX_SPEED = 320;
  const ACCELERATION = 280;
  const BRAKE_FORCE = 400;
  const REVERSE_MAX = 80;
  const STEER_RATE = 2.8;
  const FRICTION = 1.8;
  const HANDBRAKE_GRIP = 0.3;
  const NORMAL_GRIP = 0.95;
  const OFF_TRACK_SPEED_MULT = 0.60;
  const BOUNCE_FACTOR = 0.1;
  const COLLISION_RADIUS = 20;
  const CAR_COLLISION_SPEED_LOSS = 0.02; // Nearly zero — just a nudge

  function createCarState(x, y, angle) {
    return {
      x, y, angle,
      speed: 0,
      lateralVelocityX: 0, lateralVelocityY: 0,
      steer: 0, throttle: 0, brake: 0,
      handbrake: false, onTrack: true, drifting: false,
      maxSpeed: MAX_SPEED,
    };
  }

  function updateCarPhysics(state, dt, trackData) {
    const effectiveMaxSpeed = state.onTrack ? state.maxSpeed : state.maxSpeed * OFF_TRACK_SPEED_MULT;
    const grip = state.handbrake ? HANDBRAKE_GRIP : NORMAL_GRIP;

    if (state.throttle > 0) {
      state.speed += ACCELERATION * state.throttle * dt;
      if (state.speed > effectiveMaxSpeed) state.speed = effectiveMaxSpeed;
    }
    if (state.brake > 0) {
      if (state.speed > 0) {
        state.speed -= BRAKE_FORCE * state.brake * dt;
        if (state.speed < 0) state.speed = 0;
      } else {
        state.speed -= ACCELERATION * 0.3 * state.brake * dt;
        if (state.speed < -REVERSE_MAX) state.speed = -REVERSE_MAX;
      }
    }
    if (state.throttle === 0 && state.brake === 0) {
      if (Math.abs(state.speed) > 1) state.speed *= (1 - FRICTION * dt);
      else state.speed = 0;
    }
    if (!state.onTrack) state.speed *= (1 - FRICTION * 0.4 * dt);

    const speedRatio = Math.abs(state.speed) / MAX_SPEED;
    const steerAmount = state.steer * STEER_RATE * Math.min(speedRatio * 2, 1) * dt;
    if (Math.abs(state.speed) > 5) {
      state.angle += steerAmount * (state.speed >= 0 ? 1 : -1);
    }

    const forwardX = Math.cos(state.angle - Math.PI / 2);
    const forwardY = Math.sin(state.angle - Math.PI / 2);
    const rightX = Math.cos(state.angle);
    const rightY = Math.sin(state.angle);
    const velX = forwardX * state.speed;
    const velY = forwardY * state.speed;

    if (state.handbrake && Math.abs(state.speed) > 50) {
      state.drifting = true;
      const driftForce = state.steer * state.speed * 0.4 * dt;
      state.lateralVelocityX += rightX * driftForce;
      state.lateralVelocityY += rightY * driftForce;
    } else {
      state.drifting = false;
    }

    state.lateralVelocityX *= (1 - grip * 5 * dt);
    state.lateralVelocityY *= (1 - grip * 5 * dt);

    state.x += (velX + state.lateralVelocityX) * dt;
    state.y += (velY + state.lateralVelocityY) * dt;

    if (trackData) state.onTrack = Track.isOnTrack(trackData, state.x, state.y);

    // Soft wall clamp
    const margin = 30;
    if (state.x < margin) { state.x = margin; state.speed *= -BOUNCE_FACTOR; }
    if (state.x > Track.CANVAS_W - margin) { state.x = Track.CANVAS_W - margin; state.speed *= -BOUNCE_FACTOR; }
    if (state.y < margin) { state.y = margin; state.speed *= -BOUNCE_FACTOR; }
    if (state.y > Track.CANVAS_H - margin) { state.y = Track.CANVAS_H - margin; state.speed *= -BOUNCE_FACTOR; }
  }

  // Bumper-car collision: push apart, barely any speed loss
  function resolveCarCollision(carA, carB) {
    const dx = carB.x - carA.x, dy = carB.y - carA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = COLLISION_RADIUS * 2;

    if (dist < minDist && dist > 0) {
      const overlap = minDist - dist;
      const nx = dx / dist, ny = dy / dist;

      // Push apart
      carA.x -= nx * overlap * 0.5;
      carA.y -= ny * overlap * 0.5;
      carB.x += nx * overlap * 0.5;
      carB.y += ny * overlap * 0.5;

      // Tiny speed tap — barely noticeable
      carA.speed *= (1 - CAR_COLLISION_SPEED_LOSS);
      carB.speed *= (1 - CAR_COLLISION_SPEED_LOSS);

      return { hit: true, x: (carA.x + carB.x) / 2, y: (carA.y + carB.y) / 2, force: Math.abs(carA.speed - carB.speed) };
    }
    return { hit: false };
  }

  function checkLineCrossing(prevX, prevY, currX, currY, line) {
    const { x1, y1, x2, y2 } = line;
    const d1x = x2 - x1, d1y = y2 - y1;
    const d2x = currX - prevX, d2y = currY - prevY;
    const cross = d1x * d2y - d1y * d2x;
    if (Math.abs(cross) < 0.0001) return false;
    const t = ((prevX - x1) * d2y - (prevY - y1) * d2x) / cross;
    const u = ((prevX - x1) * d1y - (prevY - y1) * d1x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      const moveDir = { x: currX - prevX, y: currY - prevY };
      return moveDir.x * line.tangent.x + moveDir.y * line.tangent.y > 0;
    }
    return false;
  }

  return {
    MAX_SPEED, ACCELERATION, COLLISION_RADIUS,
    createCarState, updateCarPhysics, resolveCarCollision, checkLineCrossing,
  };
})();
