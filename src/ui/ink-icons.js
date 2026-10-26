const shapes={empty:'<path d="M10 16h12"/>',eye:'<path d="M3 16c7-12 19-12 26 0-7 12-19 12-26 0Z"/><circle cx="16" cy="16" r="5"/>',spike:'<path d="m16 3-5 25 5-4 5 4Z"/>',scroll:'<path d="M7 4h18v23H7m0-23c-5 0-5 6 0 6h18M7 22c-5 0-5 6 0 6h18"/>',absorb:'<path d="M7 5h6v13a3 3 0 0 0 6 0V5h6v13a9 9 0 0 1-18 0ZM7 10h6m6 0h6"/>',reflect:'<path d="M16 4 5 8v8c0 5 5 10 11 13 6-3 11-8 11-13V8Z"/><path d="M22 16H11l4-4m-4 4 4 4"/>',
 haste:'<path d="M14 6h7v9l6 5v5H10v-7l4-5ZM4 13h6m-7 8h4m5 0h13"/>',
 tempo:'<path d="M8 9c-4 4-4 7-1 8 3 1 5-2 1-8ZM17 6c-4 4-4 7-1 8 3 1 5-2 1-8ZM24 13c-4 4-4 7-1 8 3 1 5-2 1-8ZM5 24h11"/>',
 power:'<path d="m16 4-3 9-8 3 8 3 3 9 3-9 8-3-8-3Z"/><path d="m5 5 3 3m17 17 2 2"/>',
 magnet:'<path d="M7 5h6v13a3 3 0 0 0 6 0V5h6v13a9 9 0 0 1-18 0ZM7 10h6m6 0h6"/>',
 thrift:'<path d="M16 4c-4 6-10 11-10 16a10 10 0 0 0 20 0c0-5-6-10-10-16Z"/><path d="M11 20h10"/>',
 ward:'<path d="M16 4 6 8v8c0 6 5 10 10 13 5-3 10-7 10-13V8Z"/><path d="M11 16c2-4 8-4 10 0-2 4-8 4-10 0Z"/>',
 surge:'<path d="M4 22c5-6 8 5 13 0s8-2 11-2M5 27c4-4 8 3 13 0M16 4c-5 6-6 10-2 12 5 2 9-4 2-12Z"/>',
 dash:'<path d="M14 6h7v9l6 5v5H10v-7l4-5ZM4 11h6M2 17h6m-4 7h3m4-3h14"/>',
 veil:'<path stroke-dasharray="2.5 3" d="M6 23c-7-6-1-13 5-12 0-9 14-10 15-1 8 4 3 15-4 15H8"/><path d="M11 19c5-8 8 7 12-2"/>',
 refill:'<path d="M16 4c-5 7-11 12-11 17a11 9 0 0 0 22 0c0-5-6-10-11-17Z"/><path d="M11 20h10m-5-5v10"/>',
 wardRefill:'<path d="M16 4 6 8v8c0 6 5 10 10 13 5-3 10-7 10-13V8ZM11 16h10m-5-5v10"/>',
 clarity:'<path d="M8 11a10 10 0 1 1-1 10M4 7l4 5 5-3"/>'};
export function inkIcon(id){return '<svg class="ink-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[id]||shapes.refill)+'</svg>';}
