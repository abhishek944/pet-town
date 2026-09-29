export interface SnowPalette {
  snow: string;
  shade: string;
  pine: string;
  wood: string;
  roof: string;
  ice: string;
}

export function snowPalette(night: boolean): SnowPalette {
  return night
    ? {
        snow: "#beddec",
        shade: "#729bbd",
        pine: "#315a72",
        wood: "#776f8e",
        roof: "#67839e",
        ice: "#6eabc8",
      }
    : {
        snow: "#edf9ff",
        shade: "#a4c6dd",
        pine: "#568383",
        wood: "#aa7760",
        roof: "#73949f",
        ice: "#a7dcea",
      };
}

export function pine(x: number, y: number, h: number, p: SnowPalette, w = h * 0.48): string {
  return `<g transform="translate(${x} ${y})">
    <path d="M-3 0V-${h * 0.6}h6V0" fill="#77777b"/>
    <path d="M0 -${h}L-${w * 0.32} -${h * 0.56}H-${w * 0.17}L-${w * 0.48} -${h * 0.26}H-${w * 0.29}L-${w * 0.6} -8Q0 5 ${w * 0.6} -8L${w * 0.29} -${h * 0.26}H${w * 0.48}L${w * 0.17} -${h * 0.56}H${w * 0.32}Z" fill="${p.pine}"/>
    <path d="M0 -${h}L-${w * 0.32} -${h * 0.56}Q-${w * 0.12} -${h * 0.49} 0 -${h * 0.56}Q${w * 0.14} -${h * 0.49} ${w * 0.32} -${h * 0.56}ZM-${w * 0.17} -${h * 0.52}L-${w * 0.48} -${h * 0.26}Q-${w * 0.12} -${h * 0.2} 0 -${h * 0.29}Q${w * 0.2} -${h * 0.19} ${w * 0.48} -${h * 0.26}L${w * 0.17} -${h * 0.52}L${w * 0.25} -${h * 0.3}Q0 -${h * 0.2} -${w * 0.25} -${h * 0.3}Z" fill="${p.snow}"/>
    <path d="M-${w * 0.42} -12Q0 -2 ${w * 0.42} -12" fill="none" stroke="${p.snow}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

export function cabin(x: number, y: number, s: number, night: boolean, p: SnowPalette): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="2" rx="66" ry="7" fill="${p.shade}" opacity=".45"/>
    <path d="M-50 0V-50L0 -86L50 -50V0Z" fill="${p.wood}"/>
    <path d="M-52 -48L0 -87L52 -48" fill="none" stroke="${p.snow}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 -71V-88h12v27" fill="${p.roof}"/>
    <path d="M22 -88h16" stroke="${p.snow}" stroke-width="5" stroke-linecap="round"/>
    <g class="chimney"><path d="M29 -95q-10 -8 0 -15t0 -16" fill="none" stroke="${p.snow}" stroke-width="5" stroke-linecap="round" opacity=".32"/></g>
    <path d="M-44 -25H44M-44 -15H44M-44 -5H44" stroke="#423e51" opacity=".25"/>
    <rect x="-9" y="-34" width="19" height="34" rx="3" fill="#514959"/>
    <circle cx="5" cy="-16" r="1.5" fill="#ffdf9c"/>
    <g fill="${night ? "#ffdb8b" : "#e7c99b"}" stroke="#635d67" stroke-width="3">
      <rect x="-38" y="-43" width="20" height="19" rx="2"/>
      <rect x="19" y="-43" width="20" height="19" rx="2"/>
    </g>
    <path d="M-28 -43v19M29 -43v19" stroke="#817474" stroke-width="2"/>
    ${night ? '<ellipse cx="0" cy="-26" rx="48" ry="24" fill="#ffdf9c" opacity=".1" filter="url(#soft)"/>' : ""}
    <path d="M-57 0Q-28 -7 -8 -1T57 0" fill="none" stroke="${p.snow}" stroke-width="7" stroke-linecap="round"/>
  </g>`;
}

export function lamp(x: number, y: number, s: number, night: boolean, p: SnowPalette): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0v-65" stroke="#61768b" stroke-width="4"/>
    <rect x="-8" y="-75" width="16" height="20" rx="3" fill="${night ? "#ffe09a" : "#d6c19b"}" stroke="#61768b" stroke-width="3"/>
    <path d="M-12 -76h24" stroke="${p.snow}" stroke-width="5" stroke-linecap="round"/>
    ${night ? '<circle cy="-65" r="21" fill="#ffdc91" opacity=".14" filter="url(#soft)"/>' : ""}
  </g>`;
}

export function rock(x: number, y: number, s: number, p: SnowPalette): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-18 0L-13 -12Q0 -23 14 -11L21 0Z" fill="${p.shade}"/>
    <path d="M-15 -9Q0 -26 17 -7Q4 -11 -4 -6Z" fill="${p.snow}"/>
  </g>`;
}
