let originalVideoElementStyle: any = null;

function setBackgroundImage(videoElement: HTMLVideoElement) {
  let vid = window.location.search.split('v=')[1];
  if (!vid) return;

  const pos = vid.indexOf('&');
  if (pos !== -1) {
    vid = vid.substring(0, pos);
  }

  const bgUrl = `https://img.youtube.com/vi/${vid}/0.jpg`;
  videoElement.style.background = `transparent url(${bgUrl}) no-repeat center`;
  videoElement.style.backgroundSize = '80%';

  if (!originalVideoElementStyle) {
    originalVideoElementStyle = {
      background: videoElement.style.background,
      backgroundSize: videoElement.style.backgroundSize,
    }
  }
}

function showAudioOnlyInformation(videoElement: HTMLVideoElement) {
  if (document.getElementsByClassName('audio_only_div').length === 0) {
    const extensionAlert = document.createElement('div');
    extensionAlert.className = 'audio_only_div';

    const alertText = document.createElement('p');
    alertText.className = 'alert_text';
    alertText.innerHTML =
      'Audio Only. To watch video, ' +
      'click on the extension icon above and refresh your page.';

    extensionAlert.appendChild(alertText);
    const videoParent = videoElement.parentNode;
    if (!videoParent) return;

    const parent = videoParent.parentNode;
    if (parent) {
      parent.appendChild(extensionAlert);
    }
  }
}

function removeBackgroundImage(videoElement: HTMLVideoElement) {
  if (!originalVideoElementStyle) {
    return;
  }

  videoElement.style.background = originalVideoElementStyle.background;
  videoElement.style.backgroundSize = originalVideoElementStyle.backgroundSize;
}

function removeAudioOnlyInformation() {
  const elements = document.getElementsByClassName('audio_only_div');
  if (!elements.length) return;
  Array.from(elements).forEach(function(element) {
    element.remove();
  });
}

function removeVideoPlayerStyling(videoElement: HTMLVideoElement) {
  removeBackgroundImage(videoElement);
  removeAudioOnlyInformation();
}

function applyVideoPlayerStyling(videoElement: HTMLVideoElement) {
  chrome.storage.sync.get({ showThumbnail: true }, function(item) {
    if (item.showThumbnail) {
      setBackgroundImage(videoElement);
    }
  });

  showAudioOnlyInformation(videoElement);
}

function makeSetAudioURL(videoElement: HTMLVideoElement, url: string) {
  function setAudioURL() {
    if (url === '' || videoElement.src === url) {
      return;
    }

    videoElement.pause();
    videoElement.src = url;
    videoElement.currentTime = 0;
    videoElement.play();
  }
  return setAudioURL;
}

chrome.runtime.onMessage.addListener((request) => {
  const url = request.url;
  const videoElements = window.document.getElementsByTagName('video');
  const videoElement = videoElements[0];
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
  if (url) {
    applyVideoPlayerStyling(videoElement);
  } else {
    removeVideoPlayerStyling(videoElement);
  }
});
