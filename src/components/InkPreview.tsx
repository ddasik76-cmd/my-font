import type { Ink } from '../types';
import { svgStroke } from '../font';
export function InkPreview({ink}:{ink?:Ink}){return <svg viewBox="0 0 500 500" aria-hidden="true">{ink?.strokes.map((s,i)=><path key={i} d={svgStroke(s)} fill="currentColor"/>)}</svg>;}
