import Phaser from "phaser";
import type { ArcadeGameData } from "../../core/types";
import { PLAYER_STATS, cpuStatsFromRacer } from "../systems/PhysicsTuning";

type Checkpoint = {
  id: number;
  x: number;
  y: number;
  side: "left" | "right";
};

type RacerSprite = Phaser.Physics.Arcade.Sprite & {
  racerName?: string;
  targetCheckpointIndex?: number;
  lap?: number;
  penalties?: number;
  finished?: boolean;
  stats?: typeof PLAYER_STATS;
  collisionCooldown?: number;
  lastWakeAt?: number;
  wakeSprite?: Phaser.GameObjects.Sprite;
  lastTurnAmount?: number;
};

type RaceStanding = {
  name: string;
  isPlayer: boolean;
  lap: number;
  checkpointIndex: number;
  progress: number;
  finished?: boolean;
};

export default class RaceScene extends Phaser.Scene {
  private arcadeData!: ArcadeGameData;

  private player!: RacerSprite;
  private cpuRacers: RacerSprite[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  private checkpoints: Checkpoint[] = [];
  private checkpointMarkers: Array<
    Phaser.GameObjects.Image | Phaser.GameObjects.Arc
  > = [];

  private waterTile?: Phaser.GameObjects.TileSprite;

  private playerCheckpointIndex = 0;
  private playerLap = 1;
  private playerPenalties = 0;

  private raceStarted = false;
  private raceStartTime = 0;
  private collisionPenaltyCooldown = 0;
  private isRacePaused = false;

  private raceTimeText!: Phaser.GameObjects.Text;
  private lapText!: Phaser.GameObjects.Text;
  private penaltyText!: Phaser.GameObjects.Text;
  private positionText!: Phaser.GameObjects.Text;
  private bestLapText!: Phaser.GameObjects.Text;
  private leaderboardText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

  private nextBuoyArrow!: Phaser.GameObjects.Container;
  private nextBuoyArrowRotor!: Phaser.GameObjects.Container;

  constructor() {
    super("RaceScene");
  }

  preload() {
    this.load.image("water_base", "/arcade/jetSki/tiles/water-base.png");

    this.load.image(
      "rider_player_stable",
      "/arcade/jetSki/sprites/rider-player-stable.png",
    );

    this.load.image(
      "rider_cpu_green",
      "/arcade/jetSki/sprites/rider-cpu-green.png",
    );

    this.load.image(
      "rider_cpu_red",
      "/arcade/jetSki/sprites/rider-cpu-red.png",
    );

    this.load.image(
      "rider_cpu_blue",
      "/arcade/jetSki/sprites/rider-cpu-blue.png",
    );

    this.load.image(
      "rider_cpu_purple",
      "/arcade/jetSki/sprites/rider-cpu-purple.png",
    );

    this.load.image(
      "rider_cpu_yellow",
      "/arcade/jetSki/sprites/rider-cpu-yellow.png",
    );

    this.load.image("buoy_red", "/arcade/jetSki/buoys/buoy-red.png");
    this.load.image("buoy_yellow", "/arcade/jetSki/buoys/buoy-yellow.png");

    this.load.image("wake_fx", "/arcade/jetSki/fx/wake.png");

    this.load.spritesheet(
      "wake_straight",
      "/arcade/jetSki/fx/wake-straight.png",
      {
        frameWidth: 250,
        frameHeight: 250,
      },
    );

    this.load.spritesheet("wake_left", "/arcade/jetSki/fx/wake-left.png", {
      frameWidth: 250,
      frameHeight: 250,
    });

    this.load.spritesheet("wake_right", "/arcade/jetSki/fx/wake-right.png", {
      frameWidth: 250,
      frameHeight: 250,
    });

    this.load.image("splash_fx", "/arcade/jetSki/fx/splash.png");
  }

  create(initData?: ArcadeGameData) {
    const registryData = this.game.registry.get("arcadeData") as
      | ArcadeGameData
      | undefined;

    this.arcadeData = initData || registryData!;

    this.cpuRacers = [];
    this.checkpointMarkers = [];
    this.playerCheckpointIndex = 0;
    this.playerLap = 1;
    this.playerPenalties = 0;
    this.raceStarted = false;
    this.raceStartTime = 0;
    this.collisionPenaltyCooldown = 0;
    this.isRacePaused = false;
    this.waterTile = undefined;

    if (!this.arcadeData?.course?.mapJson?.checkpoints?.length) {
      console.error("Missing arcadeData in RaceScene", {
        initData,
        registryData,
      });

      this.add.rectangle(0, 0, 1280, 720, 0x030913).setOrigin(0);

      this.add
        .text(640, 330, "ARCADE DATA FAILED TO LOAD", {
          color: "#ffffff",
          fontSize: "38px",
          fontFamily: "monospace",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5);

      this.add
        .text(640, 390, "Check course + CPU racer API data.", {
          color: "#67e8f9",
          fontSize: "22px",
          fontFamily: "monospace",
        })
        .setOrigin(0.5);

      return;
    }

    this.checkpoints = this.arcadeData.course.mapJson.checkpoints;

    this.configureWorldAndCamera();
    this.createWaterBackground();
    this.createCourseObjects();
    this.createPlayer();
    this.createCpuRacers();
    this.createHud();
    this.createNextBuoyArrow();
    this.createControls();
    this.startCountdown();
  }

  update(time: number, delta: number) {
    this.updateWaterMotion(delta);
    this.updateNextBuoyArrow();

    if (!this.raceStarted || this.isRacePaused) return;

    this.collisionPenaltyCooldown = Math.max(
      0,
      this.collisionPenaltyCooldown - delta,
    );

    this.player.collisionCooldown = Math.max(
      0,
      (this.player.collisionCooldown || 0) - delta,
    );

    this.cpuRacers.forEach((cpu) => {
      cpu.collisionCooldown = Math.max(0, (cpu.collisionCooldown || 0) - delta);
    });

    this.updatePlayer(delta);
    this.updateCpuRacers(delta);
    this.updateCheckpointLogic();
    this.updateHud(time);
  }

  private getWorldSize() {
    return {
      width: Number(this.arcadeData.course.mapJson.width || 2400),
      height: Number(this.arcadeData.course.mapJson.height || 1600),
    };
  }

  private configureWorldAndCamera() {
    const { width, height } = this.getWorldSize();

    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    this.cameras.main.setZoom(1.35);
    this.cameras.main.setLerp(0.12, 0.12);
    this.cameras.main.roundPixels = true;
  }

  private createWaterBackground() {
    const { width, height } = this.getWorldSize();

    const base = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x034f84,
    );

    base.setDepth(0);

    if (this.textures.exists("water_base")) {
      this.waterTile = this.add.tileSprite(
        width / 2,
        height / 2,
        width,
        height,
        "water_base",
      );

      this.waterTile.setDepth(1);
      this.waterTile.setAlpha(0.58);
      this.waterTile.setTint(0x0a5f9c);

      this.add
        .rectangle(width / 2, height / 2, width, height, 0x002b55, 0.28)
        .setDepth(2);

      return;
    }

    const graphics = this.add.graphics();
    graphics.setDepth(1);

    graphics.fillStyle(0x078bd7, 1);
    graphics.fillRect(0, 0, width, height);

    for (let i = 0; i < 340; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const w = Phaser.Math.Between(10, 44);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.32);

      graphics.fillStyle(0x8be8ff, alpha);
      graphics.fillRect(x, y, w, 2);
    }
  }

  private updateWaterMotion(delta: number) {
    if (!this.waterTile) return;

    this.waterTile.tilePositionX += delta * 0.006;
    this.waterTile.tilePositionY += delta * 0.003;
  }

  private createCourseObjects() {
    this.checkpoints.forEach((checkpoint, index) => {
      const marker = this.createBuoyMarker(
        checkpoint.x,
        checkpoint.y,
        checkpoint.side,
      );

      marker.setAlpha(index === 0 ? 1 : 0.55);
      this.checkpointMarkers.push(marker);
    });

    const start = this.arcadeData.course.mapJson.start;

    this.add.rectangle(start.x, start.y + 52, 320, 10, 0xffd51e).setDepth(3);

    this.add
      .text(start.x, start.y + 92, "START", {
        color: "#ffffff",
        fontSize: "22px",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  private createBuoyMarker(
    x: number,
    y: number,
    side: "left" | "right",
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Arc {
    const textureKey = side === "right" ? "buoy_yellow" : "buoy_red";

    if (this.textures.exists(textureKey)) {
      const buoy = this.add.image(x, y, textureKey);
      buoy.setDisplaySize(40, 40);
      buoy.setDepth(12);
      return buoy;
    }

    const color = side === "right" ? 0xffd51e : 0xff3434;
    const circle = this.add.circle(x, y, 16, color);
    circle.setStrokeStyle(4, 0xffffff);
    circle.setDepth(12);
    return circle;
  }

  private createPlayer() {
    const textureKey = this.textures.exists("rider_player_stable")
      ? "rider_player_stable"
      : "player_ski";

    if (!this.textures.exists("rider_player_stable")) {
      this.drawRacerTexture("player_ski", 0xf6d32d);
    }

    this.player = this.physics.add.sprite(
      this.arcadeData.course.mapJson.start.x,
      this.arcadeData.course.mapJson.start.y,
      textureKey,
    ) as RacerSprite;

    this.player.setOrigin(0.5, 0.5);

    if (textureKey === "rider_player_stable") {
      this.player.setDisplaySize(72, 72);
      this.player.setSize(42, 42);
      this.player.setOffset(43, 43);
    } else {
      this.player.setDisplaySize(46, 62);
    }

    this.player.setDepth(30);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(40);
    this.player.setMaxVelocity(PLAYER_STATS.maxSpeed);
    this.player.stats = PLAYER_STATS;
    this.player.racerName = "YOU";
    this.player.collisionCooldown = 0;
    this.player.lastWakeAt = 0;

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private createCpuRacers() {
    const cpuTextureKeys = [
      "rider_cpu_red",
      "rider_cpu_blue",
      "rider_cpu_purple",
      "rider_cpu_yellow",
    ];

    const fallbackColors = [0xff4d35, 0x35a7ff, 0xa855f7, 0xffd51e];

    const start = this.arcadeData.course.mapJson.start;

    const startOffsets = [
      { x: -78, y: 30 },
      { x: 78, y: 30 },
      { x: -38, y: 86 },
      { x: 38, y: 86 },
    ];

    this.arcadeData.cpuRacers.forEach((cpu, index) => {
      let textureKey = cpuTextureKeys[index % cpuTextureKeys.length];

      if (!this.textures.exists(textureKey)) {
        textureKey = `cpu_ski_${index}`;
        this.drawRacerTexture(
          textureKey,
          fallbackColors[index % fallbackColors.length],
        );
      }

      const offset = startOffsets[index % startOffsets.length];

      const sprite = this.physics.add.sprite(
        start.x + offset.x,
        start.y + offset.y,
        textureKey,
      ) as RacerSprite;

      sprite.setOrigin(0.5, 0.5);

      if (textureKey.startsWith("rider_cpu_")) {
        sprite.setDisplaySize(72, 72);
        sprite.setSize(42, 42);
        sprite.setOffset(43, 43);
      } else {
        sprite.setDisplaySize(46, 62);
      }

      sprite.setDepth(29);
      sprite.setCollideWorldBounds(true);
      sprite.stats = this.createCpuRaceStats(cpu, index);
      sprite.racerName = cpu.displayName || `CPU ${index + 1}`;
      sprite.targetCheckpointIndex = 0;
      sprite.lap = 1;
      sprite.penalties = 0;
      sprite.finished = false;
      sprite.collisionCooldown = 0;
      sprite.lastWakeAt = 0;

      this.cpuRacers.push(sprite);
    });

    this.physics.add.collider(this.player, this.cpuRacers, (a, b) => {
      this.handleRacerCollision(a as RacerSprite, b as RacerSprite);
    });

    this.physics.add.collider(this.cpuRacers, this.cpuRacers, (a, b) => {
      this.handleRacerCollision(a as RacerSprite, b as RacerSprite);
    });
  }

  private createCpuRaceStats(cpu: any, index: number) {
    const base = cpuStatsFromRacer(cpu);

    const profiles = [
      {
        speed: 1.23,
        acceleration: 1.18,
        turn: 1.08,
        dragBoost: 1.008,
      },
      {
        speed: 0.97,
        acceleration: 0.95,
        turn: 0.98,
        dragBoost: 1.0,
      },
      {
        speed: Phaser.Math.FloatBetween(1.07, 1.16),
        acceleration: Phaser.Math.FloatBetween(1.04, 1.13),
        turn: Phaser.Math.FloatBetween(1.0, 1.09),
        dragBoost: Phaser.Math.FloatBetween(1.002, 1.008),
      },
      {
        speed: Phaser.Math.FloatBetween(1.08, 1.18),
        acceleration: Phaser.Math.FloatBetween(1.05, 1.14),
        turn: Phaser.Math.FloatBetween(1.0, 1.1),
        dragBoost: Phaser.Math.FloatBetween(1.002, 1.008),
      },
    ];

    const profile = profiles[index] || profiles[2];

    return {
      ...base,
      maxSpeed: base.maxSpeed * profile.speed * 1.08,
      acceleration: base.acceleration * profile.acceleration * 1.08,
      turnSpeed: base.turnSpeed * profile.turn,
      drag: Math.min(0.992, base.drag * profile.dragBoost),
      slideFactor: base.slideFactor,
      mistakeChance: base.mistakeChance,
    };
  }

  private handleRacerCollision(a: RacerSprite, b: RacerSprite) {
    const aCooldown = a.collisionCooldown || 0;
    const bCooldown = b.collisionCooldown || 0;

    if (aCooldown > 0 || bCooldown > 0) return;

    a.collisionCooldown = 900;
    b.collisionCooldown = 900;

    const aBody = a.body as Phaser.Physics.Arcade.Body;
    const bBody = b.body as Phaser.Physics.Arcade.Body;

    const angle = Phaser.Math.Angle.Between(b.x, b.y, a.x, a.y);

    const pushA = new Phaser.Math.Vector2(
      Math.cos(angle) * 110,
      Math.sin(angle) * 110,
    );

    const pushB = new Phaser.Math.Vector2(
      -Math.cos(angle) * 110,
      -Math.sin(angle) * 110,
    );

    aBody.velocity.scale(0.42);
    bBody.velocity.scale(0.42);

    aBody.velocity.add(pushA);
    bBody.velocity.add(pushB);

    a.rotation += Phaser.Math.FloatBetween(-0.45, 0.45);
    b.rotation += Phaser.Math.FloatBetween(-0.45, 0.45);

    this.spawnSplash((a.x + b.x) / 2, (a.y + b.y) / 2);

    if (a === this.player || b === this.player) {
      this.collisionPenaltyCooldown = 1200;
    }
  }

  private drawRacerTexture(key: string, color: number) {
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0x111111, 1);
    g.fillTriangle(20, 4, 4, 54, 36, 54);

    g.fillStyle(color, 1);
    g.fillTriangle(20, 10, 9, 49, 31, 49);

    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 24, 7);

    g.generateTexture(key, 40, 60);
    g.destroy();
  }

  private createHud() {
    const leftX = 180;
    const topY = 110;

    this.raceTimeText = this.add.text(leftX, topY, "TIME 00:00.00", {
      color: "#ffffff",
      fontSize: "24px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: { x: 12, y: 7 },
    });

    this.lapText = this.add.text(leftX, topY + 54, "LAP 1/3", {
      color: "#ffdf2e",
      fontSize: "21px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: { x: 12, y: 7 },
    });

    this.penaltyText = this.add.text(leftX, topY + 100, "MISSED BUOYS 0", {
      color: "#ff6969",
      fontSize: "17px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: { x: 12, y: 7 },
    });

    this.leaderboardText = this.add.text(leftX, 430, "", {
      color: "#ffffff",
      fontSize: "13px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: { x: 14, y: 10 },
      lineSpacing: 5,
    });

    this.positionText = this.add.text(1000, 110, "1ST\n/ 5", {
      color: "#ffdf2e",
      fontSize: "32px",
      fontFamily: "monospace",
      fontStyle: "bold",
      align: "center",
      backgroundColor: "#031225",
      padding: { x: 16, y: 10 },
    });

    this.bestLapText = this.add.text(990, 222, "BEST LAP\n--:--.--", {
      color: "#67e8f9",
      fontSize: "15px",
      fontFamily: "monospace",
      fontStyle: "bold",
      align: "center",
      backgroundColor: "#031225",
      padding: { x: 12, y: 8 },
    });

    [
      this.raceTimeText,
      this.lapText,
      this.penaltyText,
      this.leaderboardText,
      this.positionText,
      this.bestLapText,
    ].forEach((text) => {
      text.setScrollFactor(0);
      text.setDepth(100);
    });

    this.countdownText = this.add.text(640, 300, "3", {
      color: "#ffdf2e",
      fontSize: "110px",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 10,
    });

    this.countdownText.setOrigin(0.5);
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(100);
  }

  private createNextBuoyArrow() {
    // Fixed screen position. This never moves.
    this.nextBuoyArrow = this.add.container(640, 145);
    this.nextBuoyArrow.setScrollFactor(0);
    this.nextBuoyArrow.setDepth(101);

    this.nextBuoyArrowRotor = this.add.container(0, 0);

    const arrow = this.add.polygon(
      0,
      0,
      [
        34,
        0, // nose
        4,
        -24, // upper head
        4,
        -9, // upper shaft
        -34,
        -9, // shaft back top
        -34,
        9, // shaft back bottom
        4,
        9, // lower shaft
        4,
        24, // lower head
      ],
      0xffdf2e,
    );

    arrow.setStrokeStyle(5, 0x000000);
    arrow.setOrigin(0.5, 0.5);

    this.nextBuoyArrowRotor.add([arrow]);
    this.nextBuoyArrow.add([this.nextBuoyArrowRotor]);

    this.nextBuoyArrow.setScale(0.95);
  }

  private updateNextBuoyArrow() {
    if (
      !this.nextBuoyArrow ||
      !this.nextBuoyArrowRotor ||
      !this.player ||
      !this.checkpoints.length
    ) {
      return;
    }

    const target = this.checkpoints[this.playerCheckpointIndex];

    if (!target) return;

    const camera = this.cameras.main;
    const worldView = camera.worldView;

    const isVisible =
      target.x >= worldView.x &&
      target.x <= worldView.x + worldView.width &&
      target.y >= worldView.y &&
      target.y <= worldView.y + worldView.height;

    const targetAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
    );

    this.nextBuoyArrowRotor.rotation = Phaser.Math.Angle.RotateTo(
      this.nextBuoyArrowRotor.rotation,
      targetAngle,
      0.12,
    );

    this.nextBuoyArrow.setAlpha(isVisible ? 0.55 : 1);
  }

  private createControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.wasd = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private startCountdown() {
    const sequence = ["3", "2", "1", "GO!"];
    let index = 0;

    this.countdownText.setText(sequence[index]);

    this.time.addEvent({
      delay: 750,
      repeat: sequence.length - 1,
      callback: () => {
        index += 1;
        this.countdownText.setText(sequence[index]);

        if (sequence[index] === "GO!") {
          this.raceStarted = true;
          this.raceStartTime = this.time.now;

          this.time.delayedCall(650, () => {
            this.countdownText.setVisible(false);
          });
        }
      },
    });
  }

  private updatePlayer(delta: number) {
    const stats = this.player.stats || PLAYER_STATS;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const up = this.cursors.up?.isDown || this.wasd.w.isDown;
    const down = this.cursors.down?.isDown || this.wasd.s.isDown;
    const left = this.cursors.left?.isDown || this.wasd.a.isDown;
    const right = this.cursors.right?.isDown || this.wasd.d.isDown;

    const dt = delta / 1000;
    const input = new Phaser.Math.Vector2(0, 0);

    if (up) input.y -= 1;
    if (down) input.y += 1;
    if (left) input.x -= 1;
    if (right) input.x += 1;

    const isMovingInput = input.lengthSq() > 0;

    let turnAmount = 0;

    if (isMovingInput) {
      input.normalize();

      body.velocity.x += input.x * stats.acceleration * dt;
      body.velocity.y += input.y * stats.acceleration * dt;

      const targetRotation = input.angle() + Math.PI / 2;
      const angleDiff = Phaser.Math.Angle.Wrap(
        targetRotation - this.player.rotation,
      );

      turnAmount = angleDiff;

      this.player.rotation += Phaser.Math.Clamp(
        angleDiff,
        -stats.turnSpeed * dt,
        stats.turnSpeed * dt,
      );
    }

    this.updateRacerWake(
      this.player,
      isMovingInput || body.velocity.length() > 18,
      turnAmount,
    );

    body.velocity.scale(stats.drag);

    const speed = body.velocity.length();

    if (speed > stats.maxSpeed) {
      body.velocity.normalize().scale(stats.maxSpeed);
    }

    if (speed > 8 && !isMovingInput) {
      const velocityAngle = body.velocity.angle() + Math.PI / 2;
      const angleDiff = Phaser.Math.Angle.Wrap(
        velocityAngle - this.player.rotation,
      );

      this.player.rotation += Phaser.Math.Clamp(
        angleDiff,
        -stats.turnSpeed * dt * 0.5,
        stats.turnSpeed * dt * 0.5,
      );
    }
  }

  private updateCpuRacers(delta: number) {
    this.cpuRacers.forEach((cpu) => {
      if (cpu.finished) return;

      const stats = cpu.stats!;
      const targetIndex = cpu.targetCheckpointIndex || 0;
      const target = this.checkpoints[targetIndex];

      if (!target) return;

      const body = cpu.body as Phaser.Physics.Arcade.Body;
      const dt = delta / 1000;

      const distance = Phaser.Math.Distance.Between(
        cpu.x,
        cpu.y,
        target.x,
        target.y,
      );

      const desiredAngle =
        Phaser.Math.Angle.Between(cpu.x, cpu.y, target.x, target.y) +
        Math.PI / 2;

      const angleDiff = Phaser.Math.Angle.Wrap(desiredAngle - cpu.rotation);

      cpu.rotation += Phaser.Math.Clamp(
        angleDiff,
        -stats.turnSpeed * dt,
        stats.turnSpeed * dt,
      );

      const slowDownNearBuoy = distance < 140 ? 0.82 : 1;
      const force = new Phaser.Math.Vector2();

      this.physics.velocityFromRotation(
        cpu.rotation - Math.PI / 2,
        stats.acceleration * dt * slowDownNearBuoy,
        force,
      );

      body.velocity.add(force);
      body.velocity.scale(stats.drag);

      const maxSpeed = stats.maxSpeed * slowDownNearBuoy;

      if (body.velocity.length() > maxSpeed) {
        body.velocity.normalize().scale(maxSpeed);
      }

      this.updateRacerWake(cpu, body.velocity.length() > 18, angleDiff);

      if (distance < 70) {
        cpu.targetCheckpointIndex = targetIndex + 1;

        if (cpu.targetCheckpointIndex >= this.checkpoints.length) {
          cpu.targetCheckpointIndex = 0;
          cpu.lap = (cpu.lap || 1) + 1;

          if ((cpu.lap || 1) > this.arcadeData.course.mapJson.laps) {
            cpu.finished = true;
          }
        }
      }
    });
  }

  private updateCheckpointLogic() {
    const target = this.checkpoints[this.playerCheckpointIndex];

    if (!target) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
    );

    if (distance < 70) {
      this.playerCheckpointIndex += 1;

      this.checkpointMarkers.forEach((marker, index) => {
        marker.setAlpha(index === this.playerCheckpointIndex ? 1 : 0.55);
      });

      if (this.playerCheckpointIndex >= this.checkpoints.length) {
        this.playerCheckpointIndex = 0;
        this.playerLap += 1;

        if (this.checkpointMarkers[0]) {
          this.checkpointMarkers[0].setAlpha(1);
        }

        if (this.playerLap > this.arcadeData.course.mapJson.laps) {
          this.finishRace();
        }
      }
    }
  }

  private getRaceStandings(): RaceStanding[] {
    const racers: RaceStanding[] = [
      {
        name: "YOU",
        isPlayer: true,
        lap: this.playerLap,
        checkpointIndex: this.playerCheckpointIndex,
        progress: this.playerLap * 1000 + this.playerCheckpointIndex,
      },
      ...this.cpuRacers.map((cpu, index) => {
        const lap = cpu.lap || 1;
        const checkpointIndex = cpu.targetCheckpointIndex || 0;

        return {
          name: cpu.racerName || `CPU ${index + 1}`,
          isPlayer: false,
          lap,
          checkpointIndex,
          finished: cpu.finished,
          progress: lap * 1000 + checkpointIndex,
        };
      }),
    ];

    return racers.sort((a, b) => b.progress - a.progress);
  }

  private getOrdinal(value: number) {
    if (value === 1) return "1ST";
    if (value === 2) return "2ND";
    if (value === 3) return "3RD";
    return `${value}TH`;
  }

  private updateHud(time: number) {
    const elapsed = Math.max(0, time - this.raceStartTime);
    const standings = this.getRaceStandings();
    const playerPosition =
      standings.findIndex((standing) => standing.isPlayer) + 1 || 1;

    this.raceTimeText.setText(`⏱ ${this.formatTime(elapsed)}`);

    this.lapText.setText(
      `LAP ${Math.min(
        this.playerLap,
        this.arcadeData.course.mapJson.laps,
      )}/${this.arcadeData.course.mapJson.laps}`,
    );

    this.penaltyText.setText(`MISSED BUOYS ${this.playerPenalties}`);

    this.positionText.setText(
      `${this.getOrdinal(playerPosition)}\n/ ${standings.length}`,
    );

    this.bestLapText.setText("BEST LAP\n--:--.--");

    const leaderboardLines = standings.slice(0, 5).map((standing, index) => {
      const rank = index + 1;
      const name = standing.isPlayer ? "YOU" : standing.name.toUpperCase();
      const lap = Math.min(standing.lap, this.arcadeData.course.mapJson.laps);

      return `${rank} ${name.padEnd(12, " ").slice(0, 12)} L${lap}`;
    });

    this.leaderboardText.setText(
      ["WEEKLY CHALLENGE", ...leaderboardLines].join("\n"),
    );
  }

  private finishRace() {
    const timeMs = Math.floor(this.time.now - this.raceStartTime);

    this.scene.start("ResultsScene", {
      courseId: this.arcadeData.course.id,
      displayName: "YOU",
      timeMs,
      penalties: this.playerPenalties,
      lapsCompleted: this.arcadeData.course.mapJson.laps,
      completed: true,
    });
  }

  private getWakeTextureKey(turnAmount: number) {
    if (turnAmount < -0.22 && this.textures.exists("wake_left")) {
      return "wake_left";
    }

    if (turnAmount > 0.22 && this.textures.exists("wake_right")) {
      return "wake_right";
    }

    if (this.textures.exists("wake_straight")) {
      return "wake_straight";
    }

    return this.textures.exists("wake_fx") ? "wake_fx" : "";
  }

  private updateRacerWake(
    racer: RacerSprite,
    isMoving: boolean,
    turnAmount: number,
  ) {
    if (!isMoving || racer.finished) {
      if (racer.wakeSprite) {
        racer.wakeSprite.setVisible(false);
      }

      return;
    }

    const textureKey = this.getWakeTextureKey(turnAmount);

    if (!textureKey) return;

    if (!racer.wakeSprite) {
      racer.wakeSprite = this.add.sprite(racer.x, racer.y, textureKey, 0);
      racer.wakeSprite.setDepth(8);
      racer.wakeSprite.setAlpha(1);
      racer.wakeSprite.setOrigin(0.5, 0.5);
    }

    if (racer.wakeSprite.texture.key !== textureKey) {
      racer.wakeSprite.setTexture(textureKey);
    }

    const wakeFrame = Math.floor(this.time.now / 100) % 4;
    racer.wakeSprite.setFrame(wakeFrame);

    const backAngle = racer.rotation + Math.PI / 2;
    const wakeDistance = 72;

    const wakeX = racer.x + Math.cos(backAngle) * wakeDistance;
    const wakeY = racer.y + Math.sin(backAngle) * wakeDistance;

    racer.wakeSprite.setVisible(true);
    racer.wakeSprite.setPosition(wakeX, wakeY);

    // 90 degree rotation.
    racer.wakeSprite.setRotation(racer.rotation + Math.PI / 2);

    // Full opacity.
    racer.wakeSprite.setAlpha(1);

    if (textureKey === "wake_straight") {
      racer.wakeSprite.setDisplaySize(116, 58);
    } else {
      racer.wakeSprite.setDisplaySize(126, 72);
    }
  }

  private spawnSplash(x: number, y: number) {
    if (this.textures.exists("splash_fx")) {
      const splash = this.add.image(x, y, "splash_fx");

      splash.setDepth(40);
      splash.setAlpha(0.5);
      splash.setDisplaySize(82, 82);

      this.tweens.add({
        targets: splash,
        alpha: 0,
        scaleX: 0.82,
        scaleY: 0.82,
        duration: 420,
        ease: "Quad.easeOut",
        onComplete: () => splash.destroy(),
      });

      return;
    }

    const splash = this.add.circle(x, y, 24, 0xffffff, 0.5);
    splash.setDepth(40);

    this.tweens.add({
      targets: splash,
      alpha: 0,
      scale: 1.45,
      duration: 420,
      onComplete: () => splash.destroy(),
    });
  }

  private formatTime(ms: number) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}.${String(hundredths).padStart(2, "0")}`;
  }
}
