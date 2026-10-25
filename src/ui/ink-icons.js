const shapes={
 haste:'<path d="M8 18c-3 2-3 6 0 7 3 1 5-2 5-5M17 7c-3 1-4 5-2 7 3 2 6-1 6-4M6 12l4-2M20 21l5-2"/>',
 tempo:'<path d="M8 9c-4 4-4 7-1 8 3 1 5-2 1-8ZM17 6c-4 4-4 7-1 8 3 1 5-2 1-8ZM24 13c-4 4-4 7-1 8 3 1 5-2 1-8ZM5 24h11"/>',
 power:'<path d="m16 4-3 9-8 3 8 3 3 9 3-9 8-3-8-3Z"/><path d="m5 5 3 3m17 17 2 2"/>',
 magnet:'<path d="M10 14v5a6 6 0 0 0 12 0v-5M10 13h4m4 0h4M16 6v4M5 8l4 3m18-3-4 3"/><circle cx="5" cy="5" r="1"/><circle cx="27" cy="5" r="1"/>',
 thrift:'<path d="M16 4c-4 6-10 11-10 16a10 10 0 0 0 20 0c0-5-6-10-10-16Z"/><path d="M11 20h10"/>',
 ward:'<path d="M16 4 6 8v8c0 6 5 10 10 13 5-3 10-7 10-13V8Z"/><path d="M11 16c2-4 8-4 10 0-2 4-8 4-10 0Z"/>',
 surge:'<path d="M4 22c5-6 8 5 13 0s8-2 11-2M5 27c4-4 8 3 13 0M16 4c-5 6-6 10-2 12 5 2 9-4 2-12Z"/>',
 dash:'<path d="M6 10h8m-10 6h8m-6 6h6M22 6c-6 4-7 8-3 9 4 1 7-3 3-9ZM20 21l7-2m-9 7 7-1"/>',
 veil:'<path stroke-dasharray="2.5 3" d="M6 23c-7-6-1-13 5-12 0-9 14-10 15-1 8 4 3 15-4 15H8"/><path d="M11 19c5-8 8 7 12-2"/>',
 refill:'<path d="M16 4c-5 7-11 12-11 17a11 9 0 0 0 22 0c0-5-6-10-11-17Z"/><path d="M11 20h10m-5-5v10"/>',
 wardRefill:'<path d="M16 4 6 8v8c0 6 5 10 10 13 5-3 10-7 10-13V8ZM11 16h10m-5-5v10"/>',
 clarity:'<path d="M8 11a10 10 0 1 1-1 10M4 7l4 5 5-3"/>'};
export function inkIcon(id){return '<svg class="ink-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[id]||shapes.refill)+'</svg>';}
