/** Inline SVG HUD icon definitions. */
import { hudState } from "../state.js";
import { createHudSvgMarkup } from "./create-hud-svg-markup.js";
import { createSunRayPaths } from "./create-sun-ray-paths.js";
export function prepareHudIcons() {
  hudState.cloudIconPath = `M7.2 18.5h9.6a3.9 3.9 0 0 0 .5-7.77A5.2 5.2 0 0 0 7.3 9.6a4.46 4.46 0 0 0-.1 8.9z`;
  hudState.hudIcons = {
    sun: createHudSvgMarkup(
      `${createSunRayPaths(12, 12, 7.6, 10.2, `#f7a928`)}<circle cx="12" cy="12" r="5.4" fill="#ffd34d" stroke="#f7a928" stroke-width="1.6"/><circle cx="10.4" cy="10.6" r="1.5" fill="#fff3b8"/>`,
    ),
    moon: createHudSvgMarkup(
      `<path d="M15.8 4.2a7.9 7.9 0 1 0 4 12.9 6.4 6.4 0 0 1-4-12.9z" fill="#ffe7a3" stroke="#e8b95a" stroke-width="1.6"/><circle cx="11" cy="14.5" r="1.1" fill="#f1cf7c"/><circle cx="13.6" cy="10.4" r=".8" fill="#f1cf7c"/>`,
    ),
    cloud: createHudSvgMarkup(
      `<path d="${hudState.cloudIconPath}" fill="#fff" stroke="#9fb6d3" stroke-width="1.6"/>`,
    ),
    partly: createHudSvgMarkup(
      `${createSunRayPaths(8.5, 8.5, 5.4, 7.2, `#f7a928`, 1.8)}<circle cx="8.5" cy="8.5" r="3.8" fill="#ffd34d" stroke="#f7a928" stroke-width="1.4"/><path d="${hudState.cloudIconPath}" transform="translate(2.2 2) scale(.86)" fill="#fff" stroke="#9fb6d3" stroke-width="1.8"/>`,
    ),
    rain: createHudSvgMarkup(
      `<path d="${hudState.cloudIconPath}" transform="translate(0 -3)" fill="#eef5ff" stroke="#8aa6c9" stroke-width="1.6"/><path d="M8.5 18.2l-1 2.4M12.5 18.2l-1 2.4M16.5 18.2l-1 2.4" stroke="#5fb0ff" stroke-width="2"/>`,
    ),
    snow: createHudSvgMarkup(
      `<path d="${hudState.cloudIconPath}" transform="translate(0 -3)" fill="#fff" stroke="#9fb6d3" stroke-width="1.6"/><circle cx="8" cy="19.5" r="1.2" fill="#9fd0ff"/><circle cx="12" cy="21" r="1.2" fill="#9fd0ff"/><circle cx="16" cy="19.5" r="1.2" fill="#9fd0ff"/>`,
    ),
    stars: createHudSvgMarkup(
      `<path d="M9 3.5l1.3 3.2 3.2 1.3-3.2 1.3L9 12.5 7.7 9.3 4.5 8l3.2-1.3z" fill="#ffe7a3" stroke="#e8b95a" stroke-width="1.2"/><path d="M16.5 11l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fff4cc" stroke="#e8b95a" stroke-width="1"/><circle cx="7" cy="18" r="1" fill="#ffe7a3"/>`,
    ),
    sound: createHudSvgMarkup(
      `<path d="M4.5 9.5h3l4.2-3.6c.5-.4 1.3 0 1.3.6v11c0 .6-.8 1-1.3.6L7.5 14.5h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor"/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.8a7.4 7.4 0 0 1 0 10.4" stroke="currentColor" stroke-width="2"/>`,
    ),
    mute: createHudSvgMarkup(
      `<path d="M4.5 9.5h3l4.2-3.6c.5-.4 1.3 0 1.3.6v11c0 .6-.8 1-1.3.6L7.5 14.5h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2.2"/>`,
    ),
    camera: createHudSvgMarkup(
      `<path d="M4 8.2a2 2 0 0 1 2-2h1.8l1.3-1.8h5.8l1.3 1.8H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="currentColor"/><circle cx="12" cy="12.6" r="3.6" fill="#fffaf0"/><circle cx="12" cy="12.6" r="1.9" fill="currentColor"/><circle cx="17.2" cy="9" r=".9" fill="#fffaf0"/>`,
    ),
    help: createHudSvgMarkup(
      `<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" stroke="#fffaf0" stroke-width="2.2"/><circle cx="12" cy="16.9" r="1.2" fill="#fffaf0"/>`,
    ),
    heart: createHudSvgMarkup(
      `<path d="M12 20.3S3.6 15.2 3.6 9.3A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8.4 2.1c0 5.9-8.4 11-8.4 11z" fill="#ff7fa3" stroke="#e35d86" stroke-width="1.5"/><ellipse cx="8" cy="9.4" rx="1.6" ry="1.1" fill="#ffc2d4" transform="rotate(-30 8 9.4)"/>`,
    ),
    leaf: createHudSvgMarkup(
      `<path d="M5 19C4 11 9 4.5 19.5 4.5 19.5 14 14 19.5 5 19z" fill="#8fdc6f" stroke="#58a846" stroke-width="1.5"/><path d="M5 19c3-4.5 6.5-8 10.5-10.5" stroke="#58a846" stroke-width="1.5"/>`,
    ),
    sparkle: createHudSvgMarkup(
      `<path d="M12 2.8l1.9 5.6 5.6 1.9-5.6 1.9L12 17.8l-1.9-5.6-5.6-1.9 5.6-1.9z" fill="#ffe27a" stroke="#f0b53c" stroke-width="1.3"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#fff3bf" stroke="#f0b53c" stroke-width="1"/>`,
    ),
    block: createHudSvgMarkup(
      `<path d="M12 3.2l7.6 4.2v9.2L12 20.8l-7.6-4.2V7.4z" fill="#ffd9a0" stroke="#c98d4b" stroke-width="1.5"/><path d="M4.4 7.4L12 11.6l7.6-4.2M12 11.6v9.2" stroke="#c98d4b" stroke-width="1.5"/><path d="M4.4 7.4L12 3.2l7.6 4.2L12 11.6z" fill="#fff0cf"/>`,
    ),
    undo: createHudSvgMarkup(
      `<path d="M9 7L4.5 11.2 9 15.4" stroke="currentColor" stroke-width="2.4"/><path d="M5 11.2h9a5 5 0 0 1 0 10h-2" stroke="currentColor" stroke-width="2.4"/>`,
    ),
    mouseL: createHudSvgMarkup(
      `<rect x="5.5" y="3" width="13" height="18" rx="6.5" fill="#fff" stroke="#8b6f58" stroke-width="1.6"/><path d="M12 3v7.5H5.5V9.5A6.5 6.5 0 0 1 12 3z" fill="#ffb86b"/><path d="M5.5 10.5h13M12 3v7.5" stroke="#8b6f58" stroke-width="1.6"/>`,
    ),
    mouseR: createHudSvgMarkup(
      `<rect x="5.5" y="3" width="13" height="18" rx="6.5" fill="#fff" stroke="#8b6f58" stroke-width="1.6"/><path d="M12 3v7.5h6.5V9.5A6.5 6.5 0 0 0 12 3z" fill="#6fd3b0"/><path d="M5.5 10.5h13M12 3v7.5" stroke="#8b6f58" stroke-width="1.6"/>`,
    ),
    mouseM: createHudSvgMarkup(
      `<rect x="5.5" y="3" width="13" height="18" rx="6.5" fill="#fff" stroke="#8b6f58" stroke-width="1.6"/><rect x="10.4" y="5.5" width="3.2" height="5" rx="1.6" fill="#9fb8ff" stroke="#8b6f58" stroke-width="1.3"/><path d="M5.5 10.5h13" stroke="#8b6f58" stroke-width="1.6"/>`,
    ),
    wheel: createHudSvgMarkup(
      `<rect x="5.5" y="3" width="13" height="18" rx="6.5" fill="#fff" stroke="#8b6f58" stroke-width="1.6"/><rect x="10.4" y="5.5" width="3.2" height="5" rx="1.6" fill="#ffd34d" stroke="#8b6f58" stroke-width="1.3"/><path d="M21.5 6.5v5M20 8l1.5-1.5L23 8M20 10l1.5 1.5L23 10" stroke="#8b6f58" stroke-width="1.2"/>`,
    ),
    paw: createHudSvgMarkup(
      `<ellipse cx="12" cy="15.5" rx="4.6" ry="3.9" fill="currentColor"/><circle cx="6.3" cy="10.8" r="1.9" fill="currentColor"/><circle cx="9.6" cy="7" r="2" fill="currentColor"/><circle cx="14.4" cy="7" r="2" fill="currentColor"/><circle cx="17.7" cy="10.8" r="1.9" fill="currentColor"/>`,
    ),
    check: createHudSvgMarkup(
      `<circle cx="12" cy="12" r="9" fill="#6fd3b0"/><path d="M7.8 12.3l2.8 2.8 5.6-5.8" stroke="#fff" stroke-width="2.4"/>`,
    ),
  };
}
