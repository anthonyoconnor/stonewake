import './style.css';
import { prototypeLevel } from './content/levels';
import { createWorld } from './game/world';
import { GameScene } from './view/scene';
const world=createWorld(prototypeLevel);
const view=new GameScene(document.querySelector<HTMLCanvasElement>('#world')!,world);
view.engine.runRenderLoop(()=>view.render());
