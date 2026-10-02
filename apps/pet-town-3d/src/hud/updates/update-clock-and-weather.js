/** Clock, weather, hotbar, targeting reticle and interaction prompts. */
import { getHudHours } from "../state/get-hud-hours.js";
import { hudState } from "../state.js";
import { formatHudClock } from "../photo/format-hud-clock.js";
import { getDayPeriodLabel } from "../state/get-day-period-label.js";
import { getClockSkyColors } from "../state/get-clock-sky-colors.js";
import { getWeatherDisplay } from "../state/get-weather-display.js";
export function updateClockAndWeather(deltaTime) {
  let hudHoursResult = getHudHours();
  let result = hudHoursResult / 24;
  if (hudState.hudRuntime.lastT != null && hudState.hudRuntime.lastT > 0.9 && result < 0.1) {
    hudState.hudRuntime.day++;
  }
  hudState.hudRuntime.lastT = result;
  let result2 = hudState.hudContext.day ?? hudState.hudContext.sky?.day ?? hudState.hudRuntime.day;
  let [formatHudClockResult, formatHudClockResult2] = formatHudClock(hudHoursResult);
  if (formatHudClockResult !== hudState.hudRuntime.lastTime) {
    hudState.hudElements.time.textContent = formatHudClockResult;
    hudState.hudElements.ampm.textContent = formatHudClockResult2;
    hudState.hudRuntime.lastTime = formatHudClockResult;
  }
  let dayPeriodLabelResult = getDayPeriodLabel(hudHoursResult);
  if (dayPeriodLabelResult !== hudState.hudRuntime.lastPeriod) {
    hudState.hudElements.period.textContent = dayPeriodLabelResult;
    hudState.hudRuntime.lastPeriod = dayPeriodLabelResult;
  }
  let [clockSkyColorsResult, clockSkyColorsResult2] = getClockSkyColors(hudHoursResult);
  let text = `linear-gradient(180deg,${clockSkyColorsResult},${clockSkyColorsResult2})`;
  if (text !== hudState.hudRuntime.skyCss) {
    hudState.hudElements.sky.style.background = text;
    hudState.hudRuntime.skyCss = text;
  }
  let result3 = hudHoursResult >= 5.5 && hudHoursResult < 19;
  hudState.hudElements.dial.classList.toggle(`night`, !result3);
  hudState.hudElements.stars.style.opacity = +!result3;
  let result4 = result3
    ? ((hudHoursResult - 5.5) / 13.5) * Math.PI
    : (((hudHoursResult - 19 + 24) % 24) / 10.5) * Math.PI;
  let result5 = 50 - Math.cos(Math.min(Math.PI, Math.max(0, result4))) * 36;
  let result6 = 70 - Math.sin(Math.min(Math.PI, Math.max(0, result4))) * 46;
  let result7 = result5.toFixed(1) + `,` + result6.toFixed(1);
  if (result7 !== hudState.hudRuntime.orbCss) {
    hudState.hudElements.orb.style.left = result5.toFixed(1) + `%`;
    hudState.hudElements.orb.style.top = result6.toFixed(1) + `%`;
    hudState.hudRuntime.orbCss = result7;
  }
  let result8 = result3 ? `sun` : `moon`;
  if (hudState.hudElements.orb.dataset.k !== result8) {
    hudState.hudElements.orb.innerHTML = hudState.hudIcons[result8];
    hudState.hudElements.orb.dataset.k = result8;
  }
  let [weatherDisplayResult, weatherDisplayResult2] = getWeatherDisplay(hudHoursResult);
  if (hudState.hudElements.wx.dataset.k !== weatherDisplayResult) {
    hudState.hudElements.wx.innerHTML = hudState.hudIcons[weatherDisplayResult];
    hudState.hudElements.wx.dataset.k = weatherDisplayResult;
  }
  if (hudState.hudElements.wl.textContent !== weatherDisplayResult2) {
    hudState.hudElements.wl.textContent = weatherDisplayResult2;
  }
  let text2 = `Day ${result2}`;
  if (hudState.hudElements.day.textContent !== text2) {
    hudState.hudElements.day.textContent = text2;
  }
}
