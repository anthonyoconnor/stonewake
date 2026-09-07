import {type World} from './types.ts';
import {recipeById} from '../content/recipes.ts';
export {attractionStatus} from './recruitment.ts';
export function queueCraft(w:World,recipe:string){
  if(!recipeById(recipe))return;
  w.craftOrders.push({id:w.craftOrders.length+1,recipe,state:'queued',progress:0,paid:false});
}
