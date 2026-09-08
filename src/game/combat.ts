import {type World,type Resident,type Point} from './types.ts';
import {findPath,canStand} from './navigation.ts';
import {alive,hasteRate,damageEnemy,spellLine,visible} from './spell-effects.ts';
import {characterById} from '../content/characters.ts';
export const combatDefaults={health:100,damage:10,attackSeconds:1,noticeRadius:6,reach:1.05,criticalNeed:.1};
type JobRelease=(w:World,a:Resident)=>void;
type Move=(w:World,a:Resident,dt:number)=>boolean;
export function tickFighter(w:World,a:Resident,dt:number,release:JobRelease,move:Move){
  if(!a.capabilities.includes('fight'))return false;
  const distance=(p:Point)=>Math.hypot(a.x-p.x,a.z-p.z);
  const rally=w.rally;
  // Critical needs temporarily release the rally until the chosen service finishes.
  if(a.energy<combatDefaults.criticalNeed||a.hunger<combatDefaults.criticalNeed)a.recovering=true;
  if(a.recovering&&a.energy>.3&&a.hunger>.3&&a.job?.kind!=='eat'&&a.job?.kind!=='sleep')a.recovering=false;
  const enemies=(w.enemies??[]).filter(e=>e.health>0&&visible(w,e)&&spellLine(w,a,e));
  const target=enemies.filter(e=>distance(e)<=combatDefaults.reach||!a.recovering&&distance(e)<=combatDefaults.noticeRadius&&(!rally||Math.hypot(e.x-rally.x,e.z-rally.z)<=rally.radius)).sort((p,q)=>distance(p)-distance(q)||p.id-q.id)[0];
  if(target){
    if(a.job)release(w,a);a.rallying=!!rally;a.rallyUnreachable=false;a.combatTarget=target.id;
    a.facing=Math.atan2(target.x-a.x,target.z-a.z);
    if(distance(target)<=combatDefaults.reach){
      a.path=[];a.activity='Fighting';
      if((a.nextAttackAt??0)<=w.elapsed){damageEnemy(w,target,characterById(a.type)?.combat?.damage??combatDefaults.damage,'dwarf');a.nextAttackAt=w.elapsed+(characterById(a.type)?.combat?.attackSeconds??combatDefaults.attackSeconds)/hasteRate(w,a);}
    }else {
      a.path=findPath(w,a,{x:Math.round(target.x),z:Math.round(target.z)})??[];move(w,a,dt);a.activity=a.path.length?'Approaching enemy':'Enemy unreachable';
    }
    return true;
  }
  if(a.combatTarget!==undefined){a.path=[];a.combatTarget=undefined;a.retry=0;}
  if(rally&&!a.recovering){
    if(a.job)release(w,a);a.rallying=true;
    const routeToRally=findPath(w,a,rally);
    if(!routeToRally){a.path=[];a.rallyUnreachable=true;a.activity='Rally unreachable';return true;}
    if(distance(rally)<=rally.radius+.06&&!a.path.length){a.activity='Holding rally';a.rallyUnreachable=false;return true;}
    if(!a.path.length||w.routesChanged){
      const spots=w.tiles.filter(t=>Math.hypot(t.x-rally.x,t.z-rally.z)<=Math.max(0,rally.radius-.1)&&canStand(w,t)&&!w.agents.some(o=>o!==a&&alive(o)&&(Math.hypot(o.x-t.x,o.z-t.z)<.65||o.job&&o.job.work.x===t.x&&o.job.work.z===t.z))).sort((p,q)=>distance(p)-distance(q));
      for(const spot of spots){const path=findPath(w,a,spot);if(path){a.path=path;break;}}
    }
    a.rallyUnreachable=!a.path.length;
    if(a.path.length)move(w,a,dt);a.activity=a.rallyUnreachable?'Rally unreachable':'Answering Call to Arms';return true;
  }
  if(a.rallying){a.path=[];a.rallying=false;a.rallyUnreachable=false;a.retry=0;}
  return false;
}
