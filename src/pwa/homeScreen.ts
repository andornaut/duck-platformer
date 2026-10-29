// Whether the game's home screen is in front, for the kit's update flow: the game page counts as
// the home screen once the level's first frame shows, except while something covers it.
export type HomeCover = "pauseCard" | "sideways";

export interface HomeScreen {
  // Something starts or stops covering the level.
  cover(what: HomeCover, covering: boolean): void;
  // The level's first frame has shown.
  shown(): void;
}

// Calls onChange with whether the home screen is in front, on each change only.
export function trackHomeScreen(onChange: (onHome: boolean) => void): HomeScreen {
  let levelShown = false;
  const covers = new Set<HomeCover>();
  let last = false;
  const update = () => {
    const now = levelShown && covers.size === 0;
    if (now !== last) {
      last = now;
      onChange(now);
    }
  };
  return {
    cover(what, covering) {
      if (covering) {
        covers.add(what);
      } else {
        covers.delete(what);
      }
      update();
    },
    shown() {
      levelShown = true;
      update();
    },
  };
}
