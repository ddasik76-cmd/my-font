import {useState} from 'react';
import {initials,medials,finals} from '../charset';
import {vowelLayout} from '../guides';
export function CompositionGuide({group,index}:{group:string;index:number}){
 const [layout,setLayout]=useState<'vertical'|'horizontal'|'compound'>('vertical');
 if(!['initial','medial','final'].includes(group))return null;
 const active=group==='medial'?vowelLayout(index):layout;
 const m=group==='medial'?index:active==='vertical'?0:active==='horizontal'?8:9;
 const l=group==='initial'?index:0,t=group==='final'?index+1:4;
 const sample=String.fromCharCode(0xac00+(l*21+m)*28+t);
 const boxes=active==='vertical'?[[10,10,40,58],[54,10,36,58],[15,74,70,20]]:active==='horizontal'?[[15,8,70,35],[10,48,80,20],[15,74,70,20]]:[[10,8,48,35],[62,8,28,60],[15,74,70,20]];
 const roles=['initial','medial','final'],names=['초성','중성','종성'];
 return <section className="composition-guide" aria-label="한글 조합 위치 안내"><svg viewBox="0 0 100 100" role="img" aria-label={`${sample}에서 ${names[roles.indexOf(group)]} 위치`}>
 {boxes.map(([x,y,w,h],i)=><g key={i} className={roles[i]===group?'map-active':'map-inactive'}><rect x={x} y={y} width={w} height={h} rx="4"/><text x={x+w/2} y={y+h/2} dominantBaseline="central" textAnchor="middle" fontSize={i===2?17:25}>{[initials[l],medials[m],finals[t-1]][i]}</text></g>)}
 {active==='compound'&&<rect x="10" y="48" width="50" height="20" rx="4" className={group==='medial'?'compound-active':'compound-inactive'}/>}
 </svg><div><strong>‘{sample}’ 속 {names[roles.indexOf(group)]} 위치</strong><p>파란 영역에 들어가요. 아래 입력 칸에는 크게 써 주세요.</p>{group!=='medial'&&<div className="map-tabs" aria-label="모음 배치 선택">{(['vertical','horizontal','compound'] as const).map((v,i)=><button key={v} aria-pressed={active===v} onClick={()=>setLayout(v)}>{['세로 모음','가로 모음','복합 모음'][i]}</button>)}</div>}<small>위치 설명용 예시 · 내 손글씨 미리보기와는 달라요</small></div></section>;
}
