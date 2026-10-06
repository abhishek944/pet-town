# Landing experience recordings

The landing page in `apps/web` shows actual recordings of Pet Street and Pet Town. Its large hero uses silent MP4 loops of the solo browser town. The three experience cards use GIFs of the town, wildlife petting, and running/jumping. The companions section uses a GIF of native Pet Street with Ocean scenery.

`sections/hero.html`, `town.html`, and `companions.html` own the content. `src/gameplay-hero.ts` selects a hero recording; `src/motion-previews.ts` owns playback, visibility, lazy loading, reduced motion, and shared pause controls. `src/styles/experience.css` provides the selected landing layout. Assets and recording provenance live under `public/media/gameplay/`. All public URLs honor Vite's base path.

Posters render without JavaScript. Recordings start only while visible and allowed by reduced-motion/data-saving preferences. Buttons can explicitly enable playback. Pausing replaces GIFs with still posters, pauses video, and invalidates pending playback attempts. A failed hero keeps its poster and shows a status message; choosing another clip and pressing Play can recover.

For new recordings, play the real solo town or native app, retain timestamped frames privately under ignored `var/`, then encode short loops and matching posters. Remove workspace names and private content before copying any native capture to public assets. Do not publish raw desktop captures. Record the origin, actions, dimensions, duration, and any cropping/redaction in `provenance.json`. The current native clip removes workspace labels and crops empty space above the strip. Encoded frames are actual captures; no generated/interpolated gameplay frames are used.

Keep browser gameplay separate from Mac-only live agents and Mayor voice. Development-preview recordings do not establish availability in the latest published Mac download. Preserve that distinction in visible copy.

Run `pnpm --dir apps/web run build` and `pnpm --dir apps/web run lint` after changes. Check the landing route on desktop and narrow screens, hero clip selection, pause/resume, offscreen media, failure posters, and the retained 20-character gallery. The reviewed visual contract and comparison are under `var/landing-experience/ui-ux-grill-me/2026-10-02-motion/` and `var/landing-experience/implement-details/visual/`.
