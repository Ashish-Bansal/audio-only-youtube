function makeSetAudioURL(videoElement, url) {
  function setBackgroundImage() {
    var vid = window.location.search.split('v=')[1];
    var pos = vid.indexOf('&');
    if (pos !== -1) {
      vid = vid.substring(0, pos);
    }

    var bgUrl = `https://img.youtube.com/vi/${vid}/0.jpg`;
    videoElement.style.background = `transparent url(${bgUrl}) no-repeat center`;
    videoElement.style.backgroundSize = '80%';
  }

  function setAudioURL() {
    if (videoElement.src !== url) {
      videoElement.pause();
      videoElement.src = url;
      videoElement.currentTime = 0;
      videoElement.play();
      chrome.storage.sync.get({ showThumbnail: true }, function(item) {
        if (item.showThumbnail) {
          setBackgroundImage();
        }
      });
    }
  }
  setAudioURL();
  return setAudioURL;
}

chrome.runtime.onMessage.addListener(function(request) {
  var url = request.url;
  var videoElements = window.document.getElementsByTagName('video');
  var videoElement = videoElements[0];
  if (typeof videoElement == 'undefined') {
    console.log('Audio Only Youtube - Video element undefined in this frame!');
    return;
  }
  const videoRect = videoElement.getBoundingClientRect();
  if (videoRect.width === 0 && videoRect.height === 0) {
    console.log('Audio Only Youtube - Video element not visible!');
    return;
  }

  videoElement.onloadeddata = makeSetAudioURL(videoElement, url);
  if (document.getElementsByClassName('audio_only_div').length === 0) {
    var extensionAlert = document.createElement('div');
    extensionAlert.className = 'audio_only_div';

    var alertText = document.createElement('p');
    alertText.className = 'alert_text';
    alertText.innerHTML =
      'Audio Only. To watch video, ' +
      'click on the extension icon above and refresh your page.';

    extensionAlert.appendChild(alertText);
    var parent = videoElement.parentNode.parentNode;
    parent.appendChild(extensionAlert);
  }
});
