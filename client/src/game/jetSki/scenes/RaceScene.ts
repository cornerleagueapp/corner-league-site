import Phaser from "phaser";
import type { ArcadeGameData } from "../../core/types";
import {
  PLAYER_STATS,
  cpuStatsFromRacer,
  DIFFICULTY_PROFILES,
  type RaceDifficulty,
} from "../systems/PhysicsTuning";

type Checkpoint = {
  id: number;
  x: number;
  y: number;
  side: "left" | "right";
};

type RaceSettings = {
  laps: number;
  difficulty: RaceDifficulty;
};

type RacerSprite = Phaser.Physics.Arcade.Sprite & {
  racerName?: string;
  targetCheckpointIndex?: number;
  lap?: number;
  penalties?: number;
  finished?: boolean;
  finishTimeMs?: number;
  finishOrder?: number;
  stats?: typeof PLAYER_STATS;
  collisionCooldown?: number;
  lastWakeAt?: number;
  wakeSprite?: Phaser.GameObjects.Sprite;
  lastTurnAmount?: number;
  lapGateArmed?: boolean;
  insideFinishGate?: boolean;
  finishCoasting?: boolean;
  finishCoastStartedAt?: number;
  finishCoastDirection?: Phaser.Math.Vector2;
  minimapColor?: number;
  nameTag?: Phaser.GameObjects.Text;
};

type RaceStanding = {
  name: string;
  isPlayer: boolean;
  lap: number;
  checkpointIndex: number;
  progress: number;
  finished?: boolean;
  timeMs?: number;
  finishOrder?: number;
};

const FINISH_GATE_X_OFFSET_FROM_YELLOW = 100;
const FINISH_GATE_BOTTOM_Y_OFFSET_FROM_YELLOW = 90;
const FINISH_GATE_GAP = 175;
const FINISH_GATE_BUOY_SIZE = 48;
const FINISH_GATE_TRIGGER_HALF_WIDTH = 70;
const FINISH_COAST_DURATION_MS = 2300;
const FINISH_PASS_THROUGH_DURATION_MS = 700;
const FINISH_PASS_THROUGH_MIN_SPEED = 145;
const FINISH_COAST_DRAG = 0.982;
const FINISH_COAST_STOP_SPEED = 7;

const MINIMAP_WIDTH = 150;
const MINIMAP_HEIGHT = 100;
const MINIMAP_X = 1025;
const MINIMAP_Y = 270;
const MINIMAP_PADDING = 4;

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
  private playerFinishTimeMs?: number;

  private raceStarted = false;
  private raceStartTime = 0;
  private collisionPenaltyCooldown = 0;
  private isRacePaused = false;
  private raceFinished = false;
  private nextFinishOrder = 1;
  private resultsTransitionStarted = false;

  private playerLapGateArmed = false;
  private playerInsideFinishGate = false;

  private finishGateX = 0;
  private finishGateCenterY = 0;
  private finishGateTopY = 0;
  private finishGateBottomY = 0;

  private finishCheckpointIndex = 0;

  private raceSettings: RaceSettings = {
    laps: 3,
    difficulty: "pro",
  };

  private raceTimeText!: Phaser.GameObjects.Text;
  private lapText!: Phaser.GameObjects.Text;
  private penaltyText!: Phaser.GameObjects.Text;
  private positionText!: Phaser.GameObjects.Text;
  private leaderboardText!: Phaser.GameObjects.Text;

  private playerStartingGridIndex = 0;
  private cpuStartingGridIndices: number[] = [];
  private countdownText!: Phaser.GameObjects.Text;

  private minimapBackground!: Phaser.GameObjects.Rectangle;
  private minimapCourseGraphics!: Phaser.GameObjects.Graphics;
  private minimapRacerGraphics!: Phaser.GameObjects.Graphics;

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

    this.load.image("finish_line_buoy", "/arcade/jetSki/buoys/finish-line.png");

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

    const registrySettings = this.game.registry.get("raceSettings") as
      | Partial<RaceSettings>
      | undefined;

    this.raceSettings = {
      laps: Phaser.Math.Clamp(Number(registrySettings?.laps || 3), 1, 10),

      difficulty:
        registrySettings?.difficulty === "junior" ||
        registrySettings?.difficulty === "amateur" ||
        registrySettings?.difficulty === "pro"
          ? registrySettings.difficulty
          : "pro",
    };

    this.cpuRacers = [];
    this.checkpointMarkers = [];

    this.playerCheckpointIndex = 0;
    this.playerLap = 1;
    this.playerPenalties = 0;
    this.playerFinishTimeMs = undefined;

    this.playerLapGateArmed = false;
    this.playerInsideFinishGate = false;

    this.raceStarted = false;
    this.raceStartTime = 0;
    this.collisionPenaltyCooldown = 0;
    this.isRacePaused = false;
    this.raceFinished = false;
    this.nextFinishOrder = 1;
    this.resultsTransitionStarted = false;

    this.waterTile = undefined;

    const totalRacers = this.arcadeData?.cpuRacers?.length + 1;
    const randomizedGridSlots = Phaser.Utils.Array.Shuffle(
      Array.from({ length: totalRacers }, (_, index) => index),
    );

    this.playerStartingGridIndex = randomizedGridSlots[0] ?? 0;
    this.cpuStartingGridIndices = randomizedGridSlots.slice(1);

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
    this.createMinimap();
    this.createNextBuoyArrow();
    this.createControls();
    this.startCountdown();
  }

  update(time: number, delta: number) {
    this.updateWaterMotion(delta);
    this.updateNextBuoyArrow();
    this.updateMinimapRacers();
    this.updateRacerNameTags();

    if (!this.raceStarted || this.isRacePaused) {
      return;
    }

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

    if (this.raceFinished) {
      this.updateFinishedRacerCoast(this.player);
      this.updateCpuRacers(delta);
      this.updateHud(time);
      return;
    }

    this.updatePlayer(delta);
    this.updateCpuRacers(delta);
    this.updateCheckpointLogic();
    this.updatePlayerFinishGate();
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

    for (let i = 0; i < 340; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const w = Phaser.Math.Between(10, 44);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.32);

      graphics.fillStyle(0x8be8ff, alpha);
      graphics.fillRect(x, y, w, 2);
    }
  }

  private updateWaterMotion(delta: number) {
    if (!this.waterTile) {
      return;
    }

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
      this.addBuoyWaterMotion(marker, index);
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

    this.createFinishGate();
  }

  private createFinishGate() {
    const start = this.arcadeData.course.mapJson.start;

    const yellowCheckpointCandidates = this.checkpoints
      .map((checkpoint, index) => ({
        checkpoint,
        index,
        distanceFromStart: Phaser.Math.Distance.Between(
          checkpoint.x,
          checkpoint.y,
          start.x,
          start.y,
        ),
      }))
      .filter(({ checkpoint }) => checkpoint.side === "right")
      .sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    const finishCheckpoint = yellowCheckpointCandidates[0];

    if (!finishCheckpoint) {
      console.error(
        "Cannot create finish gate because no yellow checkpoint was found.",
      );

      return;
    }

    this.finishCheckpointIndex = finishCheckpoint.index;

    const yellowCheckpoint = finishCheckpoint.checkpoint;

    this.finishGateX = yellowCheckpoint.x + FINISH_GATE_X_OFFSET_FROM_YELLOW;

    this.finishGateBottomY =
      yellowCheckpoint.y + FINISH_GATE_BOTTOM_Y_OFFSET_FROM_YELLOW;

    this.finishGateTopY = this.finishGateBottomY - FINISH_GATE_GAP;

    this.finishGateCenterY = (this.finishGateTopY + this.finishGateBottomY) / 2;

    if (this.textures.exists("finish_line_buoy")) {
      const topBuoy = this.add.image(
        this.finishGateX,
        this.finishGateTopY,
        "finish_line_buoy",
      );

      const bottomBuoy = this.add.image(
        this.finishGateX,
        this.finishGateBottomY,
        "finish_line_buoy",
      );

      [topBuoy, bottomBuoy].forEach((buoy, index) => {
        buoy.setDisplaySize(FINISH_GATE_BUOY_SIZE, FINISH_GATE_BUOY_SIZE);
        buoy.setDepth(12);
        buoy.setAlpha(1);
        this.addBuoyWaterMotion(buoy, this.checkpoints.length + index);
      });

      return;
    }

    const topFallback = this.add.circle(
      this.finishGateX,
      this.finishGateTopY,
      20,
      0xffffff,
    );

    const bottomFallback = this.add.circle(
      this.finishGateX,
      this.finishGateBottomY,
      20,
      0xffffff,
    );

    [topFallback, bottomFallback].forEach((buoy, index) => {
      buoy.setStrokeStyle(5, 0x000000);
      buoy.setDepth(12);
      this.addBuoyWaterMotion(buoy, this.checkpoints.length + index);
    });
  }

  private addBuoyWaterMotion(
    buoy: Phaser.GameObjects.Image | Phaser.GameObjects.Arc,
    index: number,
  ) {
    const baseY = buoy.y;
    const baseRotation = buoy.rotation;
    const direction = index % 2 === 0 ? 1 : -1;

    this.tweens.add({
      targets: buoy,
      y: baseY + Phaser.Math.FloatBetween(2.5, 4.5),
      rotation:
        baseRotation +
        Phaser.Math.DegToRad(Phaser.Math.FloatBetween(1.5, 3.2) * direction),
      duration: Phaser.Math.Between(1050, 1500),
      delay: Phaser.Math.Between(0, 650),
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
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

  private getStartingGridPosition(index: number, totalRacers: number) {
    const start = this.arcadeData.course.mapJson.start;
    const spacing = 72;
    const totalWidth = Math.max(0, totalRacers - 1) * spacing;

    return {
      x: start.x - totalWidth / 2 + index * spacing,
      y: start.y,
    };
  }

  private createPlayer() {
    const textureKey = this.textures.exists("rider_player_stable")
      ? "rider_player_stable"
      : "player_ski";

    if (!this.textures.exists("rider_player_stable")) {
      this.drawRacerTexture("player_ski", 0xf6d32d);
    }

    const totalRacers = this.arcadeData.cpuRacers.length + 1;
    const playerStart = this.getStartingGridPosition(
      this.playerStartingGridIndex,
      totalRacers,
    );

    this.player = this.physics.add.sprite(
      playerStart.x,
      playerStart.y,
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
    this.player.lapGateArmed = false;
    this.player.insideFinishGate = false;
    this.player.finishCoasting = false;
    this.player.finishCoastStartedAt = undefined;
    this.player.finishCoastDirection = undefined;
    this.player.minimapColor = 0xffdf2e;
    this.player.nameTag = this.createRacerNameTag("YOU", true);

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

    const totalRacers = this.arcadeData.cpuRacers.length + 1;
    const minimapColors = [0xff4d35, 0x35a7ff, 0xa855f7, 0xffd51e];

    this.arcadeData.cpuRacers.forEach((cpu, index) => {
      let textureKey = cpuTextureKeys[index % cpuTextureKeys.length];

      if (!this.textures.exists(textureKey)) {
        textureKey = `cpu_ski_${index}`;

        this.drawRacerTexture(
          textureKey,
          fallbackColors[index % fallbackColors.length],
        );
      }

      const cpuGridIndex = this.cpuStartingGridIndices[index] ?? index + 1;

      const cpuStart = this.getStartingGridPosition(cpuGridIndex, totalRacers);

      const sprite = this.physics.add.sprite(
        cpuStart.x,
        cpuStart.y,
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
      sprite.finishTimeMs = undefined;
      sprite.finishOrder = undefined;
      sprite.collisionCooldown = 0;
      sprite.lastWakeAt = 0;
      sprite.lapGateArmed = false;
      sprite.insideFinishGate = false;
      sprite.finishCoasting = false;
      sprite.finishCoastStartedAt = undefined;
      sprite.finishCoastDirection = undefined;
      sprite.minimapColor = minimapColors[index % minimapColors.length];
      sprite.nameTag = this.createRacerNameTag(
        sprite.racerName || `CPU ${index + 1}`,
        false,
      );

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
    const base = cpuStatsFromRacer(cpu, this.raceSettings.difficulty);

    const difficultyScale =
      this.raceSettings.difficulty === "junior"
        ? 0.76
        : this.raceSettings.difficulty === "amateur"
          ? 0.89
          : 1;

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
        dragBoost: 1,
      },
      {
        speed: Phaser.Math.FloatBetween(1.07, 1.16),
        acceleration: Phaser.Math.FloatBetween(1.04, 1.13),
        turn: Phaser.Math.FloatBetween(1, 1.09),
        dragBoost: Phaser.Math.FloatBetween(1.002, 1.008),
      },
      {
        speed: Phaser.Math.FloatBetween(1.08, 1.18),
        acceleration: Phaser.Math.FloatBetween(1.05, 1.14),
        turn: Phaser.Math.FloatBetween(1, 1.1),
        dragBoost: Phaser.Math.FloatBetween(1.002, 1.008),
      },
    ];

    const profile = profiles[index] || profiles[2];

    return {
      ...base,
      maxSpeed: base.maxSpeed * profile.speed * 1.08 * difficultyScale,
      acceleration:
        base.acceleration * profile.acceleration * 1.08 * difficultyScale,
      turnSpeed: base.turnSpeed * profile.turn,
      drag: Math.min(0.992, base.drag * profile.dragBoost),
      slideFactor: base.slideFactor,
      mistakeChance: base.mistakeChance,
    };
  }

  private handleRacerCollision(a: RacerSprite, b: RacerSprite) {
    const aCooldown = a.collisionCooldown || 0;
    const bCooldown = b.collisionCooldown || 0;

    if (aCooldown > 0 || bCooldown > 0) {
      return;
    }

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
    if (this.textures.exists(key)) {
      return;
    }

    const g = this.make.graphics(
      {
        x: 0,
        y: 0,
      },
      false,
    );

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
      padding: {
        x: 12,
        y: 7,
      },
    });

    this.lapText = this.add.text(
      leftX,
      topY + 54,
      `LAP 1/${this.raceSettings.laps}`,
      {
        color: "#ffdf2e",
        fontSize: "21px",
        fontFamily: "monospace",
        fontStyle: "bold",
        backgroundColor: "#031225",
        padding: {
          x: 12,
          y: 7,
        },
      },
    );

    this.penaltyText = this.add.text(leftX, topY + 100, "MISSED BUOYS 0", {
      color: "#ff6969",
      fontSize: "17px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: {
        x: 12,
        y: 7,
      },
    });

    this.leaderboardText = this.add.text(leftX, 430, "", {
      color: "#ffffff",
      fontSize: "13px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "#031225",
      padding: {
        x: 14,
        y: 10,
      },
      lineSpacing: 5,
    });

    this.positionText = this.add.text(1000, 110, "1ST\n/ 5", {
      color: "#ffdf2e",
      fontSize: "32px",
      fontFamily: "monospace",
      fontStyle: "bold",
      align: "center",
      backgroundColor: "#031225",
      padding: {
        x: 16,
        y: 10,
      },
    });

    [
      this.raceTimeText,
      this.lapText,
      this.penaltyText,
      this.leaderboardText,
      this.positionText,
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

  private createMinimap() {
    this.minimapBackground = this.add
      .rectangle(
        MINIMAP_X,
        MINIMAP_Y,
        MINIMAP_WIDTH,
        MINIMAP_HEIGHT,
        0x031225,
        0.9,
      )
      .setScrollFactor(0)
      .setDepth(100);

    // this.add
    //   .text(
    //     MINIMAP_X - MINIMAP_WIDTH / 2 + 12,
    //     MINIMAP_Y - MINIMAP_HEIGHT / 2 + 8,
    //     "COURSE MAP",
    //     {
    //       color: "#d5d9df",
    //       fontSize: "11px",
    //       fontFamily: "monospace",
    //       fontStyle: "bold",
    //     },
    //   )
    //   .setScrollFactor(0)
    //   .setDepth(102);

    this.minimapCourseGraphics = this.add.graphics();
    this.minimapCourseGraphics.setScrollFactor(0);
    this.minimapCourseGraphics.setDepth(101);

    this.minimapRacerGraphics = this.add.graphics();
    this.minimapRacerGraphics.setScrollFactor(0);
    this.minimapRacerGraphics.setDepth(103);

    const coursePoints = this.checkpoints.map((checkpoint) => {
      const mapped = this.worldToMinimap(checkpoint.x, checkpoint.y);
      return new Phaser.Math.Vector2(mapped.x, mapped.y);
    });

    if (coursePoints.length >= 3) {
      const spline = new Phaser.Curves.Spline(coursePoints);
      const smoothPoints = spline.getSpacedPoints(90);

      this.minimapCourseGraphics.lineStyle(3, 0xc7ccd3, 0.8);
      this.minimapCourseGraphics.strokePoints(smoothPoints, false, false);

      const firstPoint = coursePoints[0];
      const lastPoint = coursePoints[coursePoints.length - 1];

      if (firstPoint && lastPoint) {
        const topConnector = new Phaser.Curves.QuadraticBezier(
          lastPoint,
          new Phaser.Math.Vector2(
            (lastPoint.x + firstPoint.x) / 2,
            Math.min(lastPoint.y, firstPoint.y) - 6,
          ),
          firstPoint,
        );

        this.minimapCourseGraphics.strokePoints(
          topConnector.getSpacedPoints(20),
          false,
          false,
        );
      }
    }

    this.checkpoints.forEach((checkpoint) => {
      const mapped = this.worldToMinimap(checkpoint.x, checkpoint.y);

      this.minimapCourseGraphics.fillStyle(0x8b949e, 1);
      this.minimapCourseGraphics.fillCircle(mapped.x, mapped.y, 3);
    });

    const finishTop = this.worldToMinimap(
      this.finishGateX,
      this.finishGateTopY,
    );
    const finishBottom = this.worldToMinimap(
      this.finishGateX,
      this.finishGateBottomY,
    );

    this.minimapCourseGraphics.fillStyle(0xffffff, 1);
    this.minimapCourseGraphics.fillCircle(finishTop.x, finishTop.y, 4);
    this.minimapCourseGraphics.fillCircle(finishBottom.x, finishBottom.y, 4);

    this.updateMinimapRacers();
  }

  private worldToMinimap(worldX: number, worldY: number) {
    const { width, height } = this.getWorldSize();
    const left = MINIMAP_X - MINIMAP_WIDTH / 2 + MINIMAP_PADDING;
    const top = MINIMAP_Y - MINIMAP_HEIGHT / 2 + MINIMAP_PADDING + 10;
    const drawableWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
    const drawableHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2 - 10;

    return {
      x: left + Phaser.Math.Clamp(worldX / width, 0, 1) * drawableWidth,
      y: top + Phaser.Math.Clamp(worldY / height, 0, 1) * drawableHeight,
    };
  }

  private updateMinimapRacers() {
    if (!this.minimapRacerGraphics || !this.player) {
      return;
    }

    this.minimapRacerGraphics.clear();

    const racers = [this.player, ...this.cpuRacers];

    racers.forEach((racer) => {
      const mapped = this.worldToMinimap(racer.x, racer.y);
      const color = racer.minimapColor ?? 0xffffff;

      this.minimapRacerGraphics.fillStyle(0x000000, 0.8);
      this.minimapRacerGraphics.fillCircle(mapped.x, mapped.y, 5);
      this.minimapRacerGraphics.fillStyle(color, 1);
      this.minimapRacerGraphics.fillCircle(mapped.x, mapped.y, 3.3);
    });
  }

  private createRacerNameTag(name: string, isPlayer: boolean) {
    const tag = this.add.text(0, 0, name.toUpperCase(), {
      color: isPlayer ? "#ffdf2e" : "#ffffff",
      fontSize: "10px",
      fontFamily: "monospace",
      fontStyle: "bold",
      backgroundColor: "rgba(3, 18, 37, 0.78)",
      padding: {
        x: 4,
        y: 2,
      },
      stroke: "#000000",
      strokeThickness: 2,
    });

    tag.setOrigin(0.5, 1);
    tag.setDepth(60);

    return tag;
  }

  private updateRacerNameTags() {
    if (!this.player) {
      return;
    }

    const racers = [this.player, ...this.cpuRacers];

    racers.forEach((racer) => {
      if (!racer.nameTag) {
        return;
      }

      racer.nameTag.setPosition(racer.x, racer.y - 38);
      racer.nameTag.setVisible(racer.visible && racer.active);
    });
  }

  private createNextBuoyArrow() {
    this.nextBuoyArrow = this.add.container(640, 145);

    this.nextBuoyArrow.setScrollFactor(0);
    this.nextBuoyArrow.setDepth(101);

    this.nextBuoyArrowRotor = this.add.container(0, 0);

    const arrow = this.add.polygon(
      0,
      0,
      [34, 0, 4, -24, 4, -9, -34, -9, -34, 9, 4, 9, 4, 24],
      0xffdf2e,
    );

    arrow.setStrokeStyle(5, 0x000000);
    arrow.setOrigin(0.5, 0.5);

    this.nextBuoyArrowRotor.add([arrow]);
    this.nextBuoyArrow.add([this.nextBuoyArrowRotor]);

    this.nextBuoyArrow.setScale(0.95);
  }

  private updateNextBuoyArrow() {
    if (!this.nextBuoyArrow || !this.nextBuoyArrowRotor || !this.player) {
      return;
    }

    const target = this.checkpoints[this.playerCheckpointIndex];

    if (!target) {
      return;
    }

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

    if (up) {
      input.y -= 1;
    }

    if (down) {
      input.y += 1;
    }

    if (left) {
      input.x -= 1;
    }

    if (right) {
      input.x += 1;
    }

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
      if (cpu.finished) {
        this.updateFinishedRacerCoast(cpu);
        return;
      }

      const stats = cpu.stats!;
      const dt = delta / 1000;

      const targetIndex = cpu.targetCheckpointIndex || 0;
      const target = this.checkpoints[targetIndex];

      if (!target) {
        return;
      }

      const body = cpu.body as Phaser.Physics.Arcade.Body;

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

      const difficultyProfile =
        DIFFICULTY_PROFILES[this.raceSettings.difficulty];

      const slowDownNearBuoy =
        distance < 140 ? difficultyProfile.nearBuoySpeedMultiplier : 1;

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
          cpu.lapGateArmed = true;
        }
      }

      this.updateCpuFinishGate(cpu);
    });
  }

  private updateCpuFinishGate(cpu: RacerSprite) {
    const insideGate = this.isRacerInsideFinishGate(cpu.x, cpu.y);

    if (cpu.lapGateArmed && insideGate && !cpu.insideFinishGate) {
      this.completeCpuLap(cpu);
    }

    cpu.insideFinishGate = insideGate;
  }

  private completeCpuLap(cpu: RacerSprite) {
    if (!cpu.lapGateArmed) {
      return;
    }

    cpu.lapGateArmed = false;
    cpu.lap = (cpu.lap || 1) + 1;

    if ((cpu.lap || 1) > this.raceSettings.laps) {
      cpu.finished = true;

      cpu.finishTimeMs = Math.max(
        0,
        Math.floor(this.time.now - this.raceStartTime),
      );
      cpu.finishOrder = this.nextFinishOrder;
      this.nextFinishOrder += 1;

      const body = cpu.body as Phaser.Physics.Arcade.Body;

      this.beginFinishCoast(cpu, body);
    }
  }

  private updateCheckpointLogic() {
    const target = this.checkpoints[this.playerCheckpointIndex];

    if (!target) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
    );

    if (distance >= 70) {
      return;
    }

    this.playerCheckpointIndex += 1;

    if (this.playerCheckpointIndex >= this.checkpoints.length) {
      this.playerCheckpointIndex = 0;
      this.playerLapGateArmed = true;
      this.player.lapGateArmed = true;
    }

    this.checkpointMarkers.forEach((marker, index) => {
      marker.setAlpha(index === this.playerCheckpointIndex ? 1 : 0.55);
    });
  }

  private updatePlayerFinishGate() {
    const insideGate = this.isRacerInsideFinishGate(
      this.player.x,
      this.player.y,
    );

    if (this.playerLapGateArmed && insideGate && !this.playerInsideFinishGate) {
      this.completePlayerLap();
    }

    this.playerInsideFinishGate = insideGate;
    this.player.insideFinishGate = insideGate;
  }

  private isRacerInsideFinishGate(x: number, y: number) {
    const horizontalDistance = Math.abs(x - this.finishGateX);

    const betweenBuoys =
      y >= this.finishGateTopY && y <= this.finishGateBottomY;

    return horizontalDistance <= FINISH_GATE_TRIGGER_HALF_WIDTH && betweenBuoys;
  }

  private completePlayerLap() {
    if (!this.playerLapGateArmed) {
      return;
    }

    this.playerLapGateArmed = false;
    this.player.lapGateArmed = false;
    this.playerLap += 1;

    if (this.playerLap > this.raceSettings.laps) {
      this.finishRace();
    }
  }

  private getRaceStandings(): RaceStanding[] {
    const racers: RaceStanding[] = [
      {
        name: "YOU",
        isPlayer: true,
        lap: this.playerLap,
        checkpointIndex: this.playerCheckpointIndex,

        progress:
          this.playerLap * 1000 +
          this.playerCheckpointIndex +
          (this.playerLapGateArmed ? 0.75 : 0),

        finished: this.raceFinished,
        timeMs: this.playerFinishTimeMs,
        finishOrder: this.player.finishOrder,
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
          timeMs: cpu.finishTimeMs,
          finishOrder: cpu.finishOrder,

          progress: cpu.finished
            ? (this.raceSettings.laps + 1) * 1000
            : lap * 1000 + checkpointIndex + (cpu.lapGateArmed ? 0.75 : 0),
        };
      }),
    ];

    return racers.sort((a, b) => {
      if (a.finished && b.finished) {
        const aOrder =
          typeof a.finishOrder === "number"
            ? a.finishOrder
            : Number.MAX_SAFE_INTEGER;

        const bOrder =
          typeof b.finishOrder === "number"
            ? b.finishOrder
            : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        const aTime =
          typeof a.timeMs === "number" ? a.timeMs : Number.MAX_SAFE_INTEGER;

        const bTime =
          typeof b.timeMs === "number" ? b.timeMs : Number.MAX_SAFE_INTEGER;

        return aTime - bTime;
      }

      if (a.finished) {
        return -1;
      }

      if (b.finished) {
        return 1;
      }

      return b.progress - a.progress;
    });
  }

  private getOrdinal(value: number) {
    if (value === 1) {
      return "1ST";
    }

    if (value === 2) {
      return "2ND";
    }

    if (value === 3) {
      return "3RD";
    }

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
        this.raceSettings.laps,
      )}/${this.raceSettings.laps}`,
    );

    this.penaltyText.setText(`MISSED BUOYS ${this.playerPenalties}`);

    this.positionText.setText(
      `${this.getOrdinal(playerPosition)}\n/ ${standings.length}`,
    );

    const leaderboardLines = standings.slice(0, 5).map((standing, index) => {
      const rank = index + 1;

      const name = standing.isPlayer ? "YOU" : standing.name.toUpperCase();

      const lap = Math.min(standing.lap, this.raceSettings.laps);

      const status = standing.finished ? "FIN" : `L${lap}`;

      return `${rank} ${name.padEnd(12, " ").slice(0, 12)} ${status}`;
    });

    this.leaderboardText.setText(
      ["WEEKLY CHALLENGE", ...leaderboardLines].join("\n"),
    );
  }

  private finishRace() {
    if (this.raceFinished) {
      return;
    }

    const timeMs = Math.max(0, Math.floor(this.time.now - this.raceStartTime));

    this.playerFinishTimeMs = timeMs;
    this.player.finishTimeMs = timeMs;
    this.player.finished = true;
    this.player.finishOrder = this.nextFinishOrder;
    this.nextFinishOrder += 1;

    this.raceFinished = true;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    this.beginFinishCoast(this.player, playerBody);

    if (!this.resultsTransitionStarted) {
      this.resultsTransitionStarted = true;

      this.time.delayedCall(FINISH_COAST_DURATION_MS, () => {
        this.showResultsScene(timeMs);
      });
    }
  }

  private beginFinishCoast(
    racer: RacerSprite,
    body: Phaser.Physics.Arcade.Body,
  ) {
    racer.finishCoasting = true;
    racer.finishCoastStartedAt = this.time.now;

    const direction = body.velocity.clone();

    if (direction.lengthSq() < 0.01) {
      this.physics.velocityFromRotation(
        racer.rotation - Math.PI / 2,
        1,
        direction,
      );
    }

    direction.normalize();
    racer.finishCoastDirection = direction;

    const startingSpeed = Math.max(
      body.velocity.length(),
      FINISH_PASS_THROUGH_MIN_SPEED,
    );

    body.velocity.copy(direction).scale(startingSpeed);
  }

  private updateFinishedRacerCoast(racer: RacerSprite) {
    const body = racer.body as Phaser.Physics.Arcade.Body;

    if (!racer.finishCoasting) {
      return;
    }

    const coastStartedAt = racer.finishCoastStartedAt ?? this.time.now;
    const coastElapsed = this.time.now - coastStartedAt;
    const direction = racer.finishCoastDirection;

    if (coastElapsed < FINISH_PASS_THROUGH_DURATION_MS && direction) {
      const passThroughSpeed = Math.max(
        body.velocity.length(),
        FINISH_PASS_THROUGH_MIN_SPEED,
      );

      body.velocity.copy(direction).scale(passThroughSpeed);
    } else {
      body.velocity.scale(FINISH_COAST_DRAG);
    }

    const speed = body.velocity.length();

    this.updateRacerWake(racer, speed > FINISH_COAST_STOP_SPEED, 0);

    if (speed <= FINISH_COAST_STOP_SPEED) {
      body.setVelocity(0, 0);
      racer.finishCoasting = false;

      if (racer.wakeSprite) {
        racer.wakeSprite.setVisible(false);
      }
    }
  }

  private showResultsScene(timeMs: number) {
    const standings = this.getRaceStandings();

    const playerPosition = Math.max(1, this.player.finishOrder || 1);

    const finishers = standings.map((standing, index) => ({
      position: index + 1,
      name: standing.isPlayer ? "YOU" : standing.name,
      isPlayer: standing.isPlayer,
      finished: standing.isPlayer || Boolean(standing.finished),
      lap: Math.min(standing.lap, this.raceSettings.laps),
      checkpointIndex: standing.checkpointIndex,
      timeMs: standing.isPlayer ? timeMs : standing.timeMs,
    }));

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    playerBody.setVelocity(0, 0);

    if (this.player.wakeSprite) {
      this.player.wakeSprite.setVisible(false);
    }

    this.cpuRacers.forEach((cpu) => {
      const body = cpu.body as Phaser.Physics.Arcade.Body;

      body.setVelocity(0, 0);

      if (cpu.wakeSprite) {
        cpu.wakeSprite.setVisible(false);
      }
    });

    this.raceStarted = false;
    this.isRacePaused = true;
    this.physics.pause();

    this.scene.start("ResultsScene", {
      courseId: this.arcadeData.course.id,

      courseName:
        (this.arcadeData.course as any).name ||
        (this.arcadeData.course as any).title ||
        "Lake Havasu Circuit",

      displayName: "YOU",
      timeMs,
      penalties: this.playerPenalties,
      lapsCompleted: this.raceSettings.laps,
      difficulty: this.raceSettings.difficulty,
      completed: true,
      position: playerPosition,
      totalRacers: standings.length,
      finishers,
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
    if (!isMoving) {
      if (racer.wakeSprite) {
        racer.wakeSprite.setVisible(false);
      }

      return;
    }

    const textureKey = this.getWakeTextureKey(turnAmount);

    if (!textureKey) {
      return;
    }

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
    racer.wakeSprite.setRotation(racer.rotation + Math.PI / 2);
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
