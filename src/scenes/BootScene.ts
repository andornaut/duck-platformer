import { Scene } from "phaser";

// First scene to run. PLACEHOLDER: loads the art once it exists. Starts the test floor.
export class BootScene extends Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.scene.start("floor");
  }
}
