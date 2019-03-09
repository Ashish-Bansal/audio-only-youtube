class Background {
  constructor() {
    this.tabIds = new Map();

    chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
      let disabled = values.audio_only_youtube_disabled;
      if (typeof disabled === 'undefined') {
        disabled = false;
        this.saveSettings(disabled);
      }

      if (disabled) {
        this.disableExtension();
      } else {
        this.enableExtension();
      }
    });

    chrome.browserAction.onClicked.addListener(() => {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        let disabled = values.audio_only_youtube_disabled;

        if (disabled) {
          this.enableExtension();
        } else {
          this.disableExtension();
        }

        disabled = !disabled;
        this.saveSettings(disabled);
      });

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
          url: '*://*.youtube.com/*',
        },
        (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
          }
        }
      );
    });
  }

  removeURLParameters = (url, parametersToBeRemoved) => {
    const urlParts = url.split('?');
    if (urlParts.length < 2) return;

    let currentParameters = urlParts[1].split(/[&;]/g);
    parametersToBeRemoved.forEach((parameter) => {
      const prefix = encodeURIComponent(parameter) + '=';
      currentParameters = currentParameters.filter(
        (p) => !p.startsWith(prefix)
      );
    });

    url = `${urlParts[0]}?${currentParameters.join('&')}`;
    return url;
  };

  processRequest = (details) => {
    const { url, tabId } = details;
    if (!url.includes('mime=audio')) return;

    if (url.includes('live=1')) {
      this.tabIds.set(tabId, '');
      this.sendMessage(tabId);
      return;
    }

    const parametersToBeRemoved = ['range', 'rn', 'rbuf'];
    const audioURL = this.removeURLParameters(url, parametersToBeRemoved);
    if (audioURL && this.tabIds.get(tabId) !== audioURL) {
      this.tabIds.set(tabId, audioURL);
      this.sendMessage(tabId);
    }
  };

  sendMessage = (tabId) => {
    if (this.tabIds.has(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        url: this.tabIds.get(tabId),
      });
    }
  };

  enableExtension = () => {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/icon19.png',
        38: 'img/icon38.png',
      },
    });
    chrome.tabs.onUpdated.addListener(this.sendMessage);
    chrome.webRequest.onBeforeRequest.addListener(
      this.processRequest,
      { urls: ['<all_urls>'] },
      ['blocking']
    );
  };

  disableExtension = () => {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/disabled_icon19.png',
        38: 'img/disabled_icon38.png',
      },
    });
    chrome.tabs.onUpdated.removeListener(this.sendMessage);
    chrome.webRequest.onBeforeRequest.removeListener(this.processRequest);
    this.tabIds.clear();
  };

  saveSettings = (disabled) => {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled }); // eslint-disable-line
  };
}

const background = new Background();
