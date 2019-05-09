import detectBPM from './bpmDetector.js';
import readFileAsArrayBuffer from './file-reader.js';

const PIKACHU_BPM = 126;
const FIRST_DANCE_STEP_SECONDS = 1.06;

let MUSIC_BPM = 0;

const fileOpener = document.querySelector('#open-file');
const video = document.querySelector('video');
const audio = document.querySelector('audio');

video.loop = true;

function play (firstPeakSecond) {
  audio.play();
  video.currentTime = FIRST_DANCE_STEP_SECONDS;

  setTimeout(() => {
    video.play();
  }, firstPeakSecond * 1000);
}

video.addEventListener('timeupdate', () => {
  if (video.currentTime >= 19.44) {
    video.currentTime = 4.67;
  }
});

video.addEventListener('mousedown', () => {
  console.log(video.currentTime);
})

fileOpener.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const blobURL = URL.createObjectURL(file);

  audio.src = blobURL;

  const beat = await detectBPM(arrayBuffer);

  MUSIC_BPM = beat.bpm;

  console.log(beat);

  video.playbackRate = MUSIC_BPM / PIKACHU_BPM;

  const firstPeakSecond = audio.duration * beat.firstPeakPosition;

  console.log({ firstPeakSecond });

  play(firstPeakSecond);
})