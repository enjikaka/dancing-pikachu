import detectBPM from './bpmDetector.js';
import readFileAsArrayBuffer from './file-reader.js';

const PIKACHU_BPM = 126;
let MUSIC_BPM = 0;

const fileOpener = document.querySelector('#open-file');
const video = document.querySelector('video');
const audio = document.querySelector('audio');

video.loop = true;

function play () {
  audio.play();
  video.play();
}

fileOpener.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const blobURL = URL.createObjectURL(file);

  audio.src = blobURL;

  MUSIC_BPM = await detectBPM(arrayBuffer);

  console.debug({
    MUSIC_BPM
  });

  video.playbackRate = MUSIC_BPM / PIKACHU_BPM;

  play();
})