export const initials = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
export const medials = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
export const finals = [...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const ascii = Array.from({length:94},(_,i)=>String.fromCharCode(i+33));
export const groups = [
 {id:'initial', name:'초성', hint:'글자의 첫 소리', chars:initials},
 {id:'medial', name:'중성', hint:'글자의 모음', chars:medials},
 {id:'final', name:'종성', hint:'글자의 받침', chars:finals},
 {id:'english', name:'영문', hint:'대문자와 소문자', chars:[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz']},
 {id:'number', name:'숫자', hint:'0부터 9까지', chars:[...'0123456789']},
 {id:'symbol', name:'기호', hint:'문장에 필요한 기본 기호', chars:ascii.filter(c=>!/[A-Za-z0-9]/.test(c))}
];
export const tasks = groups.flatMap(g=>g.chars.map((char,index)=>({id:`${g.id}-${index}`,char,group:g.id,label:g.name,index})));
export const taskMap = new Map(tasks.map(t=>[t.id,t]));
export function decompose(code:number) { const n=code-0xac00; return {l:Math.floor(n/588),m:Math.floor(n/28)%21,t:n%28}; }
export function dependencies(char:string):string[] {
 const code=char.codePointAt(0)!;
 if(code>=0xac00 && code<=0xd7a3){const {l,m,t}=decompose(code);return [`initial-${l}`,`medial-${m}`,...(t?[`final-${t-1}`]:[])];}
 const task=tasks.find(t=>t.char===char);return task?[task.id]:[];
}
export function supported(char:string){return /\s/.test(char)||dependencies(char).length>0;}
