import Phaser from "phaser";
import RaceSetupScene from "../jetSki/scenes/RaceSetupScene";
import RaceScene from "../jetSki/scenes/RaceScene";
import ResultsScene from "../jetSki/scenes/ResultsScene";
import type { ArcadeGameData } from "./types";

type CreateConfigInput = ArcadeGameData & {
  parent: HTMLElement;
};

export function createArcadeConfig(
  input: CreateConfigInput,
): Phaser.Types.Core.GameConfig {
  const arcadeData: ArcadeGameData = {
    course: input.course,
    cpuRacers: input.cpuRacers,
    onExit: input.onExit,
  };

  return {
    type: Phaser.AUTO,
    parent: input.parent,

    width: 1280,
    height: 720,

    backgroundColor: "#0794dc",

    physics: {
      default: "arcade",

      arcade: {
        debug: false,
      },
    },

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    scene: [],

    callbacks: {
      postBoot: (game) => {
        game.registry.set("arcadeData", arcadeData);

        game.registry.set("raceSettings", {
          laps: 3,
          difficulty: "pro",
        });

        game.scene.add("RaceSetupScene", RaceSetupScene, false);

        game.scene.add("RaceScene", RaceScene, false);

        game.scene.add("ResultsScene", ResultsScene, false);

        game.scene.start("RaceSetupScene", arcadeData);
      },
    },
  };
}
