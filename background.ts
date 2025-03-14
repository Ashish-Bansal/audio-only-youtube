import ytdl from './ytdl'

import activeIcon19 from "data-base64:./assets/active-19.png"
import activeIcon38 from "data-base64:./assets/active-38.png"
import inactiveIcon19 from "data-base64:./assets/inactive-19.png"
import inactiveIcon38 from "data-base64:./assets/inactive-38.png"

class Background {
  constructor() {
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


  onTabUpdated = async (tabId: number, changeInfo: {url?: string}) => {
    if (!changeInfo.url) return;

    const url = changeInfo.url
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const videoId = params.get('v');
    if (!videoId) return;
    console.info('Fetching audio only for video ID', videoId);

    try {
      const info = await ytdl.getInfo(videoId, {});
      const typedInfo = info as {videoDetails: {isLive: boolean}, formats: [{url: string; container: string; hasAudio: boolean; hasVideo: boolean; isLive: boolean}]}
      if (!typedInfo) {
        console.error('No video info found');
        return;
      }
      if (typedInfo.videoDetails.isLive) {
        console.info('Video is live, skipping');
        return;
      }
      console.info('Video Info for', videoId, info);

      for (const item of typedInfo.formats) {
        if (item.hasAudio && !item.hasVideo) {
          try {
            const response = await fetch(item.url, {method: 'HEAD'});
            if (response.ok) {
              console.info('Audio only format found for video', videoId, item.url);
              chrome.tabs.sendMessage(tabId, {
                url: item.url,
              });
              return;
            }
          } catch (err) {
            continue;
          }
        }
      }

      console.error('No audio only format found');
    } catch (err) {
      console.error('Error getting video info:', err);
    }
  };


  enableExtension = () => {
    chrome.action.setIcon({
      path: {
        "19": activeIcon19,
        "38": activeIcon38,
      },
    });
    chrome.tabs.onUpdated.addListener(this.onTabUpdated);
  };

  disableExtension = () => {
    chrome.action.setIcon({
      path: {
        "19": inactiveIcon19,
        "38": inactiveIcon38,
      },
    });
    chrome.tabs.onUpdated.removeListener(this.onTabUpdated);
  };

  saveSettings = (disabled: boolean) => {
    chrome.storage.local.set({ audio_only_youtube_disabled: disabled });
  };
}

const background = new Background();
