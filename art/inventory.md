# Art inventory

Every served art asset. Sizes are in base pixels at 720x360. Tags are in frame order. A nine-slice lists its margins as left, top, right, bottom.

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

## Images

Plain PNGs from `art/tools/logo.py`, listed in the manifest under `images` with their sizes.

| Key       | Type                                                         | Size    | Path                       |
| --------- | ------------------------------------------------------------ | ------- | -------------------------- |
| logo      | title-screen logo                                            | 360x193 | `public/art/logo.png`      |
| logo-icon | nav-column logo: her profile on the downstroke, no lettering | 53x41   | `public/art/logo-icon.png` |
| logo-nav  | nav-bar logo, one line                                       | 214x30  | `public/art/logo-nav.png`  |

## Sprites

| Key                 | Type                                | Size   | Tags                            |
| ------------------- | ----------------------------------- | ------ | ------------------------------- |
| dog-pug             | street cast                         | 44x32  | idle, walk, perk (once), talk   |
| duck                | character                           | 48x42  | idle, walk, jump, flutter, land |
| ferret              | character, upright champagne ferret | 64x80  | idle, scheme, talk              |
| ferret-trap-snap    | hazard, hit box 4,14,42,12          | 50x26  | set, snap (once)                |
| frog-courier        | hazard, hit box 6,6,48,30           | 60x36  | ride, idle                      |
| icon-browser-menu   | sprite                              | 16x16  | rest                            |
| icon-install        | sprite                              | 16x16  | rest                            |
| icon-ios-share      | sprite                              | 16x16  | rest                            |
| icon-settings       | sprite                              | 16x16  | rest                            |
| icon-touch-controls | sprite                              | 16x16  | rest                            |
| pedestrian-cat      | street cast                         | 34x50  | walk, idle                      |
| pedestrian-raccoon  | street cast                         | 34x50  | walk, idle                      |
| pigeon              | street cast                         | 22x22  | idle, flee (once), fly          |
| portrait-duck       | portrait                            | 64x64  | neutral, happy, worried         |
| portrait-ferret     | portrait                            | 64x64  | neutral, smug, annoyed          |
| ui-answer           | sprite                              | 208x36 | normal, selected, pressed       |
| ui-button           | nine-slice (2,4,2,6)                | 16x28  | normal, pressed                 |
| ui-checkbox         | sprite                              | 20x20  | off, on                         |
| ui-close            | sprite                              | 24x24  | normal, pressed                 |
| ui-dialogue-box     | sprite                              | 640x96 | rest                            |
| ui-forward-mark     | sprite                              | 10x14  | idle                            |
| ui-name-tab         | nine-slice (2,2,2,2)                | 12x20  | amber, green, pink, tan         |
| ui-pause            | sprite                              | 35x35  | rest, press, held               |
| ui-portrait-frame   | sprite                              | 68x68  | rest                            |
| ui-quit             | sprite                              | 20x20  | normal, pressed                 |
| ui-quip-strip       | nine-slice (2,2,2,2)                | 12x24  | rest                            |
| ui-resume           | sprite                              | 160x44 | normal, pressed                 |
| ui-settings-card    | nine-slice (2,38,2,2)               | 16x48  | rest                            |
| ui-settings-row     | nine-slice (2,2,2,2)                | 12x48  | rest                            |
| ui-skip             | sprite                              | 78x20  | normal, pressed, disabled       |
| ui-touch-jump       | sprite                              | 75x75  | rest, press, held               |
| ui-touch-use        | sprite                              | 67x67  | rest, press, held               |

## Tilesets

12x12 tiles in rows of 8, from `art/tools/floor1.py`. One-way ledges are named `one-way-*`; doorways (`door-*`, `exit-*`) and pits (`pit-*`) have no collision.

| Key          | Type                                                                                             | Size            | Pieces      |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------- | ----------- |
| tiles-lobby  | tileset: wood floor, one-way balcony, shelf, cushion and desk, wood post, stairwell exit         | 130 tiles, 12px | exit (7x15) |
| tiles-street | tileset: sidewalk, kerb, road, one-way awning, one-way canopy, planter, hotel door, cellar hatch | 42 tiles, 12px  | door (3x4)  |

## Backdrops

Pieces placed from level data by their bottom-left corner at the bottom y given, from `art/tools/floor1.py`.

| Key                     | Type                                     | Size    | Bottom y, repeat |
| ----------------------- | ---------------------------------------- | ------- | ---------------- |
| cab                     | street furniture, yellow cab             | 96x40   | 312, none        |
| canopy-poles            | street furniture, under the hotel canopy | 60x60   | 312, none        |
| cross-street            | far avenue down a cross street           | 120x26  | 312, none        |
| doorman-podium          | street furniture                         | 18x24   | 312, none        |
| facade-brownstone       | building facade, brownstone              | 48x312  | 312, x           |
| facade-hotel            | building facade, the hotel               | 48x312  | 312, x           |
| facade-one-storey       | building facade, one-storey brick        | 48x192  | 312, x           |
| facade-walkup           | building facade, brick walk-up           | 48x312  | 312, x           |
| fire-escape             | facade piece, walk-up                    | 196x185 | 185, none        |
| hot-dog-cart            | street furniture                         | 40x70   | 312, none        |
| hotel-crest             | facade piece, banners and crest          | 98x44   | 190, none        |
| hotel-window            | facade piece, tall lobby window          | 32x152  | 304, none        |
| lobby-balustrade        | lobby, balcony railing                   | 48x36   | balcony line, x  |
| lobby-bookcase          | lobby, tall bookcase                     | 84x384  | 672, none        |
| lobby-desk              | lobby, reception desk                    | 120x96  | 672, none        |
| lobby-front-door        | lobby, inside of the front door          | 156x180 | 672, none        |
| lobby-lamp              | lobby, pendant lamp, lit bulb            | 48x192  | 220, none        |
| lobby-plant             | lobby, potted plant                      | 48x120  | 672, none        |
| lobby-sofa              | lobby, sofa                              | 120x72  | 672, none        |
| lobby-wall              | lobby wall, wood panelling               | 48x720  | 720, x           |
| lobby-window            | lobby, tall window                       | 96x240  | 552, none        |
| storefront-cafe         | storefront, cup sign                     | 84x120  | 312, none        |
| storefront-diner        | storefront, fork-and-knife sign          | 108x120 | 312, none        |
| storefront-florist      | storefront, flower sign                  | 84x120  | 312, none        |
| storefront-gift-shop    | storefront, gift sign                    | 96x120  | 312, none        |
| storefront-makeup-store | storefront, lipstick sign                | 96x120  | 312, none        |
| storefront-noodle-bar   | storefront, noodle-bowl sign             | 120x120 | 312, none        |
| storefront-pet-shop     | storefront, paw sign                     | 108x120 | 312, none        |
| street-sky              | day sky                                  | 48x312  | 312, x           |
| street-skyline          | far skyline, water towers, glass tower   | 336x272 | 312, x           |
| street-tree             | street furniture                         | 64x136  | 312, none        |
| subway-railing          | street furniture                         | 72x62   | 312, none        |
| walk-signal             | street furniture                         | 12x82   | 312, none        |
