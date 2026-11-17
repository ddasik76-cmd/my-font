import * as ot from 'opentype.js';
import { getStroke } from 'perfect-freehand';
import polygonClipping from 'polygon-clipping';
import type { MultiPolygon, Pair } from 'polygon-clipping';
import { tasks, dependencies, decompose } from './charset';
import type { Project, Stroke, Ink, Point } from './types';
import {LATIN_LINES} from './guides';

export function outline(stroke:Stroke):number[][]{return getStroke(stroke.points,{size:stroke.width,thinning:0,smoothing:.5,streamline:.25,simulatePressure:false,last:true});}
export function svgStroke(stroke:Stroke){return outline(stroke).map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')+' Z';}
type Box=[number,number,number,number];
type Shape={bounds:Box;ink:Ink;placements:Map<string,MultiPolygon>};
export function compositionBoxes(m:number,hasFinal:boolean):Box[]{
 const bottom=hasFinal?330:440;
 const vertical=m<=7||m===20;
 const horizontal=[8,12,13,17,18].includes(m);
 const boxes:Box[]=vertical?[[45,50,220,bottom],[255,50,455,bottom]]:
 horizontal?[[85,40,415,hasFinal?205:280],[45,hasFinal?225:305,455,bottom]]:
 [[55,45,285,hasFinal?210:290],[65,hasFinal?225:310,455,bottom]];
 // Compound vowels keep their written L-shaped silhouette around the initial.
 if(hasFinal)boxes.push([85,365,415,455]);
 return boxes;
}
function shape(ink:Ink):Shape {
 // Measure the centreline, not the thick outline. A vertical stroke must not
 // acquire a larger layout scale just because its pen width is small.
 const bounds:Box=[Infinity,Infinity,-Infinity,-Infinity];
 for(const stroke of ink.strokes)for(const [x,y] of stroke.points){
  bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);
  bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);
 }
 return {bounds,ink,placements:new Map()};
}
function addShape(path:ot.Path,s:Shape,box:Box,normalize:boolean,compound=false,hasFinal=false){
 const target:Box=compound?[65,45,455,hasFinal?330:440]:box;
 const key=`${normalize}:${target.join(',')}`;
 let polys=s.placements.get(key);
 if(!polys){
  const [minX,minY,maxX,maxY]=normalize?s.bounds:[0,0,500,500];
  // Centre in a square frame based on the longest centreline extent. This
  // retains the narrow shape of ㅣ/ㅡ, including a slightly slanted stroke.
  const span=Math.max(1,maxX-minX,maxY-minY);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const placed=s.ink.strokes.map(stroke=>({
   width:stroke.width,
   points:stroke.points.map(([px,py]):Point=>{
    const x=.5+(px-cx)/span*s.ink.scale+s.ink.dx;
    const y=.5+(py-cy)/span*s.ink.scale+s.ink.dy;
    return [target[0]+x*(target[2]-target[0]),target[1]+y*(target[3]-target[1])];
   })
  }));
  // Apply pen width only AFTER placement. Neither the slot aspect ratio nor
  // the user's shape scale is allowed to stretch the stroke thickness.
  const polygons=placed.map(stroke=>[outline(stroke) as Pair[]]).filter(p=>p[0].length>=3);
  polys=polygons.length?polygonClipping.union(polygons[0],...polygons.slice(1)):[];
  s.placements.set(key,polys);
 }
 for(const poly of polys)for(const ring of poly){
  ring.forEach(([px,py],i)=>{
   const fx=Math.round(px*1.8+50),fy=Math.round((normalize?800:LATIN_LINES.baseline*1.8)-py*1.8);
   if(i===0)path.moveTo(fx,fy);else path.lineTo(fx,fy);
  });path.close();
 }
}
export function buildFont(project:Project,chars?:string[],progress?:(n:number)=>void):{buffer:ArrayBuffer;codes:number[]} {
 const cache=new Map<string,Shape>();
 for(const task of tasks){const ink=project.glyphs[task.id];if(ink?.strokes.length)cache.set(task.id,shape(ink));}
 const codes=chars?[...new Set(chars.join('').normalize('NFC').split('').map(c=>c.charCodeAt(0)))]:[
 ...Array.from({length:11172},(_,i)=>0xac00+i),...Array.from({length:95},(_,i)=>32+i),...Array.from({length:51},(_,i)=>0x3131+i)];
 const missing=new ot.Path();missing.moveTo(100,0);missing.lineTo(100,700);missing.lineTo(500,700);missing.lineTo(500,0);missing.close();missing.moveTo(150,50);missing.lineTo(450,50);missing.lineTo(450,650);missing.lineTo(150,650);missing.close();
 const glyphs=[new ot.Glyph({name:'.notdef',advanceWidth:650,path:missing})];const included:number[]=[];
 for(let i=0;i<codes.length;i++){
  const code=codes[i],char=String.fromCharCode(code),ids=dependencies(char);const path=new ot.Path();
  if(code!==32&&(!ids.length||ids.some(id=>!cache.has(id))))continue;
  if(code>=0xac00&&code<=0xd7a3){const {m,t}=decompose(code),boxes=compositionBoxes(m,!!t);ids.forEach((id,j)=>addShape(path,cache.get(id)!,boxes[j],true,j===1&&![0,1,2,3,4,5,6,7,8,12,13,17,18,20].includes(m),!!t));}
  else if(code!==32){addShape(path,cache.get(ids[0])!,code>=0x3131?[40,30,460,460]:[40,0,460,500],code>=0x3131);}
  glyphs.push(new ot.Glyph({name:code===32?'space':`uni${code.toString(16).toUpperCase()}`,unicode:code,advanceWidth:code===32?360:1000+project.spacing,path}));included.push(code);
  if(i%200===0)progress?.(Math.round(i/codes.length*85));
 }
 const options={familyName:project.name,styleName:'Regular',unitsPerEm:1000,ascender:950,descender:-250,glyphs,postScriptName:'MyWriting-'+project.id.replace(/[^a-z0-9]/gi,'').slice(0,20)+'-Regular'}; const font=new ot.Font(options);
 // Stable ASCII PostScript identifier, while the family name keeps the user's Korean name.
 progress?.(90);const buffer=font.toArrayBuffer();const parsed=ot.parse(buffer);
 for(const code of included){if(!parsed.charToGlyphIndex(String.fromCharCode(code)))throw new Error('폰트 문자 검증에 실패했습니다.');}
 progress?.(100);return {buffer,codes:included};
}

