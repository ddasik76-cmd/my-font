import {describe,it,expect} from 'vitest';
import * as ot from 'opentype.js';
import {guideFor,LATIN_LINES,vowelLayout} from './guides';
import {tasks} from './charset';
import {createProject,validateBackup} from './storage';
import {buildFont} from './font';
describe('글자별 위치 가이드',()=>{
 it('161개 모든 입력에 유효한 영역과 안내를 제공한다',()=>{for(const t of tasks){const g=guideFor(t.group,t.char);expect(g.top).toBeGreaterThanOrEqual(0);expect(g.bottom).toBeLessThanOrEqual(500);expect(g.bottom).toBeGreaterThan(g.top);expect(g.right).toBeGreaterThan(g.left);expect(g.hint.length).toBeGreaterThan(10);}});
 it('대문자·소문자·아랫꼬리·숫자·기호 위치를 구별한다',()=>{expect(guideFor('english','A').top).toBe(80);expect(guideFor('english','a').top).toBe(220);expect(guideFor('english','g').bottom).toBe(470);expect(guideFor('number','1').bottom).toBe(400);expect(guideFor('symbol','.').top).toBe(370);expect(guideFor('symbol',',').bottom).toBeGreaterThan(400);expect(guideFor('symbol',"'").bottom).toBeLessThan(220);});
 it('모음 21개를 모두 올바른 배치 유형으로 안내한다',()=>{expect(Array.from({length:21},(_,i)=>vowelLayout(i))).toEqual(['vertical','vertical','vertical','vertical','vertical','vertical','vertical','vertical','horizontal','compound','compound','compound','horizontal','horizontal','compound','compound','compound','horizontal','horizontal','compound','vertical']);});
 it('OTF에서 영어 기준선은 0, 꼬리는 음수이며 원본 백업은 그대로다',()=>{
  const p=createProject('기준선 확인');const chars=['A','a','g','1','.',','];
  for(const char of chars){const t=tasks.find(t=>t.char===char)!;const g=guideFor(t.group,char);p.glyphs[t.id]={dx:0,dy:0,scale:1,strokes:[{width:4,points:[[100,g.top],[100,g.bottom]]}]};}
  const before=JSON.stringify(p);const font=ot.parse(buildFont(p,chars).buffer);
  for(const char of chars){const t=tasks.find(t=>t.char===char)!;const g=guideFor(t.group,char);const b=font.charToGlyph(char).getBoundingBox();expect(Math.abs(b.y1-((LATIN_LINES.baseline-g.bottom)*1.8-3.6))).toBeLessThan(2);expect(Math.abs(b.y2-((LATIN_LINES.baseline-g.top)*1.8+3.6))).toBeLessThan(2);}
  expect(JSON.stringify(p)).toBe(before);expect(validateBackup(JSON.parse(before)).glyphs).toEqual(p.glyphs);
 });
 it('미작성 글자에 가이드 예시가 출력되지 않는다',()=>{const p=createProject('빈 입력');const {codes}=buildFont(p,['A','가',' ']);expect(codes).toEqual([32]);});
});
