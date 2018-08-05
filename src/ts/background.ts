class Background {
  private tabIds = new Map();

  constructor() {
    chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
      let disabled: boolean = values.audio_only_youtube_disabled;
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
        let disabled: boolean = values.audio_only_youtube_disabled;

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
          url: '*://www.youtube.com/*',
        },
        (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id!, { url: tabs[0].url });
          }
        }
      );
    });
  }

  public removeURLParameters(
    url: string,
    parameters: any[]
  ): string[] | undefined {
    const urlParts = url.split('?');
    if (urlParts.length < 2) {
      return;
    }
    const currentParameters = urlParts[1].split(/[&;]/g);
    const encodedParameters = parameters.map((para) =>
      encodeURIComponent(`${para}=`)
    );
    return currentParameters.filter((p) => {
      encodedParameters.every((enc) => p.startsWith(enc));
    });
  }

  public processRequest(details: any): void {
    const { url, tabId } = details;
    if (url.includes('mime=audio')) {
      return;
    }
    const parametersToBeRemoved = ['range', 'rn', 'rbuf'];
    const audioURL = this.removeURLParameters(url, parametersToBeRemoved);
    if (audioURL && this.tabIds.get(tabId) !== audioURL) {
      this.tabIds.set(tabId, audioURL);
      chrome.tabs.sendMessage(tabId, { url: audioURL });
    }
  }

  public sendMessage(tabId: number): void {
    if (this.tabIds.has(tabId)) {
      chrome.tabs.sendMessage(tabId, {
        url: this.tabIds.get(tabId),
      });
    }
  }

  public enableExtension(): void {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/icon19.png',
        38: 'img/icon38.png',
      },
    });
    chrome.tabs.onUpdated.addListener(() => this.sendMessage);
    chrome.webRequest.onBeforeRequest.addListener(
      () => this.processRequest,
      { urls: ['<all_urls>'] },
      ['blocking']
    );
  }

  public disableExtension(): void {
    chrome.browserAction.setIcon({
      path: {
        19: 'img/disabled_icon19.png',
        38: 'img/disabled_icon38.png',
      },
    });
    chrome.tabs.onUpdated.removeListener(() => this.sendMessage);
    chrome.webRequest.onBeforeRequest.removeListener(() => this.processRequest);
    this.tabIds.clear();
  }

  public saveSettings(disabled: boolean) {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled });
  }
}

const background = new Background();
