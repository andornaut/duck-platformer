// The site navigation bar: Home and Play. A page loads it with <link rel="stylesheet"
// href="/nav.css"> and <script src="/nav.js" defer></script> in its head and adds nothing else.
// The page links the stylesheet, rather than this script injecting it, so the bar's style blocks
// the first paint. On /play/ the bar is one slim row, so the game keeps the height. On /play/ in
// the installed app (fullscreen or standalone display mode, or iOS's navigator.standalone) there
// is no bar, so no link leaves the app and the game takes the full height.
(() => {
  "use strict";
  // Cloudflare serves /x.html as /x and /dir/index.html as /dir/, so compare without either.
  const norm = (path) => path.replace(/(index)?\.html$/, "").replace(/\/$/, "");
  const here = norm(location.pathname);

  const nav = document.createElement("nav");
  nav.className = here === "/play" ? "site-nav slim" : "site-nav";
  nav.setAttribute("aria-label", "Site");
  const ul = document.createElement("ul");
  nav.append(ul);

  const item = (text, href) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = text;
    a.href = href;
    if (norm(href) === here) a.setAttribute("aria-current", "page");
    li.append(a);
    return li;
  };
  ul.append(item("Home", "/"), item("Play", "/play/"));

  const installed = matchMedia("(display-mode: fullscreen), (display-mode: standalone)");
  const hide = () => here === "/play" && (installed.matches || navigator.standalone === true);
  const mount = () => {
    if (hide()) nav.remove();
    else if (!nav.isConnected) document.body.prepend(nav);
  };
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
  installed.addEventListener("change", mount);
})();
