function getPeaks(data) {

  // What we're going to do here, is to divide up our audio into parts.

  // We will then identify, for each part, what the loudest sample is in that
  // part.

  // It's implied that that sample would represent the most likely 'beat'
  // within that part.

  // Each part is 0.5 seconds long - or 22,050 samples.

  // This will give us 60 'beats' - we will only take the loudest half of
  // those.

  // This will allow us to ignore breaks, and allow us to address tracks with
  // a BPM below 120.

  var partSize = 22050,
      parts = data[0].length / partSize,
      peaks = [];

  for (var i = 0; i < parts; i++) {
    var max = 0;
    for (var j = i * partSize; j < (i + 1) * partSize; j++) {
      var volume = Math.max(Math.abs(data[0][j]), Math.abs(data[1][j]));
      if (!max || (volume > max.volume)) {
        max = {
          position: j,
          volume: volume
        };
      }
    }
    peaks.push(max);
  }

  // We then sort the peaks according to volume...

  peaks.sort(function(a, b) {
    return b.volume - a.volume;
  });

  // ...take the loundest half of those...

  peaks = peaks.splice(0, peaks.length * 0.5);

  // ...and re-sort it back based on position.

  peaks.sort(function(a, b) {
    return a.position - b.position;
  });

  return peaks;
}

function getIntervals(peaks) {

  // What we now do is get all of our peaks, and then measure the distance to
  // other peaks, to create intervals.  Then based on the distance between
  // those peaks (the distance of the intervals) we can calculate the BPM of
  // that particular interval.

  // The interval that is seen the most should have the BPM that corresponds
  // to the track itself.

  var groups = [];

  peaks.forEach(function(peak, index) {
    for (var i = 1; (index + i) < peaks.length && i < 10; i++) {
      var group = {
        tempo: (60 * 44100) / (peaks[index + i].position - peak.position),
        count: 1
      };

      while (group.tempo < 90) {
        group.tempo *= 2;
      }

      while (group.tempo > 180) {
        group.tempo /= 2;
      }

      group.tempo = Math.round(group.tempo);

      if (!(groups.some(function(interval) {
        return (interval.tempo === group.tempo ? interval.count++ : 0);
      }))) {
        groups.push(group);
      }
    }
  });
  return groups;
}

function decodeAudioData (audioContext, arrayBuffer) {
  return new Promise(resolve => audioContext.decodeAudioData(arrayBuffer, resolve));
}

export default async function detectBPM (arrayBuffer) {
  // @ts-ignore
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineContext(2, 30 * 44100, 44100);

  const audioBuffer = await decodeAudioData(ctx, arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.value = 150;
  lowpassFilter.Q.value = 1;

  source.connect(lowpassFilter);

  const highpassFilter = ctx.createBiquadFilter();
  highpassFilter.type = 'highpass';
  highpassFilter.frequency.value = 150;
  highpassFilter.Q.value = 1;

  lowpassFilter.connect(highpassFilter);

  highpassFilter.connect(ctx.destination);

  source.start(0);
  ctx.startRendering();

  return new Promise(resolve => {
    ctx.oncomplete = event => {
      const { renderedBuffer } = event;
      const peaks = getPeaks([renderedBuffer.getChannelData(0), renderedBuffer.getChannelData(1)]);
      const groups = getIntervals(peaks);
      const firstPeakPosition = peaks[0].position / audioBuffer.length;

      const top = groups.sort(function(intA, intB) {
        return intB.count - intA.count;
      }).splice(0, 5);

      resolve({
        bpm: top[0].tempo,
        firstPeakPosition
      });
    };
  });
}