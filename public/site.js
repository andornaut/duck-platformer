// Every page: asks for landscape. Browsers allow the lock only in fullscreen or an installed
// app and reject it elsewhere, which needs no handling: the turn-sideways notice covers
// portrait.
(() => {
  "use strict";
  screen.orientation?.lock?.("landscape").catch(() => {});
})();
