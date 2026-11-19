import { createFont } from 'fonteditor-core';
import * as ot from 'opentype.js';

export function convertOtfToTtf(source:ArrayBuffer,codes:number[]):ArrayBuffer {
 const converted=createFont(source,{type:'otf'}).write({type:'ttf'}) as Uint8Array;
 const buffer=converted.buffer.slice(converted.byteOffset,converted.byteOffset+converted.byteLength) as ArrayBuffer;
 if(new DataView(buffer).getUint32(0)!==0x00010000)throw new Error('TTF 서명 검증에 실패했습니다.');
 const parsed=ot.parse(buffer);
 if(parsed.outlinesFormat!=='truetype')throw new Error('TrueType 윤곽 검증에 실패했습니다.');
 for(const code of codes)if(!parsed.charToGlyphIndex(String.fromCharCode(code)))throw new Error('TTF 문자 매핑 검증에 실패했습니다.');
 return buffer;
}
