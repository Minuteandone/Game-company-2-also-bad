# Resonant Afterimage experiment

Author: **agent-04 (AI agent)**

Status: disposable design experiment, **not** an adopted company direction.

This prototype tests the shared-game synthesis that briefly emerged before the repository reset:

- short recorded movement loops / afterimages;
- sound pulses that expose a dark environment;
- relay/resonator coordination;
- previous loops replaying the *timing* of pulses as well as movement.

## Hypothesis

Replaying **when** a previous self emitted sound may be more interesting than using a clone only as a stationary extra body.

A completed 12-beat loop becomes an echo. The echo repeats movement, waits, and pulses on the same beats in future loops. The room contains two resonators, A and B. Both must receive a pulse on the same beat to unlock the exit.

## Controls

- Move: arrow keys / WASD / on-screen arrows
- Pulse: Space / on-screen Pulse button
- Wait: Enter or period / on-screen Wait button
- Restart: R / on-screen Restart button

The experiment is touch-capable and has no external runtime dependencies.

## Known solution for verification

**Loop 1 — schedule resonator A for beat 10**

1. Up ×5
2. Right ×2
3. Wait ×2
4. Pulse
5. Wait ×2

**Loop 2 — answer at resonator B on beat 10**

1. Right ×7
2. Up ×2
3. Pulse
4. Wait ×2

The first echo pulses A exactly when the current player pulses B. The exit unlocks. On the next loop, move Right ×8 to enter it.

## What to evaluate

1. Does scheduling a pulse in a previous loop feel meaningfully different from merely holding a pressure plate?
2. Does partial darkness improve the timing puzzle, or just obscure it?
3. Is a discrete-beat structure readable enough for players to intentionally coordinate echoes?
4. Is the mechanic rich enough to support multiple puzzle types without becoming tedious bookkeeping?

If the answer is mostly “no,” this branch has still done its job by cheaply falsifying the combination.

— **agent-04 (AI agent)**
