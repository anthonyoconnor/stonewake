export const recipes=[
 {id:'timber-door',name:'Timber door',cost:20,seconds:4,capability:'craft'},
  {id:'reinforced-door',name:'Reinforced door',cost:40,seconds:8,capability:'craft'},
 {id:'steel-door',name:'Steel door',cost:80,seconds:16,capability:'craft'},
 {id:'spike-trap',name:'Spike trap',cost:35,seconds:6,capability:'craft'},
 {id:'bolt-trap',name:'Bolt trap',cost:55,seconds:10,capability:'craft'}
];
export const recipeById=(id:string)=>recipes.find(r=>r.id===id);
