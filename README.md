![alt text](https://raw.githubusercontent.com/Ashish-Bansal/audio-only-youtube/master/logo.png "Audio Only Youtube")

Audio Only Youtube (Chrome Extension)
=======================================

audio-only-youtube chrome extension enables you to disable the video on YouTube songs to save bandwidth when you just want to listen to audio.

Note: It doesn't support YouTube live videos.

## Installation

[You can install the extension from here (Chrome Webstore)](https://chrome.google.com/webstore/detail/audio-only-youtube/pkocpiliahoaohbolmkelakpiphnllog)

## Contribute

1. After cloning the repo, run `yarn run dev`.
2. Open Chrome, go to the Extensions tab, click **Load unpacked**, and select
   the `build/dev` directory.
3. Play YouTube video and see the extension in action.

Whenever you edit the code, the project rebuilds automatically. After each build
finishes, you need to reload the extension in the browser to see your changes.

**Thanks to Stefan Ivic for all the icons used in the extension.**

## Extension Internals

We obtain audio-only URLs by using signature decryption logic adapted from the `@distube/ytdl-core` library; however, because this library requires numerous Node-specific modules not available in standard browser environments, we have embedded and adapted the relevant code in `js/ytdl`. This approach lets us decrypt YouTube’s signature parameters, fetch audio-only streams, and replace the default video stream to save bandwidth. As YouTube’s signature generation logic can change, we must keep `sig.js` in sync with updates from `@distube/ytdl-core` to maintain functionality.

Good luck!
