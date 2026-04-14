// ai.js — AI driving logic
const AI = (() => {
  const ARRIVAL_RADIUS = 40;
  const LOOKAHEAD = 3;
  const REPULSION_DIST = 50;
  const REPULSION_FORCE = 1.5;

  // Difficulty tiers: speed multiplier for each AI car
  const DIFFICULTY = [0.92, 0.85, 0.82, 0.72];

  function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  function angleDiff(a, b) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  function createAIController(carIndex, trackData) {
    const wpCount = trackData.waypoints.length;
    // Slight lateral offset for racing line variety
    const laneOffset = (carIndex % 2 === 0 ? -1 : 1) * (8 + carIndex * 3);

    return {
      targetWP: 5, // Start looking ahead a bit
      speedMult: DIFFICULTY[carIndex] || 0.75,
      laneOffset,
      stuckTimer: 0,
      lastProgress: 0,
    };
  }

  function updateAI(car, controller, trackData, allCars, dt, playerCar) {
    if (car.finished) {
      car.state.throttle = 0;
      car.state.brake = 0.5;
      car.state.steer = 0;
      return;
    }

    const wp = trackData.waypoints;
    const n = wp.length;
    const state = car.state;

    // Dynamic speed based on player distance (rubber banding for hard AI)
    let effectiveSpeedMult = controller.speedMult;
    if (controller.speedMult > 0.88 && playerCar) {
      const playerPos = Car.getPosition(playerCar);
      const aiPos = Car.getPosition(car);
      if (aiPos < playerPos - 2000) {
        effectiveSpeedMult = Math.min(0.96, controller.speedMult + 0.04);
      }
    }

    state.maxSpeed = Physics.MAX_SPEED * effectiveSpeedMult;

    // Find current nearest waypoint
    const nearestWP = Track.findNearestWaypoint(wp, state.x, state.y);

    // Advance target if close enough
    const targetPt = wp[controller.targetWP % n];
    const dxT = targetPt.x - state.x;
    const dyT = targetPt.y - state.y;
    const distToTarget = Math.sqrt(dxT * dxT + dyT * dyT);

    if (distToTarget < ARRIVAL_RADIUS) {
      controller.targetWP = (controller.targetWP + 1) % n;
    }

    // Keep target ahead of nearest waypoint
    let targetIdx = controller.targetWP;
    const diff = ((targetIdx - nearestWP) + n) % n;
    if (diff < 2 || diff > n - 5) {
      controller.targetWP = (nearestWP + LOOKAHEAD) % n;
      targetIdx = controller.targetWP;
    }

    // Apply lane offset to target
    const norm = Track.getNormal(wp, targetIdx);
    const target = {
      x: wp[targetIdx].x + norm.x * controller.laneOffset,
      y: wp[targetIdx].y + norm.y * controller.laneOffset,
    };

    // Steer toward target
    const dx = target.x - state.x;
    const dy = target.y - state.y;
    const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const turnAmount = angleDiff(state.angle, targetAngle);

    // Smooth steering
    const maxTurn = 0.06;
    if (Math.abs(turnAmount) > 0.01) {
      state.steer = Math.max(-1, Math.min(1, turnAmount / maxTurn));
    } else {
      state.steer = 0;
    }

    // Look ahead for sharp corners — slow down
    let shouldBrake = false;
    const lookaheadDist = 8;
    const futureWP1 = (targetIdx + lookaheadDist) % n;
    const futureWP2 = (targetIdx + lookaheadDist * 2) % n;
    const currentDir = Track.getTangent(wp, targetIdx);
    const futureDir = Track.getTangent(wp, futureWP1);
    const futureDir2 = Track.getTangent(wp, futureWP2);

    const cornerAngle1 = Math.abs(angleDiff(
      Math.atan2(currentDir.y, currentDir.x),
      Math.atan2(futureDir.y, futureDir.x)
    ));
    const cornerAngle2 = Math.abs(angleDiff(
      Math.atan2(futureDir.y, futureDir.x),
      Math.atan2(futureDir2.y, futureDir2.x)
    ));

    const cornerSharpness = Math.max(cornerAngle1, cornerAngle2);
    let targetSpeed = state.maxSpeed;

    if (cornerSharpness > 0.3) {
      targetSpeed = state.maxSpeed * 0.4;
    } else if (cornerSharpness > 0.15) {
      targetSpeed = state.maxSpeed * 0.6;
    } else if (cornerSharpness > 0.08) {
      targetSpeed = state.maxSpeed * 0.8;
    }

    // Throttle / brake based on target speed
    if (state.speed < targetSpeed * 0.9) {
      state.throttle = 1;
      state.brake = 0;
    } else if (state.speed > targetSpeed * 1.1) {
      state.throttle = 0;
      state.brake = 0.5;
    } else {
      state.throttle = 0.3;
      state.brake = 0;
    }

    // Avoidance of other cars
    for (const other of allCars) {
      if (other === car) continue;
      const odx = other.state.x - state.x;
      const ody = other.state.y - state.y;
      const odist = Math.sqrt(odx * odx + ody * ody);

      if (odist < REPULSION_DIST && odist > 0) {
        // Steer away from other car
        const repulse = (REPULSION_DIST - odist) / REPULSION_DIST;
        const repAngle = Math.atan2(-ody, -odx) + Math.PI / 2;
        const repTurn = angleDiff(state.angle, repAngle);
        state.steer += repTurn * repulse * REPULSION_FORCE * dt;
        state.steer = Math.max(-1, Math.min(1, state.steer));
      }
    }

    // Stuck detection — if barely progressing, boost throttle and re-orient
    const currentProgress = Car.getPosition(car);
    if (Math.abs(currentProgress - controller.lastProgress) < 1 && state.speed < 10) {
      controller.stuckTimer += dt;
      if (controller.stuckTimer > 1.0) {
        // Reset orientation toward nearest waypoint ahead
        const aheadWP = (nearestWP + 5) % n;
        const adx = wp[aheadWP].x - state.x;
        const ady = wp[aheadWP].y - state.y;
        state.angle = Math.atan2(ady, adx) + Math.PI / 2;
        state.speed = 30;
        controller.stuckTimer = 0;
        controller.targetWP = (nearestWP + LOOKAHEAD) % n;
      }
    } else {
      controller.stuckTimer = 0;
    }
    controller.lastProgress = currentProgress;

    state.handbrake = false;
  }

  return {
    createAIController,
    updateAI,
  };
})();
