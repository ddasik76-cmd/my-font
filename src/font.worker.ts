import { buildFont } from './font';
import { completed } from './storage';
import type { Project } from './types';
self.onmessage=async (event:MessageEvent<{project:Project;chars?:string[];format?:'otf'|'ttf'|'both'}>)=>{
 try{const {project,chars}=event.data;if(!chars&&completed(project)!==161)throw new Error('161개 입력을 먼저 완료해 주세요.');
 const format=event.data.format||'otf';
 const result=buildFont(project,chars,n=>self.postMessage({type:'progress',value:n,format}));
 if(format==='ttf'||format==='both'){
  self.postMessage({type:'progress',value:92,format:'ttf'});
  const {convertOtfToTtf}=await import('./ttf');
  const ttfBuffer=convertOtfToTtf(result.buffer,result.codes);
  self.postMessage({type:'progress',value:98,format:'ttf'});
  if(format==='both')self.postMessage({type:'done',...result,format,ttfBuffer},{transfer:[result.buffer,ttfBuffer]});
  else self.postMessage({type:'done',buffer:ttfBuffer,codes:result.codes,format},{transfer:[ttfBuffer]});
 }else self.postMessage({type:'done',...result,format},{transfer:[result.buffer]});
 }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'폰트 생성에 실패했습니다.'});}
};
