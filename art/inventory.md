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

| Key               | Type                                        | Size    | Path                                 |
| ----------------- | ------------------------------------------- | ------- | ------------------------------------ |
| apple-touch-icon  | icon, sunburst square                       | 180x180 | `public/icons/apple-touch-icon.png`  |
| favicon           | favicon, disc on transparent                | 32x32   | `public/art/favicon.png`             |
| favicon-16        | favicon, disc on transparent                | 16x16   | `public/art/favicon-16.png`          |
| favicon-ico       | ICO holding favicon-16 and favicon          | 16, 32  | `public/favicon.ico`                 |
| icon-192          | web manifest icon, disc on transparent      | 192x192 | `public/icons/icon-192.png`          |
| icon-512          | web manifest icon, disc on transparent      | 512x512 | `public/icons/icon-512.png`          |
| icon-maskable-512 | maskable icon, sunburst square, central 80% | 512x512 | `public/icons/icon-maskable-512.png` |

## Images

Plain PNGs from `art/tools/logo.py`, listed in the manifest under `images` with their sizes.

| Key       | Type                                                         | Size    | Path                       |
| --------- | ------------------------------------------------------------ | ------- | -------------------------- |
| logo      | title-screen logo                                            | 360x193 | `public/art/logo.png`      |
| logo-icon | nav-column logo: her profile on the downstroke, no lettering | 53x41   | `public/art/logo-icon.png` |
| logo-nav  | nav-bar logo, one line                                       | 214x30  | `public/art/logo-nav.png`  |

## Sprites

| Key                 | Type                                                | Size   | Tags                              |
| ------------------- | --------------------------------------------------- | ------ | --------------------------------- |
| dog-pug             | street cast                                         | 44x32  | idle, walk, perk (once), talk     |
| duck                | character                                           | 48x42  | idle, walk, jump, flutter, land   |
| ferret              | character, upright champagne ferret                 | 64x80  | idle, scheme, talk                |
| ferret-trap-snap    | hazard, hit box 4,14,42,12                          | 50x26  | set, snap (once)                  |
| frog-courier        | hazard, hit box 6,6,48,30                           | 60x36  | ride, idle                        |
| icon-browser-menu   | sprite                                              | 16x16  | rest                              |
| icon-exit           | sprite                                              | 16x16  | rest                              |
| icon-home           | sprite                                              | 16x16  | rest                              |
| icon-home-nav       | sprite                                              | 20x20  | rest                              |
| icon-install        | sprite                                              | 16x16  | rest                              |
| icon-ios-share      | sprite                                              | 16x16  | rest                              |
| icon-settings       | sprite                                              | 16x16  | rest                              |
| icon-settings-nav   | sprite                                              | 20x20  | rest                              |
| icon-touch-controls | sprite                                              | 16x16  | rest                              |
| map-compass         | map pen mark, tan                                   | 25x33  | rest                              |
| map-duck            | map marker, the duck at half size                   | 26x22  | idle                              |
| map-fork            | map fork marker                                     | 29x29  | normal, current, visited, unbuilt |
| map-hill            | map pen mark, tan                                   | 20x11  | rest                              |
| map-icon-street     | map zone icon, a brownstone                         | 14x14  | normal, visited                   |
| map-icon-zone       | map zone icon, a pin, for any zone without its own  | 14x14  | normal, visited                   |
| map-paper           | nine-slice (13,13,13,13), the map's paper and frame | 32x32  | rest                              |
| map-wave            | map pen mark, tan                                   | 22x4   | rest                              |
| map-zone            | map zone marker                                     | 35x35  | normal, current, visited, unbuilt |
| pedestrian-cat      | street cast                                         | 34x50  | walk, idle                        |
| pedestrian-raccoon  | street cast                                         | 34x50  | walk, idle                        |
| pigeon              | street cast                                         | 22x22  | idle, flee (once), fly            |
| portrait-duck       | portrait                                            | 64x64  | neutral, happy, worried           |
| portrait-ferret     | portrait                                            | 64x64  | neutral, smug, annoyed            |
| ui-answer           | sprite                                              | 208x36 | normal, selected, pressed         |
| ui-button           | nine-slice (2,4,2,6)                                | 16x28  | normal, pressed                   |
| ui-checkbox         | sprite                                              | 20x20  | off, on                           |
| ui-close            | sprite                                              | 24x24  | normal, pressed                   |
| ui-dialogue-box     | sprite                                              | 640x96 | rest                              |
| ui-fork-arrow       | sprite                                              | 14x14  | up, level, down                   |
| ui-fork-choice      | sprite                                              | 160x36 | normal, selected, pressed         |
| ui-focus            | nine-slice (4,4,4,4)                                | 16x16  | rest                              |
| ui-forward-mark     | sprite                                              | 10x14  | idle                              |
| ui-icon-button      | sprite                                              | 36x36  | normal, pressed                   |
| ui-name-tab         | nine-slice (2,2,2,2)                                | 12x20  | amber, green, pink, tan           |
| ui-nav-bar          | nine-slice (1,1,1,3)                                | 12x48  | rest                              |
| ui-pause            | sprite                                              | 35x35  | rest, press, held                 |
| ui-play-mark        | sprite                                              | 5x10   | rest                              |
| ui-portrait-frame   | sprite                                              | 68x68  | rest                              |
| ui-quit             | sprite                                              | 20x20  | normal, pressed                   |
| ui-quip-strip       | nine-slice (2,2,2,2)                                | 12x24  | rest                              |
| ui-resume           | sprite                                              | 160x44 | normal, pressed                   |
| ui-settings-card    | nine-slice (2,38,2,2)                               | 16x48  | rest                              |
| ui-settings-row     | nine-slice (2,2,2,2)                                | 12x48  | rest                              |
| ui-skip             | sprite                                              | 78x20  | normal, pressed, disabled         |
| ui-start            | sprite                                              | 192x52 | normal, pressed                   |
| ui-touch-jump       | sprite                                              | 75x75  | rest, press, held                 |
| ui-touch-use        | sprite                                              | 75x75  | rest, press, held                 |

## Tilesets

12x12 tiles in rows of 8, from `art/tools/floor1.py`. One-way ledges are named `one-way-*`; doorways (`door-*`, `exit-*`) and pits (`pit-*`) have no collision.

| Key          | Type                                                                                                                                                       | Size            | Pieces      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------- |
| tiles-lobby  | tileset (kept for a later indoor zone): wood floor, one-way balcony, shelf, cushion and desk, wood post, stairwell exit                                    | 130 tiles, 12px | exit (7x15) |
| tiles-street | tileset: sidewalk, kerb, road, one-way awning, one-way canopy, planter, door, cellar hatch, one-way fire-escape landing, sill, cornice and water-tower top | 54 tiles, 12px  | door (3x4)  |

## Backdrops

Pieces placed from level data by their bottom-left corner at the bottom y given, from `art/tools/floor1.py` (Zone 1: New York street, 720px tall, sidewalk top y 600, row 50).

| Key                     | Type                                                                 | Size    | Bottom y, repeat |
| ----------------------- | -------------------------------------------------------------------- | ------- | ---------------- |
| cab                     | street furniture, yellow cab                                         | 96x40   | 600, none        |
| canopy-poles            | street furniture, under the canopy                                   | 60x60   | 600, none        |
| cross-street            | far avenue down a cross street                                       | 120x26  | 600, none        |
| doorman-podium          | street furniture                                                     | 18x24   | 600, none        |
| facade-brownstone       | building facade, brownstone                                          | 48x312  | 600, x           |
| facade-brownstone-upper | building facade, a brownstone's upper storey                         | 48x180  | 288, x           |
| facade-hotel            | building facade, tall dark stone (generic until the exit is decided) | 48x312  | 600, x           |
| facade-hotel-upper      | building facade, the tall stone building's upper storey              | 48x180  | 288, x           |
| facade-one-storey       | building facade, one-storey brick                                    | 48x192  | 600, x           |
| facade-walkup           | building facade, brick walk-up                                       | 48x312  | 600, x           |
| facade-walkup-upper     | building facade, a walk-up's upper storey                            | 48x180  | 288, x           |
| fire-escape             | facade piece, walk-up                                                | 196x185 | 473, none        |
| fire-escape-ladder      | climbing, fire-escape ladder between landings 8 rows apart           | 24x96   | 432, none        |
| fire-escape-ladder-4    | climbing, fire-escape ladder between landings 4 rows apart           | 24x48   | 432, none        |
| fire-escape-ladder-5    | climbing, fire-escape ladder between landings 5 rows apart           | 24x60   | 432, none        |
| fire-escape-ladder-6    | climbing, fire-escape ladder between landings 6 rows apart           | 24x72   | 432, none        |
| fire-escape-ladder-7    | climbing, fire-escape ladder between landings 7 rows apart           | 24x84   | 432, none        |
| fire-escape-railing     | climbing, fire-escape railing on a landing                           | 48x24   | 432, x           |
| hot-dog-cart            | street furniture                                                     | 40x70   | 600, none        |
| hotel-crest             | facade piece, banners and crest (generic)                            | 98x44   | 478, none        |
| hotel-window            | facade piece, tall window (generic)                                  | 32x152  | 592, none        |
| lobby-balustrade        | lobby (later indoor zone), balcony railing                           | 48x36   | balcony line, x  |
| lobby-bookcase          | lobby (later indoor zone), tall bookcase                             | 84x384  | 672, none        |
| lobby-desk              | lobby (later indoor zone), reception desk                            | 120x96  | 672, none        |
| lobby-front-door        | lobby (later indoor zone), inside of the front door                  | 156x180 | 672, none        |
| lobby-lamp              | lobby (later indoor zone), pendant lamp, lit bulb                    | 48x192  | 220, none        |
| lobby-plant             | lobby (later indoor zone), potted plant                              | 48x120  | 672, none        |
| lobby-sofa              | lobby (later indoor zone), sofa                                      | 120x72  | 672, none        |
| lobby-wall              | lobby wall (later indoor zone), wood panelling                       | 48x720  | 720, x           |
| lobby-window            | lobby (later indoor zone), tall window                               | 96x240  | 552, none        |
| roofline-brownstone     | roofline, brownstone                                                 | 48x48   | 108, x           |
| roofline-hotel          | roofline, tall stone building                                        | 48x48   | 108, x           |
| roofline-walkup         | roofline, walk-up                                                    | 48x48   | 108, x           |
| storefront-cafe         | storefront, cup sign                                                 | 84x120  | 600, none        |
| storefront-diner        | storefront, fork-and-knife sign                                      | 108x120 | 600, none        |
| storefront-florist      | storefront, flower sign                                              | 84x120  | 600, none        |
| storefront-gift-shop    | storefront, gift sign                                                | 96x120  | 600, none        |
| storefront-makeup-store | storefront, lipstick sign                                            | 96x120  | 600, none        |
| storefront-noodle-bar   | storefront, noodle-bowl sign                                         | 120x120 | 600, none        |
| storefront-pet-shop     | storefront, paw sign                                                 | 108x120 | 600, none        |
| street-sky              | day sky, both screens                                                | 48x600  | 600, x           |
| street-skyline          | far skyline, water towers, two towers                                | 336x600 | 600, x           |
| street-tree             | street furniture                                                     | 64x136  | 600, none        |
| subway-railing          | street furniture                                                     | 72x62   | 600, none        |
| walk-signal             | street furniture                                                     | 12x82   | 600, none        |
| water-tower             | climbing, water tower (top one-way tiles)                            | 48x84   | 240, none        |
