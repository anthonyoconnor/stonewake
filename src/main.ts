import './style.css';
import { prototypeLevel } from './content/levels';
import { createWorld } from './game/world';
import { GameScene } from './view/scene';
import { CameraControls } from './view/controls';
const world=createWorld(prototypeLevel);
const view=new GameScene(document.querySelector<HTMLCanvasElement>('#world')!,world);
const controls=new CameraControls(view);
view.engine.runRenderLoop(()=>{controls.update(Math.min(.05,view.engine.getDeltaTime()/1000));view.render();});
