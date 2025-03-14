const iframe = document.getElementById("sandboxIframe")
window.addEventListener('message', function listener(event) {
    if (event.source !== iframe.contentWindow) {
        return;
    }

    // const data = event.data;
    chrome.runtime.sendMessage({
        target: 'background',
        data: event.data,
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.target !== 'offscreen') {
        return false;
    }
    iframe.contentWindow.postMessage(message.data, '*');
});
