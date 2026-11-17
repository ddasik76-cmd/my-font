import { buildFont } from './font';
import { completed } from './storage';
import type { Project } from './types';
self.onmessage=(event:MessageEvent<{project:Project;chars?:string[]}>)=>{
 try{const {project,chars}=event.data;if(!chars&&completed(project)!==161)throw new Error('161개 입력을 먼저 완료해 주세요.');
 const result=buildFont(project,chars,n=>self.postMessage({type:'progress',value:n}));
 self.postMessage({type:'done',...result},{transfer:[result.buffer]});
 }catch(error){self.postMessage({type:'error',message:error instanceof Error?error.message:'폰트 생성에 실패했습니다.'});}
};
