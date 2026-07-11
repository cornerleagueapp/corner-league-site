import Phaser from "phaser";
import { saveArcadeRun } from "@/services/arcadeService";
import type { RaceResult } from "../../core/types";

export default class ResultsScene extends Phaser.Scene {
  constructor() {
    super("ResultsScene");
  }

  create(result: RaceResult) {
    const arcadeData = this.game.registry.get("arcadeData");

    this.add.rectangle(0, 0, 1280, 720, 0x06152d).setOrigin(0);

    this.add
      .text(640, 80, "RACE RESULTS", {
        color: "#ffdf2e",
        fontSize: "72px",
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(640, 190, `TIME ${this.formatTime(result.timeMs)}`, {
        color: "#ffffff",
        fontSize: "48px",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(640, 260, `PENALTIES ${result.penalties}`, {
        color: "#ff6969",
        fontSize: "34px",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(640, 330, `LAPS ${result.lapsCompleted}`, {
        color: "#67e8f9",
        fontSize: "34px",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const raceAgain = this.add
      .text(430, 500, "RACE AGAIN", {
        color: "#000000",
        fontSize: "32px",
        fontFamily: "monospace",
        fontStyle: "bold",
        backgroundColor: "#ffdf2e",
        padding: {
          x: 24,
          y: 16,
        },
      })
      .setOrigin(0.5)
      .setInteractive();

    const exit = this.add
      .text(830, 500, "MAIN MENU", {
        color: "#ffffff",
        fontSize: "32px",
        fontFamily: "monospace",
        fontStyle: "bold",
        backgroundColor: "#0b4ea2",
        padding: {
          x: 24,
          y: 16,
        },
      })
      .setOrigin(0.5)
      .setInteractive();

    raceAgain.on("pointerdown", () => {
      this.scene.start("RaceScene");
    });

    exit.on("pointerdown", () => {
      arcadeData.onExit();
    });

    saveArcadeRun({
      courseId: result.courseId,
      displayName: result.displayName,
      timeMs: result.timeMs,
      penalties: result.penalties,
      lapsCompleted: result.lapsCompleted,
      completed: true,
      runStats: {
        source: "corner-league-arcade-v1",
      },
    }).catch((err) => {
      console.error("Failed to save arcade run", err);
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
