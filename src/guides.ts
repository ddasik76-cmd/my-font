export const LATIN_LINES = { top:80, xHeight:220, baseline:400, bottom:470, start:80, end:420 } as const;
export type Guide = { kind:'hangul'|'latin'; top:number; bottom:number; left:number; right:number; hint:string; traceY:number; traceSize:number };
export function guideFor(group:string,char:string):Guide {
 if(['initial','medial','final'].includes(group))return {kind:'hangul',top:70,bottom:430,left:70,right:430,hint:group==='final'?'받침 모양을 크게 쓰세요. 아래쪽에는 자동으로 배치돼요.':'자모를 크게 쓰세요. 완성 글자의 위치는 조합 지도를 참고하세요.',traceY:410,traceSize:350};
 let top:number=LATIN_LINES.top,bottom:number=LATIN_LINES.baseline;
 let hint='윗선부터 기준선까지 쓰세요. 글자 폭은 자연스럽게 유지하세요.';
 if(group==='english'&&/[a-z]/.test(char)){
  if(!'bdfhklt'.includes(char))top=LATIN_LINES.xHeight;
  if('gjpqy'.includes(char))bottom=LATIN_LINES.bottom;
  hint=bottom===LATIN_LINES.bottom?'몸통은 소문자 윗선부터, 꼬리는 아래선까지 내려 써 주세요.':top===LATIN_LINES.xHeight?'소문자 윗선과 기준선 사이에 써 주세요.':'윗선까지 올라오는 부분과 소문자 몸통을 구분해 써 주세요.';
 }
 if(group==='symbol'){
  if('.,;:'.includes(char)){top=char==='.'||char===','?370:250;bottom=',;'.includes(char)?450:400;hint='점은 기준선 가까이에, 쉼표의 꼬리는 기준선 아래에 써 주세요.';}
  else if("'\"`^".includes(char)){top=90;bottom=170;hint='위쪽에 작게 쓰는 기호예요.';}
  else if('_'.includes(char)){top=420;bottom=440;hint='기준선 아래에 가로선을 그어 주세요.';}
  else if('-=+~*<>'.includes(char)){top=240;bottom=320;hint='소문자 몸통의 가운데 높이에 써 주세요.';}
  else if('()[]{}|/\\'.includes(char)){top=80;bottom=440;hint='윗선부터 기준선 아래까지 길게 써 주세요.';}
  else hint='윗선과 기준선 사이에서 기호의 균형을 맞춰 주세요.';
 }
 const narrow=group==='symbol'&&'.,;:\'"`'.includes(char);
 return {kind:'latin',top,bottom,left:80,right:narrow?150:420,hint,traceY:400,traceSize:440};
}
export function vowelLayout(index:number):'vertical'|'horizontal'|'compound'{return index<=7||index===20?'vertical':[8,12,13,17,18].includes(index)?'horizontal':'compound';}
