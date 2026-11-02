// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  // Chaser: steers toward the player, capped below playerSpeed so it can be juked.
  chaserCount: 1,
  chaserMaxSpeed: 170,
  chaserAccel: 260,
  chaserGraceMs: 1500,
  // Dasher: wanders, telegraphs, then charges in a straight line.
  dasherCount: 1,
  dasherWanderSpeed: 60,
  dasherDashSpeed: 480, // 2x playerSpeed, so only sidestepping works
  dasherWindupMs: 700,
  dasherDashMs: 450,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, chaser: 0xb48cff, dasher: 0xff9f43 }
};
