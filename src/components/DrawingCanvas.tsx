import { useEffect,useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Stroke,Point } from '../types';
import { outline } from '../font';
import {WritingGuide} from './WritingGuide';
import type {Guide} from '../guides';
export function DrawingCanvas({strokes,width,guides,guide,trace,onChange,label}:{strokes:Stroke[];width:number;guides:boolean;guide:Guide;trace:boolean;onChange:(s:Stroke[])=>void;label:string}){
 const ref=useRef<HTMLCanvasElement>(null),active=useRef<{id:number;stroke:Stroke}|null>(null);const latest=useRef({strokes,onChange});latest.current={strokes,onChange};
 function paint(){const c=ref.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.setTransform(c.width/500,0,0,c.height/500,0,0);ctx.clearRect(0,0,500,500);ctx.fillStyle='#20253b';
 for(const s of [...latest.current.strokes,...(active.current?[active.current.stroke]:[])]){const pts=outline(s);if(!pts.length)continue;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fill();}}
 useEffect(()=>{const c=ref.current!;const resize=()=>{const size=c.getBoundingClientRect().width;c.width=size*devicePixelRatio;c.height=size*devicePixelRatio;paint();};const o=new ResizeObserver(resize);o.observe(c);resize();return()=>o.disconnect();},[]);
 useEffect(paint,[strokes]);
 useEffect(()=>{const flush=()=>{if(active.current){const s=active.current.stroke;active.current=null;latest.current.onChange([...latest.current.strokes,s]);}};window.addEventListener('blur',flush);return()=>{flush();window.removeEventListener('blur',flush);};},[]);
 function point(e:{clientX:number;clientY:number}):Point{const r=ref.current!.getBoundingClientRect();return [Math.max(0,Math.min(500,(e.clientX-r.left)/r.width*500)),Math.max(0,Math.min(500,(e.clientY-r.top)/r.height*500))];}
 function start(e:ReactPointerEvent<HTMLCanvasElement>){if(active.current||e.button!==0||strokes.length>=120)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);active.current={id:e.pointerId,stroke:{width,points:[point(e)]}};paint();}
 function move(e:ReactPointerEvent<HTMLCanvasElement>){const a=active.current;if(!a||a.id!==e.pointerId)return;const samples=e.nativeEvent.getCoalescedEvents?.();for(const ev of samples?.length?samples:[e]){const p=point(ev),last=a.stroke.points.at(-1)!;if(Math.hypot(p[0]-last[0],p[1]-last[1])>1.4&&a.stroke.points.length<2000)a.stroke.points.push(p);}paint();}
 function end(e:ReactPointerEvent<HTMLCanvasElement>){if(active.current?.id!==e.pointerId)return;const s=active.current.stroke;active.current=null;onChange([...strokes,s]);paint();}
 return <div className={`drawing-paper ${guides?'with-guides':''}`}>{guides&&<WritingGuide guide={guide} char={label.split(" ").at(-1)!} trace={trace}/>}<span className="paper-top">{guides?"강조된 영역을 참고해 써 주세요":"이 공간에 자유롭게 써 주세요"}</span><canvas ref={ref} aria-label={`${label} 필기 영역`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/><span className="paper-corner">✧</span></div>;
}

