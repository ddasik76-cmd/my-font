import { describe,it,expect } from 'vitest';
import * as ot from 'opentype.js';
import {buildFont,compositionBoxes} from './font';
import {tasks,groups,dependencies,decompose} from './charset';
import {createProject,validateBackup} from './storage';
import type {Project} from './types';
function fixture():Project{const p=createProject('검증용 테스트');for(const t of tasks)p.glyphs[t.id]={strokes:[{width:10,points:[[100,100],[400,100],[400,400]]},{width:10,points:[[100,100],[100,400],[400,400]]}],dx:0,dy:0,scale:1};return p;}
describe('문자 입력과 조합',()=>{
 it('161개만 요구하고 19×21×28의 모든 음절에 입력이 연결된다',()=>{expect(tasks.length).toBe(161);expect(groups.map(g=>g.chars.length)).toEqual([19,21,27,52,10,32]);for(let c=0xac00;c<=0xd7a3;c++){const ids=dependencies(String.fromCharCode(c));expect(ids.length).toBe((c-0xac00)%28===0?2:3);expect(ids.every(id=>tasks.some(t=>t.id===id))).toBe(true);}expect(decompose(0xac00)).toEqual({l:0,m:0,t:0});expect(decompose(0xd7a3)).toEqual({l:18,m:20,t:27});});
 it('각 모음·받침 조합의 배치 상자가 유효하다',()=>{for(let m=0;m<21;m++)for(const t of [true,false]){const boxes=compositionBoxes(m,t);expect(boxes.length).toBe(t?3:2);for(const [x,y,r,b] of boxes){expect(r).toBeGreaterThan(x);expect(b).toBeGreaterThan(y);expect(x).toBeGreaterThanOrEqual(0);expect(b).toBeLessThanOrEqual(500);}}});
});
describe('실제 OTF 생성',()=>{
 it('전체 한글을 쓰고 재파싱해도 Unicode와 윤곽이 보존된다',()=>{const p=fixture();const {buffer,codes}=buildFont(p);expect(new TextDecoder().decode(buffer.slice(0,4))).toBe('OTTO');expect(codes.filter(c=>c>=0xac00&&c<=0xd7a3)).toHaveLength(11172);expect(codes.length).toBe(11318);const font=ot.parse(buffer);for(let code=0xac00;code<=0xd7a3;code++){const glyph=font.charToGlyph(String.fromCharCode(code));expect(glyph.unicode).toBe(code);expect(glyph.path.commands.length).toBeGreaterThan(0);const b=glyph.getBoundingBox();expect(Number.isFinite(b.x1)).toBe(true);expect(b.x1).toBeGreaterThanOrEqual(-200);expect(b.y2).toBeLessThan(1000);}expect(font.charToGlyph(' ').path.commands.length).toBe(0);expect(font.charToGlyph('!').unicode).toBe(33);},30000);
 it('미작성 자모를 가짜 폰트로 채우지 않는다',()=>{const p=fixture();delete p.glyphs['initial-0'];const {buffer,codes}=buildFont(p,['가','나','A','😀']);expect(codes).not.toContain(0xac00);expect(codes).toContain('나'.charCodeAt(0));expect(ot.parse(buffer).charToGlyphIndex('가')).toBe(0);});
 it('작은 기호의 크기를 캔버스와 같은 비율로 유지한다',()=>{const p=fixture();const dot=tasks.find(t=>t.char==='.')!;p.glyphs[dot.id].strokes=[{width:8,points:[[250,400]]}];const font=ot.parse(buildFont(p,['.']).buffer);const b=font.charToGlyph('.').getBoundingBox();expect(b.x2-b.x1).toBeLessThan(30);});
});
describe('백업 보호',()=>{
 it('백업 왕복 시 필기와 설정을 유지하고 새 ID를 만든다',()=>{const p=fixture();p.spacing=60;const restored=validateBackup(JSON.parse(JSON.stringify(p)));expect(restored.glyphs).toEqual(p.glyphs);expect(restored.spacing).toBe(60);expect(restored.id).not.toBe(p.id);});
 it('미지원 버전·손상 좌표·모르는 키·과대 입력을 거부한다',()=>{for(const alter of [(p:any)=>p.schemaVersion=2,(p:any)=>p.glyphs['initial-0'].strokes[0].points[0]=[NaN,1],(p:any)=>p.glyphs['unknown']=p.glyphs['initial-0'],(p:any)=>p.glyphs['initial-0'].strokes[0].points=Array(2001).fill([1,1])]){const p=fixture();alter(p);expect(()=>validateBackup(p)).toThrow();}});
});

// Read the encoded OTF, not the layout helper, to catch width changes anywhere
// in the placement / outline / serialization pipeline.
function widthsAtY(path:ot.Path,y:number){
 const crossings:number[]=[];let first:[number,number]|undefined,last:[number,number]|undefined;
 const edge=(a:[number,number],b:[number,number])=>{if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))crossings.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));};
 for(const c of path.commands){if(c.type==='M'){first=[c.x,c.y];last=first;}else if(c.type==='L'){const next:[number,number]=[c.x,c.y];if(last)edge(last,next);last=next;}else if(c.type==='Z'&&first&&last)edge(last,first);}
 crossings.sort((a,b)=>a-b);const widths:number[]=[];for(let i=0;i+1<crossings.length;i+=2)widths.push(crossings[i+1]-crossings[i]);return widths;
}
describe('자모 배치 후 획 굵기 유지',()=>{
 it('ㅣ·ㅡ는 펜 굵기와 모양 크기에 관계없이 칸 전체로 부풀지 않는다',()=>{
  for(const width of [2,9,24])for(const scale of [.6,1,1.2]){
   const p=createProject('좁은 자모 검증');
   p.glyphs['medial-20']={strokes:[{width,points:[[250,80],[250,420]]}],dx:0,dy:0,scale};
   p.glyphs['medial-18']={strokes:[{width,points:[[80,250],[420,250]]}],dx:0,dy:0,scale};
   const font=ot.parse(buildFont(p,['ㅣ','ㅡ']).buffer);
   const vertical=font.charToGlyph('ㅣ').getBoundingBox(),horizontal=font.charToGlyph('ㅡ').getBoundingBox();
   expect(Math.abs(vertical.x2-vertical.x1-width*1.8)).toBeLessThan(2);
   expect(Math.abs(horizontal.y2-horizontal.y1-width*1.8)).toBeLessThan(2);
  }
 });
 it('기울어진 ㅣ의 작은 가로 폭을 보존한다',()=>{
  const p=createProject('기울기 검증');p.glyphs['medial-20']={strokes:[{width:2,points:[[240,80],[260,420]]}],dx:0,dy:0,scale:1};
  const b=ot.parse(buildFont(p,['ㅣ']).buffer).charToGlyph('ㅣ').getBoundingBox();
  expect(b.x2-b.x1).toBeLessThan(55);expect(b.y2-b.y1).toBeGreaterThan(700);
 });
 it('ㅇ과 ㅣ의 같은 굵기가 받침 유무와 관계없이 유지된다',()=>{
  const p=fixture();p.glyphs['initial-11'].strokes=[{width:10,points:Array.from({length:65},(_,i)=>[250+140*Math.cos(i*Math.PI/32),250+160*Math.sin(i*Math.PI/32)])}];
  p.glyphs['medial-20'].strokes=[{width:10,points:[[250,80],[250,420]]}];
  const original=JSON.stringify(p);const font=ot.parse(buildFont(p,['이','익']).buffer);
  for(const char of ['이','익']){const box=compositionBoxes(20,char==='익')[1];const widths=widthsAtY(font.charToGlyph(char).path,800-(box[1]+box[3])/2*1.8);expect(widths).toHaveLength(3);for(const w of widths)expect(Math.abs(w-18)).toBeLessThan(2);}
  expect(JSON.stringify(p)).toBe(original);
 });
 it('사용자가 다르게 정한 펜 굵기는 유지한다',()=>{
  const p=fixture();p.glyphs['initial-11'].strokes=[{width:4,points:Array.from({length:65},(_,i)=>[250+140*Math.cos(i*Math.PI/32),250+160*Math.sin(i*Math.PI/32)])}];
  p.glyphs['medial-20'].strokes=[{width:12,points:[[250,80],[250,420]]}];
  const glyph=ot.parse(buildFont(p,['이']).buffer).charToGlyph('이');const box=compositionBoxes(20,false)[1];const widths=widthsAtY(glyph.path,800-(box[1]+box[3])/2*1.8);
  expect(widths).toHaveLength(3);expect(Math.abs(widths[0]-7.2)).toBeLessThan(2);expect(Math.abs(widths[1]-7.2)).toBeLessThan(2);expect(Math.abs(widths[2]-21.6)).toBeLessThan(2);
 });
});

