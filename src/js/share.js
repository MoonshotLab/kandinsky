const config = require('./../../config');

const Promise = require('bluebird');

const ui = require('./ui');
const sound = require('./sound');

const drawCanvas = document.getElementById(config.canvasId);
const canvasRecorder = RecordRTC(drawCanvas, {
  type: 'canvas'
});

function asyncStopAudioRecordingAndExportBlob(recorder) {
  return new Promise(function(resolve, reject) {
    try {
      recorder.stop();
      recorder.exportWAV(function(blob) {
        resolve(blob);
      });
    } catch(e) {
      reject(e);
    }
  });
}

function asyncStopVideoRecordingAndExportBlob(recorder) {
  return new Promise(function(resolve, reject) {
    try {
      recorder.stopRecording(function() {
        let blob = recorder.getBlob();
        resolve(blob);
      });
    } catch(e) {
      reject(e);
    }
  });
}

export function record() {
  let audioRecorder = new Recorder(Howler.masterGain, {
    workerPath: '/js/lib/recorderWorker.js'
  });

  canvasRecorder.startRecording();
  audioRecorder.record();

  sound.asyncPlayCompositionOnce().then(() => {
    return Promise.all([asyncStopAudioRecordingAndExportBlob(audioRecorder), asyncStopVideoRecordingAndExportBlob(canvasRecorder)])
      .then(function(values) {
        let [audioBlob, videoBlob] = values;
        download(audioBlob, 'blob.wav');
        download(videoBlob, 'blob.webm');
      })
      .catch(function(e) {
        console.error(e);
      });
    // audioRecorder.stop();
    // audioRecorder.exportWAV(function(blob) {
    //   download(blob, 'blob.wav');
    // });
    // canvasRecorder.stopRecording(function() {
    //   var blob = canvasRecorder.getBlob();
    //   download(blob, 'blob.webm');
    // });
  }).error((e) => {
    Promise.all([asyncStopAudioRecordingAndExportBlob(audioRecorder), asyncStopVideoRecordingAndExportBlob(canvasRecorder)])
      .then(function(values) {
        console.log(values)
      })
      .catch(function(e) {
        console.error(e);
      });
    // audioRecorder.stop();
    // audioRecorder.exportWAV(function(blob) {
    //   download(blob, 'blob.wav');
    // });
    // canvasRecorder.stopRecording(function() {
    //   var blob = canvasRecorder.getBlob();
    //   download(blob, 'blob.webm');
    // });
  });
}
