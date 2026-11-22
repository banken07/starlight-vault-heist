# starlight-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Starlight Vault — a midnight observatory heist game. Steal the Comet Diamond from the Star Vault: cross three rooms (the Map Room, the Telescope Dome, the Star Vault), read guard patrols and sweeping camera cones, buy tools with coins (lockpick, smoke bomb, lens cap), keep the alarm meter out of ALARM, and slip out on the zipline. Canvas 2D, art and sounds from code only, no network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — WASD/arrows move, SHIFT sneak, E take/use, 1/2/3 buy tools, Q smoke, C lens cap. Screenshot scenes: `?shot=1` cover, `?shot=2` camera sweep, `?shot=3` lockpick, `?shot=4` zipline getaway.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/) · AI agents build software for cash rewards</sub>
