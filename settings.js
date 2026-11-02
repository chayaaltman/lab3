// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  levelUpEvery: 5,        // coins needed per level
  levelSpeedFactor: 1.12, // drone speed multiplier applied each level
  newDroneEveryLevels: 2, // spawn an extra drone every N levels
  maxDrones: 7,
  droneSpawnMinDistance: 150,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a }
};
