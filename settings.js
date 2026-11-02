// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  dasherCount: 1,
  dasherWanderSpeed: 60,
  dasherDashSpeed: 480, // 2x playerSpeed, so only sidestepping works
  dasherWindupMs: 700,
  dasherDashMs: 450,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, dasher: 0xff9f43 }
};
