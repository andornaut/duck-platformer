# Art inventory

Every served art asset. Sizes are in base pixels at 640x360. Tags are in frame order. A nine-slice lists its margins as left, top, right, bottom.

## Data

| Key     | Type                        | Size       | Tags |
| ------- | --------------------------- | ---------- | ---- |
| palette | JSON: colours, darker, dim2 | 32 colours |      |

## Fonts

| Key        | Type               | Size         | Tags |
| ---------- | ------------------ | ------------ | ---- |
| font-body  | BMFont, Tiny5      | 8px, line 10 |      |
| font-title | BMFont, Silkscreen | 8px, line 12 |      |

## Sprites

| Key               | Type                  | Size   | Tags                                                 |
| ----------------- | --------------------- | ------ | ---------------------------------------------------- |
| duck              | character             | 64x48  | idle, walk, jump, flutter, land                      |
| ferret            | character             | 64x80  | idle, scheme, talk                                   |
| portrait-duck     | portrait              | 64x64  | neutral, happy, worried                              |
| portrait-ferret   | portrait              | 64x64  | neutral, smug, annoyed                               |
| ui-answer         | sprite                | 204x36 | normal, selected, pressed                            |
| ui-checkbox       | sprite                | 20x20  | off, on                                              |
| ui-close          | sprite                | 24x24  | normal, pressed                                      |
| ui-dialogue-box   | sprite                | 624x96 | rest                                                 |
| ui-forward-mark   | sprite                | 10x14  | idle                                                 |
| ui-name-tab       | nine-slice (2,2,2,2)  | 12x20  | amber, green, pink, tan                              |
| ui-portrait-frame | sprite                | 68x68  | rest                                                 |
| ui-quip-strip     | nine-slice (2,2,2,2)  | 12x24  | rest                                                 |
| ui-resume         | sprite                | 160x44 | normal, pressed                                      |
| ui-settings-card  | nine-slice (2,38,2,2) | 16x48  | rest                                                 |
| ui-settings-row   | nine-slice (2,2,2,2)  | 12x48  | rest                                                 |
| ui-skip           | sprite                | 78x20  | normal, pressed, disabled                            |
| ui-touch-interact | sprite                | 43x43  | rest, press, held                                    |
| ui-touch-jump     | sprite                | 51x51  | rest, press, held                                    |
| ui-touch-knob     | sprite                | 11x11  | rest, held                                           |
| ui-touch-move     | sprite                | 77x67  | rest, press-left, held-left, press-right, held-right |
