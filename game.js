/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.finished = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.createDashers();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  createDashers() {
    const c = COIN_DASH;
    this.dashers = this.physics.add.group();
    this.dasherLines = this.add.graphics();
    for (let i = 0; i < c.dasherCount; i++) {
      // Spawn well away from the player's start in the centre.
      let x, y;
      do {
        x = Phaser.Math.Between(25, c.width - 25);
        y = Phaser.Math.Between(70, c.height - 25);
      } while (Phaser.Math.Distance.Between(x, y, c.width / 2, c.height / 2) < 200);
      const dasher = this.add.polygon(x, y, [15, 0, 30, 15, 15, 30, 0, 15], c.colors.dasher);
      this.dashers.add(dasher);
      dasher.body.setSize(20, 20).setCollideWorldBounds(true).setBounce(1, 1);
      this.startWander(dasher); // wander lasts >= 2 s, so the first windup is never earlier
    }
    this.physics.add.overlap(this.player, this.dashers, () => this.finish('The dasher rammed you!'));
  }

  // Dasher state machine: wander -> windup (telegraph) -> dash -> wander.
  // Driven from update() with scene time, so it freezes when the round finishes.
  updateDashers() {
    const c = COIN_DASH;
    const now = this.time.now;
    this.dasherLines.clear();
    this.dashers.getChildren().forEach((d) => {
      if (d.dashState === 'windup') {
        // Blink, swell and show the locked target so the player can sidestep.
        const progress = 1 - (d.stateEnds - now) / c.dasherWindupMs;
        d.setAlpha(Math.floor(now / 90) % 2 ? 0.35 : 1).setScale(1 + 0.35 * progress);
        this.dasherLines.lineStyle(2, c.colors.dasher, 0.35)
          .lineBetween(d.x, d.y, d.targetX, d.targetY);
      }
      const hitWall = d.dashState === 'dash' && !d.body.blocked.none;
      if (now < d.stateEnds && !hitWall) return;
      if (d.dashState === 'wander') this.startWindup(d);
      else if (d.dashState === 'windup') this.startDash(d);
      else this.startWander(d);
    });
  }

  startWander(d) {
    const speed = COIN_DASH.dasherWanderSpeed;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    d.dashState = 'wander';
    d.stateEnds = this.time.now + Phaser.Math.Between(2000, 4000);
    d.setAlpha(1).setScale(1);
    d.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  startWindup(d) {
    d.dashState = 'windup';
    d.stateEnds = this.time.now + COIN_DASH.dasherWindupMs;
    d.targetX = this.player.x;
    d.targetY = this.player.y;
    d.body.setVelocity(0, 0);
  }

  startDash(d) {
    // Aim once at the locked target; no re-aiming during the dash.
    const angle = Phaser.Math.Angle.Between(d.x, d.y, d.targetX, d.targetY);
    d.dashState = 'dash';
    d.stateEnds = this.time.now + COIN_DASH.dasherDashMs;
    d.setAlpha(1).setScale(1);
    this.physics.velocityFromRotation(angle, COIN_DASH.dasherDashSpeed, d.body.velocity);
  }

  update() {
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    this.updateDashers();
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
