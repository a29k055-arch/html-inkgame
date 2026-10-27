export const QUALITY = {
 high: { grid: 640, iterations: 20, simulationHz: 40, renderScale: 2, maxWidth: 1920, maxHeight: 1080, label: '高画質' },
 balanced: { grid: 448, iterations: 14, simulationHz: 30, renderScale: 1.5, maxWidth: 1280, maxHeight: 720, label: 'バランス' },
 performance: { grid: 256, iterations: 8, simulationHz: 24, renderScale: 1, maxWidth: 960, maxHeight: 540, label: '省電力' },
};
export const INK = { velocityDecay: .38, densityDecay: .10, vorticity: 15, radius: .025, force: 420, bodyRadius: .063 };
