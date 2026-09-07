export const recipes=[
  {id:'reinforced-door',name:'Reinforced door',cost:40,seconds:8,capability:'craft'},
  {id:'bolt-trap',name:'Bolt trap',cost:55,seconds:10,capability:'craft'}
];
export const recipeById=(id:string)=>recipes.find(r=>r.id===id);
