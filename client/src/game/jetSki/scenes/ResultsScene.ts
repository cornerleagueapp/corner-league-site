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

const WIDTH = 1280;
const HEIGHT = 720;

export default class ResultsScene extends Phaser.Scene {
  private resultData: ResultsSceneData = {};

  constructor() {
    super("ResultsScene");
  }

  preload() {
    this.load.image(
      "race_results_background_v2",
      "/arcade/jetSki/results/results-screen.png",
    );
  }

  create(data?: ResultsSceneData) {
    this.resultData = data || {};

    this.cameras.main.setBackgroundColor("#035ca1");

    if (this.textures.exists("race_results_background_v2")) {
      this.add
        .image(WIDTH / 2, HEIGHT / 2, "race_results_background_v2")
        .setDisplaySize(WIDTH, HEIGHT)
        .setDepth(0);
    } else {
      this.add
        .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x035ca1)
        .setDepth(0);
    }

    this.createLeaderboardRows();
    this.createPlayerSummary();
    this.createButtons();

    this.cameras.main.fadeIn(250, 0, 0, 0);
  }

  private createLeaderboardRows() {
    const finishers = this.getFinishers().slice(0, 5);

    const rowY = [267, 333, 399, 465, 531];

    finishers.forEach((finisher, index) => {
      const y = rowY[index];

      const rank = finisher.position || index + 1;

      const rankColor =
        rank === 1
          ? "#ffdf2e"
          : rank === 2
            ? "#e5edf5"
            : rank === 3
              ? "#ff9d38"
              : "#ffffff";

      this.add
        .text(85, y, this.getOrdinal(rank), {
          color: rankColor,
          fontFamily: "monospace",
          fontSize: "28px",
          fontStyle: "bold",
          stroke: "#020817",
          strokeThickness: 5,
        })
        .setOrigin(0, 0.5)
        .setDepth(10);

      this.add
        .text(220, y, this.trimName(finisher.name, 16), {
          color: finisher.isPlayer ? "#ffdf2e" : "#ffffff",

          fontFamily: "monospace",
          fontSize: "22px",
          fontStyle: "bold",
          stroke: "#020817",
          strokeThickness: 4,
        })
        .setOrigin(0, 0.5)
        .setDepth(10);

      const timeText =
        typeof finisher.timeMs === "number"
          ? this.formatTime(finisher.timeMs)
          : finisher.finished
            ? "FINISHED"
            : "RACING";

      this.add
        .text(610, y, timeText, {
          color: finisher.finished ? "#ffffff" : "#7dd3fc",

          fontFamily: "monospace",
          fontSize: "20px",
          fontStyle: "bold",
          stroke: "#020817",
          strokeThickness: 4,
        })
        .setOrigin(1, 0.5)
        .setDepth(10);
    });
  }

  private createPlayerSummary() {
    const playerPosition = Math.max(1, Number(this.resultData.position || 1));

    this.add
      .text(170, 635, "YOUR RESULT", {
        color: "#ffdf2e",
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(170, 672, this.getOrdinal(playerPosition), {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "34px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(445, 635, "FINAL TIME", {
        color: "#ffdf2e",
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(445, 672, this.formatTime(this.resultData.timeMs || 0), {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(735, 635, "MISSED BUOYS", {
        color: "#ffdf2e",
        fontFamily: "monospace",
        fontSize: "15px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(735, 672, String(this.resultData.penalties || 0), {
        color:
          Number(this.resultData.penalties || 0) > 0 ? "#ff6b6b" : "#ffffff",

        fontFamily: "monospace",
        fontSize: "30px",
        fontStyle: "bold",
        stroke: "#020817",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    const difficulty = (this.resultData.difficulty || "pro").toUpperCase();

    const laps = this.resultData.lapsCompleted || 0;

    this.add
      .text(
        1015,
        570,
        `${difficulty} • ${laps} ${laps === 1 ? "LAP" : "LAPS"}`,
        {
          color: "#8bdcf5",
          fontFamily: "monospace",
          fontSize: "14px",
          fontStyle: "bold",
          stroke: "#020817",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createButtons() {
    this.createButton({
      x: 930,
      y: 624,
      width: 195,
      label: "RACE AGAIN",
      fillColor: 0x087fd1,

      onClick: () => {
        this.cameras.main.fadeOut(160, 0, 0, 0);

        this.time.delayedCall(160, () => {
          this.scene.start("RaceSetupScene");
        });
      },
    });

    this.createButton({
      x: 1125,
      y: 624,
      width: 165,
      label: "MAIN MENU",
      fillColor: 0x21913b,

      onClick: () => {
        this.game.events.emit("arcade:main-menu");
      },
    });

    this.createButton({
      x: 1027,
      y: 682,
      width: 360,
      label: "VIEW LEADERBOARD",
      fillColor: 0x6d28d9,

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

  private createButton(config: {
    x: number;
    y: number;
    width: number;
    label: string;
    fillColor: number;
    onClick: () => void;
  }) {
    const { x, y, width, label, fillColor, onClick } = config;

    const shadow = this.add
      .rectangle(x, y + 6, width, 42, 0x000000, 0.82)
      .setDepth(20);

    const button = this.add
      .rectangle(x, y, width, 42, fillColor, 1)
      .setStrokeStyle(4, 0x07111f, 1)
      .setInteractive({
        useHandCursor: true,
      })
      .setDepth(21);

    const text = this.add
      .text(x, y, label, {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "14px",
        fontStyle: "bold",
        stroke: "#07111f",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(22);

    button.on("pointerover", () => {
      button.setScale(1.03);
      text.setScale(1.03);
      shadow.setScale(1.03);
    });

    button.on("pointerout", () => {
      button.setScale(1);
      text.setScale(1);
      shadow.setScale(1);
    });

    button.on("pointerdown", () => {
      button.setY(y + 3);
      text.setY(y + 3);
    });

    button.on("pointerup", () => {
      button.setY(y);
      text.setY(y);
      onClick();
    });
  }

  private getFinishers() {
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
