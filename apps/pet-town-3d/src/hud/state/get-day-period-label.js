/** HUD context, state, DOM helpers, clock colors and weather display values. */
export function getDayPeriodLabel(hours) {
  return hours < 4.5
    ? `Late Night`
    : hours < 6.5
      ? `Dawn`
      : hours < 11
        ? `Morning`
        : hours < 14
          ? `Midday`
          : hours < 17
            ? `Afternoon`
            : hours < 19.5
              ? `Evening`
              : hours < 22
                ? `Night`
                : `Late Night`;
}
