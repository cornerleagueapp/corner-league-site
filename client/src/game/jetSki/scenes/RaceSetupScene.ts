import Phaser from "phaser";
import type { ArcadeGameData } from "../../core/types";
import type { RaceDifficulty } from "../systems/PhysicsTuning";

type RaceSettings = {
  laps: number;
  difficulty: RaceDifficulty;
};

const WIDTH = 1280;
const HEIGHT = 720;

export default class RaceSetupScene extends Phaser.Scene {
  private arcadeData!: ArcadeGameData;

  private selectedLaps = 3;
  private selectedDifficulty: RaceDifficulty = "pro";

  private lapButtons: Array<{
    value: number;
    background: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  }> = [];

  private difficultyButtons: Array<{
    value: RaceDifficulty;
    background: Phaser.GameObjects.Rectangle;
    title: Phaser.GameObjects.Text;
    description: Phaser.GameObjects.Text;
  }> = [];

  constructor() {
    super("RaceSetupScene");
  }

  create(initData?: ArcadeGameData) {
    const registryData = this.game.registry.get("arcadeData") as
      | ArcadeGameData
      | undefined;

    this.arcadeData = initData || registryData!;

    const previousSettings = this.game.registry.get("raceSettings") as
      | Partial<RaceSettings>
      | undefined;

    this.selectedLaps = Phaser.Math.Clamp(
      Number(previousSettings?.laps || 3),
      1,
      10,
    );

    this.selectedDifficulty =
      previousSettings?.difficulty === "junior" ||
      previousSettings?.difficulty === "amateur" ||
      previousSettings?.difficulty === "pro"
        ? previousSettings.difficulty
        : "pro";

    this.lapButtons = [];
    this.difficultyButtons = [];

    this.createBackground();
    this.createModal();
    this.refreshSelectionStyles();

    this.cameras.main.fadeIn(220, 0, 0, 0);
  }

  private createBackground() {
    this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x063c63)
      .setDepth(0);

    this.add
      .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x020817, 0.72)
      .setDepth(1);

    const graphics = this.add.graphics();

    graphics.setDepth(2);

    for (let i = 0; i < 110; i += 1) {
      const x = Phaser.Math.Between(0, WIDTH);
      const y = Phaser.Math.Between(0, HEIGHT);
      const width = Phaser.Math.Between(18, 70);

      graphics.fillStyle(0x38bdf8, Phaser.Math.FloatBetween(0.04, 0.12));

      graphics.fillRect(x, y, width, 2);
    }
  }

  private createModal() {
    const panelX = WIDTH / 2;
    const panelY = HEIGHT / 2;
    const panelWidth = 900;
    const panelHeight = 610;

    this.add
      .rectangle(panelX, panelY + 10, panelWidth, panelHeight, 0x000000, 0.68)
      .setDepth(9);

    this.add
      .rectangle(panelX, panelY, panelWidth, panelHeight, 0x061529, 0.98)
      .setStrokeStyle(6, 0x0e3b61, 1)
      .setDepth(10);

    this.add
      .text(panelX, 105, "RACE SETUP", {
        color: "#ffdf2e",
        fontFamily: "monospace",
        fontSize: "48px",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(panelX, 155, "CHOOSE YOUR RACE SETTINGS", {
        color: "#8bdcf5",
        fontFamily: "monospace",
        fontSize: "16px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)
      .setDepth(20);

    this.createLapSection();
    this.createDifficultySection();
    this.createActionButtons();
  }

  private createLapSection() {
    this.add
      .text(260, 220, "NUMBER OF LAPS", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setDepth(20);

    this.add
      .text(260, 250, "Longer races give you more time to recover.", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "13px",
      })
      .setAlpha(0.52)
      .setDepth(20);

    const options = [1, 3, 5, 10];
    const startX = 322;
    const gap = 158;

    options.forEach((laps, index) => {
      const x = startX + index * gap;

      const background = this.add
        .rectangle(x, 305, 132, 66, 0x0a2741, 1)
        .setStrokeStyle(4, 0x174669, 1)
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(20);

      const text = this.add
        .text(x, 305, `${laps} ${laps === 1 ? "LAP" : "LAPS"}`, {
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "20px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(21);

      background.on("pointerover", () => {
        if (laps !== this.selectedLaps) {
          background.setFillStyle(0x103656, 1);
        }
      });

      background.on("pointerout", () => {
        this.refreshSelectionStyles();
      });

      background.on("pointerdown", () => {
        this.selectedLaps = laps;
        this.refreshSelectionStyles();
      });

      this.lapButtons.push({
        value: laps,
        background,
        text,
      });
    });
  }

  private createDifficultySection() {
    this.add
      .text(260, 365, "DIFFICULTY", {
        color: "#ffffff",
        fontFamily: "monospace",
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setDepth(20);

    const options: Array<{
      value: RaceDifficulty;
      title: string;
      description: string;
    }> = [
      {
        value: "junior",
        title: "JUNIOR",
        description: "Slower racers\nMore mistakes",
      },
      {
        value: "amateur",
        title: "AMATEUR",
        description: "Balanced speed\nModerate challenge",
      },
      {
        value: "pro",
        title: "PRO",
        description: "Fastest racers\nCurrent difficulty",
      },
    ];

    const startX = 365;
    const gap = 275;

    options.forEach((option, index) => {
      const x = startX + index * gap;

      const background = this.add
        .rectangle(x, 460, 235, 128, 0x0a2741, 1)
        .setStrokeStyle(4, 0x174669, 1)
        .setInteractive({
          useHandCursor: true,
        })
        .setDepth(20);

      const title = this.add
        .text(x, 430, option.title, {
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "22px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(21);

      const description = this.add
        .text(x, 477, option.description, {
          color: "#ffffff",
          fontFamily: "monospace",
          fontSize: "13px",
          align: "center",
          lineSpacing: 5,
        })
        .setOrigin(0.5)
        .setAlpha(0.55)
        .setDepth(21);

      background.on("pointerover", () => {
        if (option.value !== this.selectedDifficulty) {
          background.setFillStyle(0x103656, 1);
        }
      });

      background.on("pointerout", () => {
        this.refreshSelectionStyles();
      });

      background.on("pointerdown", () => {
        this.selectedDifficulty = option.value;
        this.refreshSelectionStyles();
      });

      this.difficultyButtons.push({
        value: option.value,
        background,
        title,
        description,
      });
    });
  }

  private createActionButtons() {
    this.createPixelButton({
      x: 500,
      y: 615,
      width: 270,
      label: "START RACE",
      fillColor: 0xffd51e,
      textColor: "#07111f",
      onClick: () => {
        this.startRace();
      },
    });

    this.createPixelButton({
      x: 790,
      y: 615,
      width: 230,
      label: "CANCEL",
      fillColor: 0x174669,
      textColor: "#ffffff",
      onClick: () => {
        this.game.events.emit("arcade:main-menu");
      },
    });
  }

  private refreshSelectionStyles() {
    this.lapButtons.forEach((button) => {
      const selected = button.value === this.selectedLaps;

      button.background.setFillStyle(selected ? 0xffd51e : 0x0a2741, 1);

      button.background.setStrokeStyle(4, selected ? 0x000000 : 0x174669, 1);

      button.text.setColor(selected ? "#07111f" : "#ffffff");
    });

    this.difficultyButtons.forEach((button) => {
      const selected = button.value === this.selectedDifficulty;

      button.background.setFillStyle(selected ? 0x0c6ca8 : 0x0a2741, 1);

      button.background.setStrokeStyle(
        selected ? 5 : 4,
        selected ? 0xffd51e : 0x174669,
        1,
      );

      button.title.setColor(selected ? "#ffdf2e" : "#ffffff");

      button.description.setAlpha(selected ? 0.9 : 0.55);
    });
  }

  private startRace() {
    const settings: RaceSettings = {
      laps: this.selectedLaps,
      difficulty: this.selectedDifficulty,
    };

    this.game.registry.set("raceSettings", settings);

    this.cameras.main.fadeOut(180, 0, 0, 0);

    this.time.delayedCall(180, () => {
      this.scene.start("RaceScene", this.arcadeData);
    });
  }

  private createPixelButton(config: {
    x: number;
    y: number;
    width: number;
    label: string;
    fillColor: number;
    textColor: string;
    onClick: () => void;
  }) {
    const { x, y, width, label, fillColor, textColor, onClick } = config;

    const shadow = this.add
      .rectangle(x, y + 7, width, 58, 0x000000, 0.8)
      .setDepth(29);

    const button = this.add
      .rectangle(x, y, width, 58, fillColor, 1)
      .setStrokeStyle(5, 0x000000, 1)
      .setInteractive({
        useHandCursor: true,
      })
      .setDepth(30);

    const text = this.add
      .text(x, y, label, {
        color: textColor,
        fontFamily: "monospace",
        fontSize: "19px",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: textColor === "#ffffff" ? 3 : 0,
      })
      .setOrigin(0.5)
      .setDepth(31);

    button.on("pointerover", () => {
      button.setScale(1.025);
      text.setScale(1.025);
      shadow.setScale(1.025);
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

    button.on("pointerupoutside", () => {
      button.setY(y);
      text.setY(y);
    });
  }
}
