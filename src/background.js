/* chrome.browserAction.onClicked.addListener(() => {
    chrome.storage.local.get("audio_only_youtube_disabled", values => {
        let disabled = values.audio_only_youtube_disabled;

        if (disabled) {
            enableExtension();
        } else {
            disableExtension();
        }

        disabled = !disabled;
        saveSettings(disabled);
    });
    chrome.tabs.query(
        {
            active: true,
            currentWindow: true,
            url: "*://www.youtube.com/*"
        },
        tabs => {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
            }
        }
    );
});

chrome.storage.local.get("audio_only_youtube_disabled", values => {
    let disabled = values.audio_only_youtube_disabled;
    if (typeof disabled === "undefined") {
        disabled = false;
        saveSettings(disabled);
    }

    if (disabled) {
        disableExtension();
    } else {
        enableExtension();
    }
}); */
export default class Background {
    constructor() {
        this.tabIds = new Map();
    }
    removeURLParameters(url, parameters) {
        const urlparts = url.split("?");
        let pars = urlparts[1].split(/[&;]/g);
        for (const parameter of parameters) {
            if (urlparts.length < 2)
                continue;
            const prefix = `${encodeURIComponent(parameter)}=`;
            pars = pars.filter(p => p.lastIndexOf(prefix, 0) === -1);
        }
        return (url = `${urlparts[0]}?${pars.join("&")}`);
    }
    processRequest(details) {
        if (details.url.includes("mime=audio")) {
            const audioURL = this.removeURLParameters(details.url, [
                "range",
                "rn",
                "rbuf"
            ]);
            if (this.tabIds.get(details.tabId) != audioURL) {
                this.tabIds.set(details.tabId, audioURL);
                chrome.tabs.sendMessage(details.tabId, { url: audioURL });
            }
        }
    }
    sendMessage(tabId) {
        if (this.tabIds.has(tabId)) {
            chrome.tabs.sendMessage(tabId, {
                url: this.tabIds.get(tabId)
            });
        }
    }
    enableExtension() {
        chrome.browserAction.setIcon({
            path: {
                19: "img/icon19.png",
                38: "img/icon38.png"
            }
        });
        chrome.tabs.onUpdated.addListener(sendMessage);
        chrome.webRequest.onBeforeRequest.addListener(this.processRequest, { urls: ["<all_urls>"] }, ["blocking"]);
    }
    disableExtension() {
        chrome.browserAction.setIcon({
            path: {
                19: "img/disabled_icon19.png",
                38: "img/disabled_icon38.png"
            }
        });
        chrome.tabs.onUpdated.removeListener(sendMessage);
        chrome.webRequest.onBeforeRequest.removeListener(processRequest);
        this.tabIds.clear();
    }
    saveSettings(disabled) {
        chrome.storage.local.set({ audio_only_youtube_disabled: disabled });
    }
}
