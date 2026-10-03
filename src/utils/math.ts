export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, n: number) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
