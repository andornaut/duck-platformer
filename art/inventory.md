# Art inventory

Every served art asset. Sizes are in base pixels at 648x360. Tags are in frame order. A nine-slice lists its margins as left, top, right, bottom.

## Data

| Key     | Type                        | Size       | Tags |
| ------- | --------------------------- | ---------- | ---- |
| palette | JSON: colours, darker, dim2 | 32 colours |      |

## Fonts

| Key        | Type               | Size         | Tags |
| ---------- | ------------------ | ------------ | ---- |
| font-body  | BMFont, Tiny5      | 8px, line 10 |      |
| font-title | BMFont, Silkscreen | 8px, line 12 |      |

## Icons

Plain PNGs and one ICO from `art/tools/icons.py`, not manifest entries.

| Key               | Type                                     | Size    | Path                                 |
| ----------------- | ---------------------------------------- | ------- | ------------------------------------ |
| apple-touch-icon  | icon, green square                       | 180x180 | `public/icons/apple-touch-icon.png`  |
| favicon           | favicon, disc on transparent             | 32x32   | `public/art/favicon.png`             |
| favicon-16        | favicon, disc on transparent             | 16x16   | `public/art/favicon-16.png`          |
| favicon-ico       | ICO holding favicon-16 and favicon       | 16, 32  | `public/favicon.ico`                 |
| icon-192          | web manifest icon, disc on transparent   | 192x192 | `public/icons/icon-192.png`          |
| icon-512          | web manifest icon, disc on transparent   | 512x512 | `public/icons/icon-512.png`          |
| icon-maskable-512 | maskable icon, green square, central 80% | 512x512 | `public/icons/icon-maskable-512.png` |

## Sprites

| Key               | Type                  | Size   | Tags                            |
| ----------------- | --------------------- | ------ | ------------------------------- |
| duck              | character             | 48x42  | idle, walk, jump, flutter, land |
| ferret            | character             | 64x80  | idle, scheme, talk              |
| portrait-duck     | portrait              | 64x64  | neutral, happy, worried         |
| portrait-ferret   | portrait              | 64x64  | neutral, smug, annoyed          |
| ui-answer         | sprite                | 204x36 | normal, selected, pressed       |
| ui-checkbox       | sprite                | 20x20  | off, on                         |
| ui-close          | sprite                | 24x24  | normal, pressed                 |
| ui-dialogue-box   | sprite                | 624x96 | rest                            |
| ui-forward-mark   | sprite                | 10x14  | idle                            |
| ui-name-tab       | nine-slice (2,2,2,2)  | 12x20  | amber, green, pink, tan         |
| ui-portrait-frame | sprite                | 68x68  | rest                            |
| ui-quip-strip     | nine-slice (2,2,2,2)  | 12x24  | rest                            |
| ui-resume         | sprite                | 160x44 | normal, pressed                 |
| ui-settings-card  | nine-slice (2,38,2,2) | 16x48  | rest                            |
| ui-settings-row   | nine-slice (2,2,2,2)  | 12x48  | rest                            |
| ui-skip           | sprite                | 78x20  | normal, pressed, disabled       |
| ui-touch-jump     | sprite                | 57x57  | rest, press, held               |
| ui-touch-use      | sprite                | 51x51  | rest, press, held               |

## Tilesets

12x12 tiles in rows of 8, from `art/tools/floor1.py`. One-way ledges are named `one-way-*`.

| Key          | Type                                                                      | Size           | Pieces     |
| ------------ | ------------------------------------------------------------------------- | -------------- | ---------- |
| tiles-lobby  | tileset: marble floor, one-way ledge, green marble column, stairwell exit | 33 tiles, 12px | exit (3x4) |
| tiles-street | tileset: sidewalk, kerb, road, one-way awning, planter, post, front wall  | 26 tiles, 12px |            |

## Backdrops

Pieces placed from level data by their bottom-left corner at the bottom y given, from `art/tools/floor1.py`.

| Key                     | Type                            | Size    | Bottom y, repeat |
| ----------------------- | ------------------------------- | ------- | ---------------- |
| entrance-lobby          | open front door, lobby side     | 24x48   | 312, none        |
| entrance-street         | open front door, street side    | 24x48   | 312, none        |
| lobby-mailboxes         | lobby prop                      | 108x84  | 228, none        |
| lobby-pilaster          | lobby prop                      | 24x192  | 240, none        |
| lobby-plant             | lobby prop                      | 36x72   | 312, none        |
| lobby-wall              | lobby wall, cornice, wainscot   | 48x312  | 312, x           |
| lobby-window            | lobby prop                      | 72x144  | 216, none        |
| storefront-cafe         | storefront, cup sign            | 144x120 | 312, none        |
| storefront-diner        | storefront, fork-and-knife sign | 168x120 | 312, none        |
| storefront-florist      | storefront, flower sign         | 144x120 | 312, none        |
| storefront-gift-shop    | storefront, gift sign           | 144x120 | 312, none        |
| storefront-makeup-store | storefront, lipstick sign       | 120x120 | 312, none        |
| storefront-noodle-bar   | storefront, noodle-bowl sign    | 144x120 | 312, none        |
| storefront-pet-shop     | storefront, paw sign            | 120x120 | 312, none        |
| street-facade           | apartment floors                | 48x144  | 192, x           |
| street-lamp             | street prop, lit bulb           | 24x168  | 312, none        |
| street-sky              | morning sky band                | 48x48   | 48, x            |
| street-wall             | brick between storefronts       | 12x120  | 312, x           |
