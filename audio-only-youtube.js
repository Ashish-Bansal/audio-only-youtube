function makeSetAudioURL(videoElement, url) {
    function setAudioURL() {
        if (videoElement.src  != url) {
            videoElement.pause();
            videoElement.src = url;
            videoElement.currentTime = 0;
            videoElement.play();
        }
    }
    setAudioURL();
    return setAudioURL;
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        var url = request.url;
        var videoElements = document.getElementsByTagName('video');
        var videoElement = videoElements[0];
        videoElement.onloadeddata = makeSetAudioURL(videoElement, url);
    }
);
