import { LATIN_LINES, type Guide } from '../guides';
import {useLayoutEffect,useRef,useState} from 'react';
export function WritingGuide({guide,char,trace}:{guide:Guide;char:string;trace:boolean}){
 const sample=useRef<SVGTextElement>(null),[transform,setTransform]=useState('scale(0)');
 useLayoutEffect(()=>{if(!sample.current)return;const ctx=document.createElement('canvas').getContext('2d')!;ctx.font='100px '+getComputedStyle(sample.current).fontFamily;const m=ctx.measureText(char);const b={x:-m.actualBoundingBoxLeft,y:-m.actualBoundingBoxAscent,width:m.actualBoundingBoxLeft+m.actualBoundingBoxRight,height:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent};if(!b.width||!b.height)return;const scale=Math.min((guide.right-guide.left)/b.width,(guide.bottom-guide.top)/b.height);const x=guide.kind==='hangul'?(guide.left+guide.right-b.width*scale)/2:guide.left;setTransform(`translate(${x-b.x*scale} ${guide.top-b.y*scale}) scale(${scale})`);},[char,trace,guide.kind,guide.top,guide.bottom,guide.left,guide.right]);
 const labels=[['윗선',LATIN_LINES.top],['소문자 윗선',LATIN_LINES.xHeight],['기준선',LATIN_LINES.baseline],['아래선',LATIN_LINES.bottom]] as const;
 return <svg className="writing-guide" viewBox="0 0 500 500" aria-hidden="true" data-testid="writing-guide">
 <rect x={guide.left} y={guide.top} width={guide.right-guide.left} height={guide.bottom-guide.top} className="guide-zone"/>
 {guide.kind==='hangul'?<><path d="M250 70V430M70 250H430" className="guide-line"/><rect x="70" y="70" width="360" height="360" className="guide-outline"/></>:<>{labels.map(([label,y])=><g key={label}><path d={`M25 ${y}H475`} className={label==='기준선'?'guide-line baseline':'guide-line'}/><text x="28" y={y-8} className="guide-label">{label}</text></g>)}<path d="M80 65V480M420 65V480" className="guide-line"/><text x="85" y="58" className="guide-label">시작선</text><text x="365" y="58" className="guide-label">권장 여백</text></>}
 {trace&&<text ref={sample} x="0" y="0" fontSize="100" transform={transform} className="trace-glyph">{char}</text>}
 </svg>;
}

