class Background {
  private tabIds = new Map();
  private disabled!: boolean;

  constructor() {
    chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
      this.disabled = values.audio_only_youtube_disabled;
      if (typeof this.disabled === 'undefined') {
        this.saveSettings(this.disabled);
      }
      this.disabled ? this.disableExtension() : this.enableExtension();
    });

    chrome.browserAction.onClicked.addListener(() => {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        this.disabled = values.audio_only_youtube_disabled;
        this.disabled ? this.enableExtension() : this.disableExtension();
        this.saveSettings(this.disabled);
      });

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
          url: '*://www.youtube.com/*',
        },
        (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id!, { url: tabs[0].url });
          }
        }
      );
    });

    chrome.tabs.onSelectionChanged.addListener(() => {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        this.disabled = values.audio_only_youtube_disabled;
        chrome.storage.sync.get({ autoSaveBandwidth: true }, (item) => {
          if (item.autoSaveBandwidth) {
            if (this.disabled) {
              this.enableExtension();
              this.saveSettings(this.disabled);
              chrome.tabs.query(
                {
                  active: false,
                  currentWindow: true,
                  url: '*://www.youtube.com/*',
                },
                (tabs) => {
                  if (tabs.length > 0) {
                    chrome.tabs.update(tabs[0].id!, {
                      url: tabs[0].url,
                    });
                  }
                }
              );
            }
          }
        });
      });
    });
  }

  public removeURLParameters = (url: string, parameters: any[]): string => {
    const urlParts = url.split('?');
    if (urlParts.length < 2) {
      return '';
    }
    const currentParameters = urlParts[1].split(/[&;]/g);
    const encodedParameters = parameters.map(
      (para) => `${encodeURIComponent(para)}=`
    );
    const filteredParameters = currentParameters.filter(
      (p) => !encodedParameters.some((enc) => p.startsWith(enc))
    );

    return `${urlParts[0]}?${filteredParameters.join('&')}`;
  };

  public processRequest = (details: any): void => {
    const { url, tabId } = details;
    if (!url.includes('mime=audio')) {
      return;
    }
    const parametersToBeRemoved = ['range', 'rn', 'rbuf'];
    const audioURL = this.removeURLParameters(url, parametersToBeRemoved);
    if (audioURL && this.tabIds.get(tabId) !== audioURL) {
      this.tabIds.set(tabId, audioURL);
      this.sendMessage(tabId);
    }
  };

  public sendMessage = (tabId: number): void => {
    if (this.tabIds.has(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        url: this.tabIds.get(tabId),
      });
    }
  };

  public enableExtension = (): void => {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/icon19.png',
        38: 'img/icon38.png',
      },
    });
    chrome.webRequest.onBeforeRequest.addListener(
      this.processRequest,
      { urls: ['<all_urls>'] },
      ['blocking']
    );
    this.disabled = false;
  };

  public disableExtension = (): void => {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/disabled_icon19.png',
        38: 'img/disabled_icon38.png',
      },
    });
    chrome.webRequest.onBeforeRequest.removeListener(this.processRequest);
    this.tabIds.clear();
    this.disabled = true;
  };

  public saveSettings = (disabled: boolean): void => {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled });
  };
}

const background = new Background();
