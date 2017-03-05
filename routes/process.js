const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

const cp = require('child-process-promise');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const cwd = process.cwd();

const mergedOutPath = `${cwd}/tmp/merged.mp4`;
const mergedTsOutPath = `${cwd}/tmp/merged.ts`;
const bumperTsPath = `${cwd}/public/video/bumper.ts`;

const outWidth = 1980;
const outHeight = 990;

const uploadFieldsSpec = [
  {
    name: 'video',
    maxCount: 1
  },
  {
    name: 'audio',
    maxCount: 1
  }
];

function getUuid() {
  return new Date().getTime().toString();
}

function asyncMergeAndResize(videoPath, audioPath) {
  return new Promise(function(resolve, reject) {
    try {
      const command = [
        ffmpegPath,
        `-i ${cwd}/${videoPath}`,
        `-i ${cwd}/${audioPath}`,
        '-c:v libx264',
        '-b:v 6400k',
        '-b:a 4800k',
        `-aspect ${parseInt(outWidth / outHeight)}:1`,
        `-vf 'scale=${outWidth}:${outHeight}:force_original_aspect_ratio=decrease,pad=${outWidth}:${outHeight}:x=(${outWidth}-iw)/2:y=(${outHeight}-ih)/2:color=black'`,
        '-strict experimental',
        mergedOutPath,
        '-y'
      ].join(' ');

      cp.exec(command)
        .then(function() {
          resolve('asyncMergeAndResize successful');
        })
        .catch(function(e) {
          reject(e);
        });
    } catch(e) {
      reject(e);
    }
  });
}

function asyncMakeIntoTransportStream() {
  return new Promise(function(resolve, reject) {
    try {
      const command = [
        ffmpegPath,
        `-i ${mergedOutPath}`,
        '-c copy',
        '-bsf:v h264_mp4toannexb',
        '-f mpegts',
        mergedTsOutPath,
        '-y'
      ].join(' ');

      cp.exec(command)
        .then(function() {
          resolve('makeIntoTransportStream successful');
        })
        .catch(function(e) {
          reject(e);
        });
    } catch(e) {
      reject(e);
    }
  })
}

function asyncConcatWithBumper(uuid) {
  return new Promise(function(resolve, reject) {
    try {
      const command = [
        ffmpegPath,
        `-i "concat:${mergedTsOutPath}|${mergedTsOutPath}|${bumperTsPath}"`,
        '-c copy',
        '-bsf:a aac_adtstoasc',
        `${cwd}/tmp/${uuid}.mp4`,
        '-y'
      ].join(' ');

      cp.exec(command)
        .then(function() {
          resolve('concatWithBumper successful');
        })
        .catch(function(e) {
          reject(e);
        });
    } catch(e) {
      reject(e);
    }
  })
}

function asyncGenerateThumbnail(uuid) {
  return new Promise(function(resolve, reject) {
    try {
      const command = [
        ffmpegPath,
        `-i ${cwd}/tmp/${uuid}.mp4`,
        '-ss 0',
        '-vframes 1',
        `${cwd}/tmp/${uuid}.png`
      ].join(' ');

      cp.exec(command)
        .then(function() {
          resolve('generateThumbnail successful');
        })
        .catch(function(e) {
          reject(e);
        });
    } catch(e) {
      reject(e);
    }
  })
}

router.get('/', function(req, res) {
  res.render('process', {
    videoId: req.query.id
  });
})

router.post('/', upload.fields(uploadFieldsSpec), function(req, res, next) {
  console.log('got a post!');
  console.log(req.files);
  if ('video' in req.files && 'audio' in req.files) {
    const uuid = getUuid();
    const videoBlob = req.files.video[0];
    const audioBlob = req.files.audio[0];

    console.log('mergeAndResize');
    asyncMergeAndResize(videoBlob.path, audioBlob.path)
      .then(function() {
        console.log('makeIntoTransportStream');
        return asyncMakeIntoTransportStream();
      })
      .then(function() {
        console.log('concatWithBumper');
        return asyncConcatWithBumper(uuid);
      })
      .then(function() {
        console.log('generateThumbnail');
        return asyncGenerateThumbnail(uuid);
      })
      .then(function() {
        console.log('video processed successfully')
      })
      .catch(function(err) {
        console.error(err);
      });
  } else {
    res.send('invalid data');
  }
});

module.exports = router;
