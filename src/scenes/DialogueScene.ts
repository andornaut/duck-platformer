import { animationKey, type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { DIALOGUES, SPEAKERS } from "../data/dialogues";
import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import {
  type DialogueAction,
  dialogueKeyAction,
  dialogueLines,
  type DialogueParagraph,
  dialogueParagraphs,
  type DialoguePress,
  dialogueTapAction,
  moveDialoguePress,
} from "../dialogue/conversation";
import { DIALOGUE_SCREEN, dialogueNameTab, dialogueSkipButton } from "../layout/dialogueScreen";
import type { LabelledButton } from "../layout/restartCard";
import {
  addCardText,
  addSlice,
  addTextButton,
  BODY_FONT,
  captureTab,
  paletteColour,
  pressTextButton,
  ringFocus,
  type TextButton,
  TITLE_FONT,
} from "./cardParts";
import { fitPlayCamera, playPoint } from "./playCamera";

export interface DialogueData {
  readonly scene: string;
}

export interface DialogueOpener {
  dialogueClosed(): void;
}

// A frozen linear conversation over the zone. ZoneScene owns pausing, activation of the dog,
// held-input reset and per-attempt triggers; this scene owns only the conversation and its input.
export class DialogueScene extends Scene {
  private paragraphs: readonly DialogueParagraph[] = [];
  private paragraph = 0;
  private paragraphArt: GameObjects.GameObject[] = [];
  private finished = false;
  private press: DialoguePress | undefined;
  private skipFocused = false;
  private focusRing: GameObjects.NineSlice | undefined;
  private skipLayout!: LabelledButton;
  private skipButton!: TextButton;

  constructor() {
    super("dialogue");
  }

  init({ scene }: DialogueData): void {
    const plan = DIALOGUES[scene];
    if (!plan) {
      throw new Error(`No dialogue ${scene}`);
    }
    this.paragraphs = dialogueParagraphs(SPEAKERS, TEXT, plan);
    this.paragraph = 0;
    this.paragraphArt = [];
    this.finished = false;
    this.press = undefined;
    this.skipFocused = false;
    this.focusRing = undefined;
  }

  create(): void {
    fitPlayCamera(this);
    this.add.image(DIALOGUE_SCREEN.box.x, DIALOGUE_SCREEN.box.y, "ui-dialogue-box").setOrigin(0);
    this.add
      .image(DIALOGUE_SCREEN.portraitFrame.x, DIALOGUE_SCREEN.portraitFrame.y, "ui-portrait-frame")
      .setOrigin(0);
    this.add
      .sprite(DIALOGUE_SCREEN.forward.x, DIALOGUE_SCREEN.forward.y, "ui-forward-mark")
      .setOrigin(0)
      .play(animationKey("ui-forward-mark", "idle"));
    if (!TEXT.dialogue.skip.trim()) {
      throw new Error("Dialogue Skip needs a label");
    }
    this.skipLayout = dialogueSkipButton(
      inkWidth(this.bodyFont(), DIALOGUE_SCREEN.text.scale, TEXT.dialogue.skip),
    );
    this.skipButton = addTextButton(this, this.skipLayout, TEXT.dialogue.skip);
    pressTextButton(this.skipButton, false);
    this.drawParagraph();
    this.watchInput();
    captureTab(this, true);
    this.events.once("shutdown", () => captureTab(this, false));
  }

  private bodyFont() {
    return phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
  }

  private drawParagraph(): void {
    this.paragraphArt.forEach((object) => object.destroy());
    const paragraph = this.paragraphs[this.paragraph];
    if (!paragraph || !this.textures.exists(paragraph.portrait)) {
      throw new Error(`Missing dialogue portrait ${paragraph?.portrait ?? ""}`);
    }
    const layout = DIALOGUE_SCREEN;
    const nameFont = phaserBitmapFont(this.cache.bitmapFont.get(TITLE_FONT).data as PhaserFontData);
    const nameWidth = inkWidth(nameFont, layout.text.scale, paragraph.name);
    const tab = dialogueNameTab(nameWidth);
    if (tab.x + tab.width > layout.box.x + layout.box.width) {
      throw new Error(`Dialogue speaker name does not fit: ${paragraph.name}`);
    }
    const frame = sheetTags(this.cache.json.get("ui-name-tab") as AsepriteSheet).get(
      paragraph.colour,
    )?.[0]?.frame;
    if (frame === undefined) {
      throw new Error(`Missing dialogue name-tab colour ${paragraph.colour}`);
    }
    this.paragraphArt = [
      this.add.image(layout.portrait.x, layout.portrait.y, paragraph.portrait).setOrigin(0),
      addSlice(this, "ui-name-tab", tab, frame),
      addCardText(this, TITLE_FONT, layout.name, paragraph.name, paletteColour(this, "ink")),
      ...dialogueLines(this.bodyFont(), layout.text, layout.text.width, paragraph.text).map(
        (line, index) =>
          addCardText(
            this,
            BODY_FONT,
            { x: layout.text.x, y: layout.text.y + index * layout.text.pitch },
            line,
            paletteColour(this, "cream"),
          ),
      ),
    ];
  }

  private act(action: DialogueAction | undefined): void {
    if (this.finished || action === undefined) {
      return;
    }
    if (action === "focusSkip") {
      this.skipFocused = true;
      this.focusRing = ringFocus(this, this.focusRing, this.skipLayout.button);
    } else if (action === "skip" || this.paragraph + 1 === this.paragraphs.length) {
      this.finished = true;
      this.scene.stop();
      (this.scene.get("zone") as unknown as DialogueOpener).dialogueClosed();
    } else {
      this.paragraph += 1;
      this.drawParagraph();
    }
  }

  private watchInput(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      event.stopPropagation();
      this.act(dialogueKeyAction(this.skipFocused, event));
    });
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => event.stopPropagation());
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      if (this.press !== undefined || this.finished) {
        return;
      }
      const at = playPoint(this, pointer);
      this.press = {
        at,
        cancelled: false,
        id: pointer.id,
        skip: containsPoint(this.skipLayout.hit, at.x, at.y),
      };
      pressTextButton(this.skipButton, this.press.skip);
    });
    this.input.on("pointermove", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      if (this.press?.id === pointer.id) {
        this.press = moveDialoguePress(TOUCH.tapMaxDistance, playPoint(this, pointer), this.press);
        pressTextButton(this.skipButton, this.press.skip && !this.press.cancelled);
      }
    });
    const up = (pointer: Input.Pointer, outside: boolean) => {
      this.input.stopPropagation();
      const action = outside
        ? undefined
        : dialogueTapAction(this.skipLayout.hit, TOUCH.tapMaxDistance, this.press, {
            ...playPoint(this, pointer),
            id: pointer.id,
            wasCanceled: pointer.wasCanceled,
          });
      if (this.press?.id === pointer.id) {
        this.press = undefined;
        pressTextButton(this.skipButton, false);
      }
      this.act(action);
    };
    this.input.on("pointerup", (pointer: Input.Pointer) => up(pointer, false));
    this.input.on("pointerupoutside", (pointer: Input.Pointer) => up(pointer, true));
  }
}
