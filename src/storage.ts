import { tasks, taskMap } from './charset';
import type { Project, Ink } from './types';
export const MAX_BACKUP_BYTES=12*1024*1024;
export const completed=(p:Project)=>tasks.filter(t=>p.glyphs[t.id]?.strokes.length).length;
export const createProject=(name:string):Project=>({schemaVersion:1,id:crypto.randomUUID(),name:name.trim(),createdAt:Date.now(),updatedAt:Date.now(),revision:0,glyphs:{},spacing:30});
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('my-handwriting',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('다른 탭을 닫고 다시 시도해 주세요.'));});}
export async function listProjects():Promise<Project[]>{const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('projects','readonly');const r=t.objectStore('projects').getAll();t.oncomplete=()=>{d.close();resolve(r.result.sort((a:Project,b:Project)=>b.updatedAt-a.updatedAt));};t.onerror=()=>{d.close();reject(t.error);};});}
export class ConflictError extends Error {}
export async function saveProject(p:Project,expected:number){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction('projects','readwrite');const s=t.objectStore('projects');let conflict=false;const r=s.get(p.id);r.onsuccess=()=>{if(r.result && r.result.revision!==expected){conflict=true;t.abort();}else{s.put(p);}};t.oncomplete=()=>{d.close();resolve();};t.onabort=t.onerror=()=>{d.close();reject(conflict?new ConflictError('다른 탭에서 수정되었습니다.'):t.error);};});}
export async function deleteProject(id:string){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction('projects','readwrite');t.objectStore('projects').delete(id);t.oncomplete=()=>{d.close();resolve();};t.onerror=()=>{d.close();reject(t.error);};});}
const finite=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validateBackup(raw:unknown):Project {
 const fail=()=>{throw new Error('올바른 백업 파일이 아닙니다. 원본 파일을 확인해 주세요.');};
 if(!raw||typeof raw!=='object')return fail();const p=raw as Project;
 if(p.schemaVersion!==1||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||!p.glyphs||typeof p.glyphs!=='object'||Array.isArray(p.glyphs)||!finite(p.spacing,0,120))return fail();
 const glyphs:Record<string,Ink>={};let points=0;
 for(const [id,g] of Object.entries(p.glyphs)){
  if(!taskMap.has(id)||!g||!Array.isArray(g.strokes)||g.strokes.length>120||!finite(g.dx,-.15,.15)||!finite(g.dy,-.15,.15)||!finite(g.scale,.6,1.2))return fail();
  for(const s of g.strokes){if(!s||!finite(s.width,2,24)||!Array.isArray(s.points)||s.points.length<1||s.points.length>2000)return fail();for(const point of s.points){if(!Array.isArray(point)||point.length!==2||!finite(point[0],0,500)||!finite(point[1],0,500))return fail();}points+=s.points.length;}
  if(points>200000)return fail();glyphs[id]={strokes:g.strokes.map(s=>({width:s.width,points:s.points.map(p=>[p[0],p[1]])})),dx:g.dx,dy:g.dy,scale:g.scale};
 }
 return {...createProject(p.name),glyphs,spacing:p.spacing};
}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export const filename=(name:string)=>name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,40)||'my-font';
