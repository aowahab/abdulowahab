const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function resizeAnnotation(mark,handle,dx,dy,{shiftKey=false}={}){
 let left=mark.x,right=mark.x+mark.w,top=mark.y,bottom=mark.y+mark.h;
 const min=mark.type==='text'?.004:.002;
 if(handle.includes('w'))left=clamp(left+dx,0,right-min);
 if(handle.includes('e'))right=clamp(right+dx,left+min,1);
 if(handle.includes('n'))top=clamp(top+dy,0,bottom-min);
 if(handle.includes('s'))bottom=clamp(bottom+dy,top+min,1);
 if(mark.type==='text'||shiftKey){
  const sx=(right-left)/mark.w,sy=(bottom-top)/mark.h;
  let scale=handle==='n'||handle==='s'?sy:handle==='e'||handle==='w'?sx:Math.abs(sx-1)>Math.abs(sy-1)?sx:sy;
  if(mark.type==='text')scale=clamp(scale,6/mark.size,100/mark.size);
  const anchorX=handle.includes('w')?mark.x+mark.w:mark.x,anchorY=handle.includes('n')?mark.y+mark.h:mark.y;
  scale=Math.max(.01,Math.min(scale,(handle.includes('w')?anchorX:1-anchorX)/mark.w,(handle.includes('n')?anchorY:1-anchorY)/mark.h));
  const w=mark.w*scale,h=mark.h*scale;
  return{...mark,x:handle.includes('w')?anchorX-w:anchorX,y:handle.includes('n')?anchorY-h:anchorY,w,h,...(mark.type==='text'?{size:mark.size*scale}:{})};
 }
 return{...mark,x:left,y:top,w:right-left,h:bottom-top};
}
export function setAnnotationFont(mark,value){const size=clamp(Number(value)||6,6,100);return resizeAnnotation(mark,'se',mark.w*(size/mark.size-1),mark.h*(size/mark.size-1))}
export function shapePoints(mark){
 if(mark.type==='ink')return mark.points;
 if(mark.type==='ellipse')return Array.from({length:65},(_,i)=>({x:.5+.49*Math.cos(i/64*Math.PI*2),y:.5+.49*Math.sin(i/64*Math.PI*2)}));
 if(mark.type==='arrow')return[{x:.05,y:.95},{x:.95,y:.05},{x:.65,y:.05},{x:.95,y:.05},{x:.95,y:.35}].map(p=>({x:mark.flipX?1-p.x:p.x,y:mark.flipY?1-p.y:p.y}));
 return[{x:0,y:mark.type==='underline'?1:.5},{x:1,y:mark.type==='underline'?1:.5}];
}
