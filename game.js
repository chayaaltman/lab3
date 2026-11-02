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
    this.createChasers();
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
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

  createChasers() {
    const c = COIN_DASH;
    // Spawn in the corners farthest from the player so the round never starts on top of one.
    const corners = [[40, 84], [c.width - 40, 84], [40, c.height - 40], [c.width - 40, c.height - 40]]
      .sort((a, b) => Phaser.Math.Distance.Between(b[0], b[1], this.player.x, this.player.y)
        - Phaser.Math.Distance.Between(a[0], a[1], this.player.x, this.player.y));
    this.chasers = this.physics.add.group();
    this.chaseStart = this.time.now + c.chaserGraceMs;
    for (let i = 0; i < c.chaserCount; i++) {
      const [x, y] = corners[i % corners.length];
      // Triangle pointing right (rotation 0); rotated toward its velocity in updateChasers().
      const chaser = this.add.triangle(x, y, 0, 0, 28, 12, 0, 24, c.colors.chaser).setAlpha(0.45);
      this.chasers.add(chaser);
      chaser.body.setCircle(11, 3, 1).setCollideWorldBounds(true).setMaxSpeed(c.chaserMaxSpeed);
    }
    this.physics.add.overlap(this.player, this.chasers, () => this.finish('The chaser got you!'));
  }

  updateChasers() {
    const c = COIN_DASH;
    const chasing = this.time.now >= this.chaseStart;
    this.chasers.getChildren().forEach((chaser) => {
      // Faded and still during the grace period, then accelerate toward the player.
      const angle = Phaser.Math.Angle.Between(chaser.x, chaser.y, this.player.x, this.player.y);
      chaser.setAlpha(chasing ? 1 : 0.45);
      if (!chasing) {
        chaser.rotation = angle;
        return;
      }
      chaser.body.setAcceleration(Math.cos(angle) * c.chaserAccel, Math.sin(angle) * c.chaserAccel);
      if (chaser.body.speed > 1) chaser.rotation = Math.atan2(chaser.body.velocity.y, chaser.body.velocity.x);
    });
  }

  update() {
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    this.updateChasers();
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
