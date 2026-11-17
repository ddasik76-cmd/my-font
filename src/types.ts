export type Point = [number, number];
export type Stroke = { points: Point[]; width: number };
export type Ink = { strokes: Stroke[]; dx: number; dy: number; scale: number };
export type Project = { schemaVersion: 1; id: string; name: string; createdAt: number; updatedAt: number; revision: number; glyphs: Record<string, Ink>; spacing: number };
export const emptyInk = (): Ink => ({strokes:[],dx:0,dy:0,scale:1});
