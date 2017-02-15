const config = require('./../../config');

const $body = $('body');
const tapEvent = 'click tap touch';

export const videoPlayingClass = 'play-video';

const $videoWrapper = $body.find('#video');
const $video = $videoWrapper.find('video');

function videoTriggers() {
  let counter;
  $body.on(tapEvent, e => {
    // hiding the video if playing
    if ( $body.hasClass(videoPlayingClass) ) {
      $body.addClass('overlay-active intro-active');
      $body.toggleClass(videoPlayingClass);
      clearTimeout(counter);
    } else {
      clearTimeout(counter);
      // wait for another interaction, then play the video
      counter = setTimeout(() => {
        $body.toggleClass(videoPlayingClass);
      }, 5 * 60 * 1000); // 5 minutes
    }
  });
}

export function init() {
  if ( window.location.hash.length > 0 && window.location.hash == '#video' ) {
    $body.toggleClass(videoPlayingClass);
    videoTriggers();
  }
}
