import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVEL, BEATS_PER_LOOP, MAX_ECHOES, createGame, advance,
  archiveLoop, echoAt, getSnapshot, resetGame
} from "./engine.mjs";

function moves(state, actions) {
  return actions.reduce((current, action) => advance(current, action), state);
}

test("board geometry and new-game defaults", () => {
  assert.equal(LEVEL.length, 7);
  assert.ok(LEVEL.every((row) => row.length === 9));
  assert.equal(BEATS_PER_LOOP, 8);
  assert.equal(MAX_ECHOES, 2);
  const game = createGame();
  assert.deepEqual(game.player, { x: 1, y: 1 });
  assert.equal(game.beat, 0);
  assert.equal(getSnapshot(game).doorOpen, false);
});

test("walls block movement without breaking the deterministic beat count", () => {
  const game = advance(createGame(), "left");
  assert.deepEqual(game.player, { x: 1, y: 1 });
  assert.equal(game.beat, 1);
  assert.deepEqual(game.recordedFrames[0], { x: 1, y: 1 });
  assert.match(game.message, /Blocked/);
});

test("a single echo freezes on the last recorded frame", () => {
  const first = archiveLoop(moves(createGame(), ["right", "right", "right"]));
  assert.equal(first.echoes.length, 1);
  assert.equal(first.beat, 0);
  assert.deepEqual(echoAt(first.echoes[0], 0), { x: 1, y: 1 });
  assert.deepEqual(echoAt(first.echoes[0], 3), { x: 4, y: 1 });
  assert.deepEqual(echoAt(first.echoes[0], 8), { x: 4, y: 1 });
  const atThree = moves(first, ["wait", "wait", "wait"]);
  assert.equal(getSnapshot(atThree).aActive, true);
  assert.equal(getSnapshot(atThree).bActive, false);
});

test("the door cannot be crossed without both pads simultaneously held", () => {
  const singleEcho = archiveLoop(moves(createGame(), ["right", "right", "right"]));
  const blocked = moves(singleEcho, ["right", "right", "right", "down", "down"]);
  assert.deepEqual(blocked.player, { x: 4, y: 2 });
  assert.equal(blocked.beat, 5);
  assert.match(blocked.message, /BOTH pads/);
});

test("two recorded echoes coordinate a solvable three-loop puzzle", () => {
  let game = archiveLoop(moves(createGame(), ["right", "right", "right"]));
  game = archiveLoop(moves(game, ["down", "down", "down"]));
  assert.equal(game.echoes.length, 2);
  assert.equal(game.loopsArchived, 2);
  game = moves(game, ["right", "right", "right", "down"]);
  const beforeGate = getSnapshot(game);
  assert.equal(beforeGate.aActive, true);
  assert.equal(beforeGate.bActive, true);
  assert.equal(beforeGate.doorOpen, true);
  game = moves(game, ["down", "right", "right", "right"]);
  assert.equal(game.won, true);
  assert.deepEqual(game.player, { x: 7, y: 3 });
  assert.equal(game.beat, 8);
  assert.match(game.message, /Exit reached/);
});

test("eight beats automatically archives a route and rolls over", () => {
  const game = moves(createGame(), Array(8).fill("wait"));
  assert.equal(game.beat, 0);
  assert.equal(game.loopsArchived, 1);
  assert.equal(game.echoes[0].frames.length, 8);
});

test("only the two most recent echoes remain, and reset clears all", () => {
  let game = createGame();
  game = archiveLoop(moves(game, ["right"]));
  game = archiveLoop(moves(game, ["down"]));
  game = archiveLoop(moves(game, ["wait"]));
  assert.deepEqual(game.echoes.map((echo) => echo.number), [2, 3]);
  assert.equal(game.echoes.length, 2);
  assert.deepEqual(resetGame(), createGame());
});

test("empty recordings are ignored and unknown actions are rejected", () => {
  const game = archiveLoop(createGame());
  assert.equal(game.echoes.length, 0);
  assert.throws(() => advance(game, "teleport"), TypeError);
});
