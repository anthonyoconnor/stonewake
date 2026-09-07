import {roomLook} from '../content/rooms';
import {DynamicTexture,type Scene} from '@babylonjs/core';

// Small generated material sheets keep visual iteration independent of an asset pipeline.
export function surfaceTexture(scene:Scene,name:string){
  const tex=new DynamicTexture(`${name}-surface`,{width:256,height:256},scene,false);
  const c=tex.getContext() as CanvasRenderingContext2D;let seed=31;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(['raw ground','dirt','gold','rock','bedrock','gem'].includes(name)){
    // Unworked earth has scattered grit and pebbles, without paving joints.
    c.fillStyle='#b4a28b';c.fillRect(0,0,256,256);
    for(let i=0;i<2400;i++){
      c.fillStyle=i%2?'#fff0cd18':'#32271d20';
      c.beginPath();c.ellipse(random()*256,random()*256,1+random()*6,1+random()*3,random()*Math.PI,0,Math.PI*2);c.fill();
    }
    for(let i=0;i<45;i++){
      const x=random()*256,y=random()*256,r=2+random()*4;
      c.fillStyle='#584f43';c.beginPath();c.ellipse(x,y,r,r*.65,.4,0,Math.PI*2);c.fill();
      c.fillStyle='#c4b9a0';c.beginPath();c.ellipse(x-.5,y-1,r*.75,r*.4,.4,0,Math.PI*2);c.fill();
    }
    if(['rock','bedrock','gem'].includes(name))for(let i=0;i<18;i++){
      const x=random()*256,y=random()*256;
      c.strokeStyle='#383a3c88';c.lineWidth=1+random()*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*28-14,y+15);c.lineTo(x+random()*40-20,y+35);c.stroke();
    }
    tex.update();return tex;
  }
  const wood=name.includes('wood'),room=name.startsWith('floor-'),paved=room||name==='hearth stone';
  const base=room?(roomLook(name.slice(6)).floor??'#656963').slice(1):'ffffff';
  const rgb=[0,2,4].map(i=>parseInt(base.slice(i,i+2),16));
  c.fillStyle=room?'#292c2b':'#5b5851';c.fillRect(0,0,256,256);
  const size=wood?64:paved?128:64;
  for(let row=0;row<256/size;row++)for(let col=-1;col<256/size;col++){
    const x=col*size+(paved||wood?0:row%2*32),y=row*size;
    const value=155+Math.floor(random()*45),edge=paved||wood?3:4+random()*5;
    c.fillStyle=room?`rgb(${rgb.map(v=>Math.round(v*value/180)).join(',')})`:`rgb(${value+8},${value+5},${value})`;
    c.beginPath();c.moveTo(x+edge,y+3);c.lineTo(x+size-9,y+2);c.lineTo(x+size-3,y+edge);c.lineTo(x+size-2,y+size-7);c.lineTo(x+size-8,y+size-3);c.lineTo(x+3,y+size-2);c.lineTo(x+2,y+edge);c.closePath();c.fill();
    c.strokeStyle='#ffffff24';c.lineWidth=2;c.stroke();
    if(wood)for(let i=0;i<12;i++){c.strokeStyle='#55442e25';c.beginPath();c.moveTo(x+random()*size,y);c.bezierCurveTo(x+size/2,y+18,x+size/2+6,y+45,x+random()*size,y+size);c.stroke();}
  }
  for(let i=0;i<1500;i++){c.fillStyle=i%2?'#ffffff0c':'#18161015';c.fillRect(random()*256,random()*256,1+random()*3,1+random()*2);}
  if(room){
    const id=name.slice(6),motif=roomLook(id).motif;c.strokeStyle=roomLook(id).trim??'#c0aa77';c.lineWidth=5;
    c.strokeRect(5,5,246,246);for(const x of [8,248])for(const y of [8,248]){c.fillStyle='#f2d799';c.fillRect(x-2,y-2,4,4);}
    c.beginPath();
    if(motif==='treasure'){c.arc(128,128,24,0,Math.PI*2);c.moveTo(128,109);c.lineTo(145,128);c.lineTo(128,147);c.lineTo(111,128);c.closePath();}
    else if(motif==='dormitory'){c.rect(110,110,36,36);c.moveTo(110,110);c.lineTo(146,146);c.moveTo(146,110);c.lineTo(110,146);}
    else if(motif==='kitchen'){c.arc(128,127,24,Math.PI,Math.PI*2);c.lineTo(104,127);c.moveTo(122,127);c.lineTo(122,149);c.lineTo(134,149);c.lineTo(134,127);}
    else {for(let i=0;i<=16;i++){const a=i*Math.PI/8,r=i%2?21:27;const x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;if(!i)c.moveTo(x,y);else c.lineTo(x,y);}c.moveTo(139,128);c.arc(128,128,11,0,Math.PI*2);}
    c.stroke();
  }
  tex.update();return tex;
}
