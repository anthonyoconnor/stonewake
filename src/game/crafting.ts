import {type World} from './types.ts';
import {recipeById} from '../content/recipes.ts';
import {recipeAllowed} from './availability.ts';
export {attractionStatus} from './recruitment.ts';
export function queueCraft(w:World,recipe:string){
  if(w.outcome)return;
  if(!recipeById(recipe)||!recipeAllowed(w,recipe))return;
  w.craftOrders.push({id:w.craftOrders.length+1,recipe,state:'queued',progress:0,paid:false});
}
