export const LEVEL = Object.freeze([
  "#########",
  "#S..A####",
  "#.#..####",
  "#..#D..E#",
  "#B..#####",
  "#...#####",
  "#########"
]);

export const BEATS_PER_LOOP = 8;
export const MAX_ECHOES = 2;
export const START = Object.freeze({ x: 1, y: 1 });

const DIRECTIONS = Object.freeze({
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  wait: [0, 0]
});

function clonePoint(point) {
  return { x: point.x, y: point.y };
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function tileAt(point) {
  return LEVEL[point.y]?.[point.x] ?? "#";
}

export function createGame() {
  return {
    player: clonePoint(START),
    beat: 0,
    recordedFrames: [],
    echoes: [],
    loopsArchived: 0,
    won: false,
    message: "Record one route to each pad, then reach the exit."
  };
}

// Each archived frame is an actual position, not an instruction. This means
// a replay reproduces the same route even if a future loop changes a door.
export function echoAt(echo, beat) {
  if (beat <= 0 || echo.frames.length === 0) return clonePoint(START);
  return clonePoint(echo.frames[Math.min(beat, echo.frames.length) - 1]);
}

export function getSnapshot(state) {
  const echoPositions = state.echoes.map((echo) => echoAt(echo, state.beat));
  const actors = [state.player, ...echoPositions];
  const aActive = actors.some((point) => tileAt(point) === "A");
  const bActive = actors.some((point) => tileAt(point) === "B");
  return {
    echoPositions,
    aActive,
    bActive,
    doorOpen: aActive && bActive
  };
}

export function archiveLoop(state) {
  if (state.won || state.recordedFrames.length === 0) {
    return {
      ...state,
      message: state.won
        ? "Already solved! Restart to try again."
        : "Move or wait at least once before recording an echo."
    };
  }

  const archived = {
    frames: state.recordedFrames.map(clonePoint),
    number: state.loopsArchived + 1
  };
  const echoes = [...state.echoes, archived].slice(-MAX_ECHOES);
  const replaced = state.echoes.length === MAX_ECHOES;

  return {
    ...state,
    player: clonePoint(START),
    beat: 0,
    recordedFrames: [],
    echoes,
    loopsArchived: state.loopsArchived + 1,
    message: replaced
      ? "Route recorded. The oldest echo was replaced."
      : "Route recorded. Your echo will repeat those steps."
  };
}

export function advance(state, action) {
  if (!Object.hasOwn(DIRECTIONS, action)) {
    throw new TypeError("Unknown action: " + String(action));
  }
  if (state.won) return state;
  if (state.beat >= BEATS_PER_LOOP) return archiveLoop(state);

  const beat = state.beat + 1;
  const [dx, dy] = DIRECTIONS[action];
  const attempted = { x: state.player.x + dx, y: state.player.y + dy };
  const replaying = state.echoes.map((echo) => echoAt(echo, beat));

  // Echoes advance at the same beat as the player. A door only permits entry
  // when BOTH pressure pads are held at the moment of entry.
  const padsHeld = (label) => replaying.some((point) => tileAt(point) === label);
  const doorOpenForEntry = padsHeld("A") && padsHeld("B");
  const attemptedTile = tileAt(attempted);
  const blocked = attemptedTile === "#" ||
    (attemptedTile === "D" && !doorOpenForEntry);
  const player = blocked ? clonePoint(state.player) : attempted;
  const recordedFrames = [...state.recordedFrames, clonePoint(player)];
  const won = tileAt(player) === "E";

  const next = {
    ...state,
    player,
    beat,
    recordedFrames,
    won,
    message: won
      ? "Exit reached! You coordinated two echoes across three loops."
      : attemptedTile === "D" && blocked
        ? "The gate needs BOTH pads held by echoes."
        : blocked && action !== "wait"
          ? "Blocked. The beat still passes."
          : "Echoes replay in step with your moves."
  };

  return beat >= BEATS_PER_LOOP && !won ? archiveLoop(next) : next;
}

export function resetGame() {
  return createGame();
}
