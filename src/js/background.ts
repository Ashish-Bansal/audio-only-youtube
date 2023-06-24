class Background {
  private tabIds = new Map();

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

    chrome.action.onClicked.addListener(() => {
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
            chrome.tabs.update(tabs[0].id!, { url: tabs[0].url });
          }
        }
      );
    });
  }

  removeURLParameters = (url: string, parameters: any[]) => {
    const urlParts = url.split('?');
    if (urlParts.length < 2) return;

    let currentParameters = urlParts[1].split(/[&;]/g);
    const encodedParameters = parameters.map(
      (para) => `${encodeURIComponent(para)}=`
    );
    const filteredParameters = currentParameters.filter(
      (p) => !encodedParameters.some((enc) => p.startsWith(enc))
    );

    return `${urlParts[0]}?${filteredParameters.join('&')}`;
  };

  processRequest = (details: any) => {
    const { url, tabId } = details;
    if (!url.includes('mime=audio')) return;

    if (url.includes('live=1')) {
      this.tabIds.set(tabId, '');
      this.sendMessage(tabId);
      return;
    }

    const parametersToBeRemoved = ['range', 'rn', 'rbuf', 'ump'];
    const audioURL = this.removeURLParameters(url, parametersToBeRemoved);
    if (audioURL && this.tabIds.get(tabId) !== audioURL) {
      this.tabIds.set(tabId, audioURL);
      this.sendMessage(tabId);
    }
  };

  sendMessage = (tabId: number) => {
    if (this.tabIds.has(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        url: this.tabIds.get(tabId),
      });
    }
  };

  enableExtension = () => {
    chrome.action.setIcon({
      path: {
        "19": "../img/icon19.png",
        "38": "../img/icon38.png",
      },
    });
    chrome.tabs.onUpdated.addListener(this.sendMessage);
    chrome.webRequest.onBeforeRequest.addListener(
      this.processRequest,
      { urls: ['<all_urls>'] },
    );
  };

  disableExtension = () => {
    chrome.action.setIcon({
      path: {
        "19": "../img/disabled_icon19.png",
        "38": "../img/disabled_icon38.png",
      },
    });
    chrome.tabs.onUpdated.removeListener(this.sendMessage);
    chrome.webRequest.onBeforeRequest.removeListener(this.processRequest);
    this.tabIds.clear();
  };

  saveSettings = (disabled: boolean) => {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled }); // eslint-disable-line
  };
}

const background = new Background();
