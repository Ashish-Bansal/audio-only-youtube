class Background {
  private tabIds = new Map();
  private disabled? : boolean;

  constructor() {
    this.tabIds = new Map();

    chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
      this.disabled = values.audio_only_youtube_disabled;
      if (typeof this.disabled === 'undefined') {
        this.disabled = false;
        this.saveSettings(this.disabled);
      }

      if (this.disabled) {
        this.disableExtension();
      } else {
        this.enableExtension();
      }
    });

    chrome.browserAction.onClicked.addListener(() => {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        this.disabled = values.audio_only_youtube_disabled;

        if (this.disabled) {
          this.enableExtension();
        } else {
          this.disableExtension();
        }

        this.disabled = !this.disabled;
        this.saveSettings(this.disabled);
      });

      this.refreshYoutubeTab(true);
    });

    chrome.tabs.onSelectionChanged.addListener(() => {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        this.disabled = values.audio_only_youtube_disabled;
    
        if (this.disabled) {
          chrome.storage.sync.get({ autoEnableOnExit: true }, (item) => {
            if (item.autoEnableOnExit) {
              this.enableExtension();
              this.disabled = false;
              this.saveSettings(this.disabled);
              this.refreshYoutubeTab(false);
            }
          });
        }
      });
    });

    chrome.runtime.onMessage.addListener((msg, sender) => {
      if ("toggle_extension" === msg.action) {
        if (msg.enable)
          this.enableExtension();
        else
          this.disableExtension();
        this.disabled = !msg.enable;
        this.saveSettings(this.disabled);
        this.refreshYoutubeTab(true);
      }
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

    const parametersToBeRemoved = ['range', 'rn', 'rbuf'];
    const audioURL = this.removeURLParameters(url, parametersToBeRemoved);
    if (audioURL && this.tabIds.get(tabId) !== audioURL) {
      this.tabIds.set(tabId, audioURL);
      this.sendMessage(tabId);
    }
  };

  sendMessage = (tabId: number) => {
    if (this.tabIds.has(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        action:"apply_styling",
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

  refreshYoutubeTab(active:boolean) {
    chrome.tabs.query({
      active: active,
      currentWindow: true,
      url: '*://*.youtube.com/*',
    }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id!, {url: tabs[0].url});
      }  
    });
  }

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

  saveSettings = (disabled: boolean) => {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled }); // eslint-disable-line
  };
}

const background = new Background();
