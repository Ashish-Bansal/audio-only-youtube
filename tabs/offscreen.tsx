import React, { useEffect } from "react"

export default function Offscreen() {
    useEffect(() => {
        const iframe = document.getElementById("sandboxIframe") as HTMLIFrameElement
        console.log(iframe)
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
    }, [])

    return <div><iframe id="sandboxIframe" src="../sandboxes/sandbox.html"></iframe></div>
}
