// car.js — Player and AI car logic
const Car = (() => {
  // Player is crimson maroon, AI cars are bright distinct colors (Race Arcade style)
  const CAR_COLORS = ['#7B0000', '#2288EE', '#22CC55', '#EECC00', '#EE3333'];
  const CAR_NAMES = ['LONGHORN', 'MAVERICK', 'RAIDER', 'MUSTANG', 'ROCKET'];

  function createCar(index, x, y, angle, isPlayer) {
    const state = Physics.createCarState(x, y, angle);
    const sprite = Assets.drawCarSprite(CAR_COLORS[index], index + 1, isPlayer);

    return {
      index,
      name: CAR_NAMES[index],
      color: CAR_COLORS[index],
      isPlayer,
      state,
      sprite,
      prevX: x,
      prevY: y,
      laps: 0,
      lapTimes: [],
      bestLap: Infinity,
      currentLapStart: 0,
      raceTime: 0,
      finished: false,
      finishTime: 0,
      waypointIndex: 0,
      waypointProgress: 0,
      passedHalfway: false,
    };
  }

  function updateLapCounting(car, trackData, startFinishLine, raceTime) {
    if (car.finished) return;

    const wp = trackData.waypoints;
    const nearestWP = Track.findNearestWaypoint(wp, car.state.x, car.state.y);
    car.waypointIndex = nearestWP;
    car.waypointProgress = nearestWP / wp.length;

    const halfwayIdx = Math.floor(wp.length / 2);
    if (Math.abs(nearestWP - halfwayIdx) < wp.length * 0.1) {
      car.passedHalfway = true;
    }

    const crossed = Physics.checkLineCrossing(
      car.prevX, car.prevY,
      car.state.x, car.state.y,
      startFinishLine
    );

    if (crossed && car.passedHalfway) {
      car.laps++;
      car.passedHalfway = false;

      if (car.laps > 0 && car.currentLapStart > 0) {
        const lapTime = raceTime - car.currentLapStart;
        car.lapTimes.push(lapTime);
        if (lapTime < car.bestLap) car.bestLap = lapTime;
      }
      car.currentLapStart = raceTime;

      if (car.laps >= 3) {
        car.finished = true;
        car.finishTime = raceTime;
      }
    }

    car.prevX = car.state.x;
    car.prevY = car.state.y;
  }

  function getPosition(car) {
    return car.laps * 10000 + car.waypointProgress * 10000;
  }

  function getRacePositions(cars) {
    const sorted = [...cars].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return getPosition(b) - getPosition(a);
    });
    return sorted;
  }

  function drawCar(ctx, car, time) {
    const { x, y, angle, speed } = car.state;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Speed glow — maroon for player
    if (car.isPlayer && Math.abs(speed) > Physics.MAX_SPEED * 0.8) {
      ctx.shadowColor = '#CC2222';
      ctx.shadowBlur = 6 + Math.sin(time * 10) * 3;
    }

    ctx.drawImage(
      car.sprite,
      -car.sprite.width / 2,
      -car.sprite.height / 2
    );

    ctx.restore();
  }

  function getSpeedKMH(car) {
    return Math.abs(Math.round(car.state.speed * 0.9));
  }

  function getGear(car) {
    const ratio = Math.abs(car.state.speed) / car.state.maxSpeed;
    if (ratio < 0.05) return 'N';
    if (ratio < 0.2) return '1';
    if (ratio < 0.4) return '2';
    if (ratio < 0.6) return '3';
    if (ratio < 0.8) return '4';
    return '5';
  }

  return {
    CAR_COLORS, CAR_NAMES,
    createCar, updateLapCounting, getPosition, getRacePositions,
    drawCar, getSpeedKMH, getGear,
  };
})();
