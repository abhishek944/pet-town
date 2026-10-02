/** Mobile joystick and jump controls that translate pointer gestures into keyboard input. */
import { hudState } from "../state.js";
export function prepareHudTouchControls() {
  hudState.touchControlMediaQuery = `(hover:none) and (pointer:coarse)`;
  hudState.touchControlStyles = `
.pk-touch{position:absolute;inset:0;pointer-events:none;display:none}
.pk-touch.on{display:block}
.pk-stick{position:absolute;left:max(20px,env(safe-area-inset-left));bottom:max(20px,env(safe-area-inset-bottom));width:132px;height:132px;border-radius:50%;pointer-events:auto;touch-action:none;
  background:radial-gradient(circle at 50% 50%,rgba(255,250,240,.28),rgba(255,250,240,.5));border:3px solid rgba(255,255,255,.85);box-shadow:0 4px 0 rgba(200,170,130,.45),0 10px 22px rgba(60,40,20,.18)}
.pk-stick::before{content:"";position:absolute;inset:26%;border-radius:50%;border:2px dashed rgba(139,111,88,.35)}
.pk-thumb{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;
  background:linear-gradient(180deg,#fffdf8,#fff0d6);border:3px solid #fff;box-shadow:0 4px 0 var(--ledge),0 8px 16px rgba(92,58,24,.22);transition:transform .18s var(--spring)}
.pk-stick.active .pk-thumb{transition:none}
.pk-stick.run .pk-thumb{background:linear-gradient(180deg,#ffe08a,#ffc94a)}
.pk-jump{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));width:84px;height:84px;border-radius:50%;pointer-events:auto;touch-action:none;
  display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,#8fe0c0,#5fcaa4);border:3px solid #fff;box-shadow:0 5px 0 #43a585,0 12px 22px rgba(40,90,70,.25);
  transition:transform .2s var(--spring),box-shadow .15s}
.pk-jump svg{width:40px;height:40px}
.pk-jump.down{transform:translateY(4px) scale(.94);box-shadow:0 1px 0 #43a585,0 6px 12px rgba(40,90,70,.25)}
@media (max-aspect-ratio:4/5){.pk-stick{bottom:calc(max(20px,env(safe-area-inset-bottom)) + 96px)}.pk-jump{bottom:calc(max(26px,env(safe-area-inset-bottom)) + 100px)}}
@media (max-height:540px){.pk-stick{width:112px;height:112px}.pk-thumb{width:50px;height:50px;margin:-25px 0 0 -25px}.pk-jump{width:72px;height:72px}}
`;
  hudState.touchJumpIconMarkup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11.5L12 5.5l6 6"/></svg>`;
  hudState.simulatedTouchKeys = new Set();
}
