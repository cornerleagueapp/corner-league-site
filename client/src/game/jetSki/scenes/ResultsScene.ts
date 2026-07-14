import Phaser from "phaser";
import type { RaceDifficulty } from "../systems/PhysicsTuning";

type ResultFinisher = {
  position: number;
  name: string;
  isPlayer?: boolean;
  finished?: boolean;
  lap?: number;
  checkpointIndex?: number;
  timeMs?: number;
};

type ResultsSceneData = {
  courseId?: string;
  courseName?: string;
  displayName?: string;
  timeMs?: number;
  penalties?: number;
  lapsCompleted?: number;
  difficulty?: RaceDifficulty;
  completed?: boolean;
  position?: number;
  totalRacers?: number;
  finishers?: ResultFinisher[];
};

type PixelButtonConfig = {
  x: number;
  y: number;
  width: number;
  height?: number;
  label: string;
  fillColor: number;
  hoverColor: number;
  textColor?: string;
  onClick: () => void;
};

const WIDTH = 1280;
const HEIGHT = 720;

const RESULTS_BACKGROUND_KEY = "race_results_background";
const RESULTS_BACKGROUND_PATH = "/arcade/jetSki/screens/results-screen.png";

export default class ResultsScene extends Phaser.Scene {
  private resultData: ResultsSceneData = {};

  constructor() {
    super("ResultsScene");
  }

  preload() {
    this.load.image(RESULTS_BACKGROUND_KEY, RESULTS_BACKGROUND_PATH);

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error("Failed to load ResultsScene asset:", {
        key: file.key,
        src: file.src,
      });
    });
  }

  create(data?: ResultsSceneData) {
    this.resultData = data || {};

    this.cameras.main.setBackgroundColor("#035ca1");

    this.createBackground();
    this.createHeader();
    this.createLeaderboardPanel();
    this.createBottomStatsPanel();
    this.createRaceInfoBadge();
    this.createButtons();

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private createBackground() {
    if (this.textures.exists(RESULTS_BACKGROUND_KEY)) {
      this.add
        .image(WIDTH / 2, HEIGHT / 2, RESULTS_BACKGROUND_KEY)
        .setDisplaySize(WIDTH, HEIGHT)
        .setOrigin(0.5)
        .setDepth(0);

      return;
    }

    this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0477bd)
      .setDepth(0);
  }

  private createHeader() {
    this.add
      .text(WIDTH / 2, 62, "RACE RESULTS", {
        color: "#ffd51e",
        fontFamily: "monospace",
        fontSize: "58px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 12,
        shadow: {
          offsetX: 0,
          offsetY: 7,
          color: "#000000",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(20);

    const courseName = String(
      this.resultData.courseName || "Lake Havasu Circuit",
    ).toUpperCase();

    const bannerWidth = Math.max(
      430,
      Math.min(720, 230 + courseName.length * 18),
    );

    this.add
      .rectangle(WIDTH / 2, 126, bannerWidth, 48, 0x061529, 0.96)
      .setStrokeStyle(5, 0x020817, 1)
      .setDepth(18);

    this.add
      .rectangle(WIDTH / 2, 130, bannerWidth - 12, 38, 0x0a2741, 0.96)
      .setStrokeStyle(2, 0x2383bd, 1)
      .setDepth(19);

    this.add
      .text(WIDTH / 2, 126, `★  ${courseName}  ★`, {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "19px",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  private createLeaderboardPanel() {
    const panelX = 260;
    const panelY = 383;
    const panelWidth = 470;
    const panelHeight = 410;

    this.createRetroPanel({
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      outerColor: 0x020817,
      innerColor: 0x061529,
      borderColor: 0x2383bd,
    });

    this.add
      .text(panelX, 205, "RACE STANDINGS", {
        color: "#ffd51e",
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(30);

    const finishers = this.getFinishers().slice(0, 5);

    const rowStartY = 258;
    const rowGap = 66;

    finishers.forEach((finisher, index) => {
      this.createLeaderboardRow(finisher, index, rowStartY + index * rowGap);
    });
  }

  private createLeaderboardRow(
    finisher: ResultFinisher,
    index: number,
    y: number,
  ) {
    const rank = finisher.position || index + 1;

    const isPlayer = Boolean(finisher.isPlayer);

    const rowX = 260;
    const rowWidth = 420;
    const rowHeight = 53;

    const rowFill = isPlayer ? 0x173b45 : index % 2 === 0 ? 0x071c31 : 0x061529;

    const rowBorder = isPlayer ? 0xffd51e : 0x174d70;

    this.add
      .rectangle(rowX, y, rowWidth, rowHeight, 0x000000, 0.58)
      .setPosition(rowX, y + 5)
      .setDepth(31);

    this.add
      .rectangle(rowX, y, rowWidth, rowHeight, rowFill, 0.97)
      .setStrokeStyle(isPlayer ? 4 : 3, rowBorder, 1)
      .setDepth(32);

    const rankColor =
      rank === 1
        ? "#ffd51e"
        : rank === 2
          ? "#e5edf5"
          : rank === 3
            ? "#ff9638"
            : "#ffffff";

    this.add
      .text(82, y, this.getOrdinal(rank), {
        color: rankColor,
        fontFamily: "monospace",
        fontSize: "24px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 5,
      })
      .setOrigin(0, 0.5)
      .setDepth(34);

    this.add.rectangle(165, y, 3, 32, 0x5ebbe9, 0.45).setDepth(34);

    this.add
      .text(188, y, this.trimName(finisher.name, 14), {
        color: isPlayer ? "#ffd51e" : "#ffffff",
        fontFamily: "monospace",
        fontSize: "19px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setDepth(34);

    const timeText =
      typeof finisher.timeMs === "number"
        ? this.formatTime(finisher.timeMs)
        : finisher.finished
          ? "FINISHED"
          : "RACING";

    this.add
      .text(458, y, timeText, {
        color: typeof finisher.timeMs === "number" ? "#ffffff" : "#7dd3fc",
        fontFamily: "monospace",
        fontSize: "16px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5)
      .setDepth(34);
  }

  private createBottomStatsPanel() {
    const panelX = 378;
    const panelY = 640;
    const panelWidth = 700;
    const panelHeight = 128;

    this.createRetroPanel({
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      outerColor: 0x020817,
      innerColor: 0x061529,
      borderColor: 0x4b6b80,
    });

    this.add.rectangle(254, panelY, 3, 95, 0x5d7890, 0.7).setDepth(32);

    this.add.rectangle(498, panelY, 3, 95, 0x5d7890, 0.7).setDepth(32);

    const playerPosition = Math.max(1, Number(this.resultData.position || 1));

    this.createStatBlock({
      x: 138,
      label: "YOUR RESULT",
      value: this.getOrdinal(playerPosition),
      valueColor: "#ffd51e",
      valueFontSize: 42,
    });

    this.createStatBlock({
      x: 376,
      label: "FINAL TIME",
      value: this.formatTime(this.resultData.timeMs || 0),
      valueColor: "#ffffff",
      valueFontSize: 31,
    });

    this.createStatBlock({
      x: 612,
      label: "MISSED BUOYS",
      value: String(this.resultData.penalties || 0),
      valueColor:
        Number(this.resultData.penalties || 0) > 0 ? "#ff6b6b" : "#7dff47",
      valueFontSize: 42,
    });
  }

  private createStatBlock(config: {
    x: number;
    label: string;
    value: string;
    valueColor: string;
    valueFontSize: number;
  }) {
    this.add
      .text(config.x, 605, config.label, {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(34);

    this.add
      .text(config.x, 657, config.value, {
        color: config.valueColor,
        fontFamily: "monospace",
        fontSize: `${config.valueFontSize}px`,
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: "#000000",
          blur: 0,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(34);
  }

  private createRaceInfoBadge() {
    const difficulty = (this.resultData.difficulty || "pro").toUpperCase();

    const laps = Math.max(0, Number(this.resultData.lapsCompleted || 0));

    this.add
      .rectangle(993, 548, 260, 44, 0x020817, 0.9)
      .setStrokeStyle(4, 0x5d7890, 1)
      .setDepth(28);

    this.add
      .text(
        993,
        548,
        `${difficulty}  •  ${laps} ${laps === 1 ? "LAP" : "LAPS"}`,
        {
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "17px",
          fontStyle: "bold",
          stroke: "#020817",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(29);
  }

  private createButtons() {
    this.createPixelButton({
      x: 880,
      y: 614,
      width: 215,
      height: 58,
      label: "RACE AGAIN",
      fillColor: 0x0d73c7,
      hoverColor: 0x1593ed,
      onClick: () => {
        this.cameras.main.fadeOut(160, 0, 0, 0);

        this.time.delayedCall(160, () => {
          this.scene.start("RaceSetupScene");
        });
      },
    });

    this.createPixelButton({
      x: 1110,
      y: 614,
      width: 215,
      height: 58,
      label: "MAIN MENU",
      fillColor: 0x188934,
      hoverColor: 0x25b747,
      onClick: () => {
        this.game.events.emit("arcade:main-menu");
      },
    });

    this.createPixelButton({
      x: 995,
      y: 684,
      width: 445,
      height: 54,
      label: "VIEW LEADERBOARD",
      fillColor: 0x6c29ce,
      hoverColor: 0x8c3ef0,
      onClick: () => {
        if (this.scene.manager.keys.LeaderboardScene) {
          this.scene.start("LeaderboardScene", {
            courseId: this.resultData.courseId,
          });

          return;
        }

        this.game.events.emit("arcade:open-leaderboard", {
          courseId: this.resultData.courseId,
        });
      },
    });
  }

  private createRetroPanel(config: {
    x: number;
    y: number;
    width: number;
    height: number;
    outerColor: number;
    innerColor: number;
    borderColor: number;
  }) {
    this.add
      .rectangle(
        config.x,
        config.y + 8,
        config.width,
        config.height,
        0x000000,
        0.72,
      )
      .setDepth(27);

    this.add
      .rectangle(
        config.x,
        config.y,
        config.width,
        config.height,
        config.outerColor,
        0.98,
      )
      .setStrokeStyle(6, 0x000000, 1)
      .setDepth(28);

    this.add
      .rectangle(
        config.x,
        config.y,
        config.width - 14,
        config.height - 14,
        config.innerColor,
        0.96,
      )
      .setStrokeStyle(4, config.borderColor, 1)
      .setDepth(29);
  }

  private createPixelButton(config: PixelButtonConfig) {
    const height = config.height || 54;

    const shadow = this.add
      .rectangle(config.x, config.y + 8, config.width, height, 0x000000, 0.82)
      .setDepth(39);

    const outer = this.add
      .rectangle(config.x, config.y, config.width, height, 0x020817, 1)
      .setDepth(40);

    const button = this.add
      .rectangle(
        config.x,
        config.y - 2,
        config.width - 10,
        height - 10,
        config.fillColor,
        1,
      )
      .setStrokeStyle(3, 0xffffff, 0.28)
      .setInteractive({
        useHandCursor: true,
      })
      .setDepth(41);

    const highlight = this.add
      .rectangle(
        config.x,
        config.y - height / 2 + 8,
        config.width - 18,
        4,
        0xffffff,
        0.25,
      )
      .setDepth(42);

    const text = this.add
      .text(config.x, config.y, config.label, {
        color: config.textColor || "#ffffff",
        fontFamily: "monospace",
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(43);

    button.on("pointerover", () => {
      button.setFillStyle(config.hoverColor, 1);

      outer.setScale(1.02);
      button.setScale(1.02);
      text.setScale(1.02);
      shadow.setScale(1.02);
      highlight.setScale(1.02);
    });

    button.on("pointerout", () => {
      button.setFillStyle(config.fillColor, 1);

      outer.setScale(1);
      button.setScale(1);
      text.setScale(1);
      shadow.setScale(1);
      highlight.setScale(1);
    });

    button.on("pointerdown", () => {
      outer.setY(config.y + 3);

      button.setY(config.y + 1);

      text.setY(config.y + 3);

      highlight.setY(config.y - height / 2 + 11);
    });

    button.on("pointerup", () => {
      outer.setY(config.y);

      button.setY(config.y - 2);

      text.setY(config.y);

      highlight.setY(config.y - height / 2 + 8);

      config.onClick();
    });

    button.on("pointerupoutside", () => {
      outer.setY(config.y);

      button.setY(config.y - 2);

      text.setY(config.y);

      highlight.setY(config.y - height / 2 + 8);
    });
  }

  private getFinishers(): ResultFinisher[] {
    const finishers = Array.isArray(this.resultData.finishers)
      ? [...this.resultData.finishers]
      : [];

    if (!finishers.length) {
      finishers.push({
        position: this.resultData.position || 1,
        name: this.resultData.displayName || "YOU",
        isPlayer: true,
        finished: true,
        timeMs: this.resultData.timeMs,
      });
    }

    return finishers.sort((a, b) => a.position - b.position);
  }

  private trimName(value: string, maxLength: number) {
    const normalized = String(value || "ARCADE RACER").toUpperCase();

    return normalized.length > maxLength
      ? `${normalized.slice(0, maxLength - 1)}…`
      : normalized;
  }

  private getOrdinal(value: number) {
    const mod100 = value % 100;

    if (mod100 >= 11 && mod100 <= 13) {
      return `${value}TH`;
    }

    if (value % 10 === 1) {
      return `${value}ST`;
    }

    if (value % 10 === 2) {
      return `${value}ND`;
    }

    if (value % 10 === 3) {
      return `${value}RD`;
    }

    return `${value}TH`;
  }

  private formatTime(ms: number) {
    const value = Math.max(0, Number(ms || 0));

    const totalSeconds = value / 1000;

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = Math.floor(totalSeconds % 60);

    const hundredths = Math.floor((totalSeconds % 1) * 100);

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}.${String(hundredths).padStart(2, "0")}`;
  }
}
