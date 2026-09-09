import { LoadingScreen } from './ui/loading';

export async function boot() {
  const loading = new LoadingScreen();
  let openEntry = () => {};
  // Optional art enhances the shell without holding up its first paint or startup.
  const art = new Image();
  art.onload = () => {
    loading.element.style.backgroundImage = 'linear-gradient(#08131ce6,#08131cbd),url("/art/menu-hall-v1.png")';
    loading.element.style.backgroundSize = 'cover';
    loading.element.style.backgroundPosition = 'center';
  };
  art.src = '/art/menu-hall-v1.png';
  await loading.run('Loading the ancient halls…', async () => {
    const { initializeGame } = await import('./main');
    loading.stage('Preparing the Hearthstone…');
    openEntry = await initializeGame(loading);
  }, false); // A failed engine initialization reloads cleanly instead of installing duplicate listeners.
  openEntry();
}
