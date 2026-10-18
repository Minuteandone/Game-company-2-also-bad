import {
  LEVEL, BEATS_PER_LOOP, MAX_ECHOES,
  createGame, advance, archiveLoop, resetGame, getSnapshot
} from "./engine.mjs";

let game = createGame();

const byId = (id) => document.getElementById(id);
const grid = byId("grid");
const tileLabels = {
  "#": "wall",
  ".": "floor",
  S: "starting square",
  A: "pressure pad A",
  B: "pressure pad B",
  D: "locked gate",
  E: "exit"
};

function isAt(point, x, y) {
  return point.x === x && point.y === y;
}

function makeActor(text, label, className) {
  const el = document.createElement("span");
  el.className = "actor " + className;
  el.textContent = text;
  el.setAttribute("aria-label", label);
  el.title = label;
  return el;
}

function showPad(id, label, active) {
  const el = byId(id);
  el.textContent = label + (active ? ": active" : ": waiting");
  el.classList.toggle("active", active);
}

function render() {
  const snapshot = getSnapshot(game);
  const fragment = document.createDocumentFragment();

  LEVEL.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const cell = document.createElement("div");
      let kind = "floor";
      if (tile === "#") kind = "wall";
      if (tile === "S") kind = "start";
      if (tile === "A") kind = "pad-a";
      if (tile === "B") kind = "pad-b";
      if (tile === "D") kind = "door";
      if (tile === "E") kind = "exit";
      cell.className = "cell " + kind;
      if (tile === "A" && snapshot.aActive) cell.classList.add("active");
      if (tile === "B" && snapshot.bActive) cell.classList.add("active");
      if (tile === "D" && snapshot.doorOpen) cell.classList.add("open");

      const terrain = document.createElement("span");
      terrain.className = "terrain";
      terrain.textContent = tile === "A" || tile === "B" ? tile
        : tile === "E" ? "★" : tile === "D" ? (snapshot.doorOpen ? "↔" : "▥") : "";
      cell.append(terrain);

      const actors = document.createElement("span");
      actors.className = "actors";
      if (isAt(game.player, x, y)) {
        actors.append(makeActor("◆", "Current player", "player"));
      }
      snapshot.echoPositions.forEach((point, index) => {
        if (isAt(point, x, y)) {
          actors.append(makeActor("◇", "Echo " + game.echoes[index].number,
            index % 2 ? "echo second" : "echo"));
        }
      });
      cell.append(actors);
      cell.title = "Column " + (x + 1) + ", row " + (y + 1) +
        ": " + (tileLabels[tile] || "floor");
      fragment.append(cell);
    });
  });

  grid.replaceChildren(fragment);
  grid.setAttribute("aria-label",
    "Nine-column, seven-row puzzle board. Player is at column " +
    (game.player.x + 1) + ", row " + (game.player.y + 1) +
    ". Pad A " + (snapshot.aActive ? "active" : "inactive") +
    ", pad B " + (snapshot.bActive ? "active" : "inactive") +
    ", gate " + (snapshot.doorOpen ? "open" : "closed") + ".");

  byId("loop-count").textContent = String(game.loopsArchived + 1);
  byId("beat-count").textContent = game.beat + " / " + BEATS_PER_LOOP;
  byId("echo-count").textContent = game.echoes.length + " / " + MAX_ECHOES;
  showPad("pad-a", "Pad A", snapshot.aActive);
  showPad("pad-b", "Pad B", snapshot.bActive);
  const gate = byId("gate");
  gate.textContent = "Gate: " + (snapshot.doorOpen ? "open" : "closed");
  gate.classList.toggle("active", snapshot.doorOpen);
  byId("message").textContent = game.message;
  byId("archive").disabled = game.won;
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.disabled = game.won;
  });
}

function move(action) {
  game = advance(game, action);
  render();
}

function record() {
  game = archiveLoop(game);
  render();
}

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.move));
});
byId("archive").addEventListener("click", record);
byId("reset").addEventListener("click", () => {
  game = resetGame();
  render();
});

const keys = {
  arrowup: "up", w: "up", arrowdown: "down", s: "down",
  arrowleft: "left", a: "left", arrowright: "right", d: "right"
};
document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const tag = event.target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  const key = event.key.toLowerCase();
  if (Object.hasOwn(keys, key)) {
    event.preventDefault();
    move(keys[key]);
  } else if (key === "r" && !event.repeat) {
    event.preventDefault();
    record();
  } else if (key === " " && tag !== "button") {
    event.preventDefault();
    move("wait");
  }
});

render();
