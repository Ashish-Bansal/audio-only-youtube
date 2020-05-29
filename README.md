![alt text](https://raw.githubusercontent.com/Ashish-Bansal/audio-only-youtube/master/logo.png "Audio Only Youtube")

Audio Only Youtube (Chrome Extension)
=======================================

audio-only-youtube chrome extension enables you to disable only video on youtube songs which saves bandwidth when you want to listen songs on youtube.

Note: It doesn't support Youtube live videos.

## Installation

[You can install extension from here(Chrome Webstore)](https://chrome.google.com/webstore/detail/audio-only-youtube/pkocpiliahoaohbolmkelakpiphnllog)

## Contribute

1. After cloning the repo,  run `yarn run start`.
2. Open chrome, go to extensions tab, load unpacked extension and select
   `dev/build` directory.
3. Go to Youtube and see extension in live.

In case you edit code, it would automatically rebuild the extension and after
that you need to reload it in the browser.

**Thanks to Stefan Ivic for all the icons used in the extension.**

## Extension Internals

The only reason this extension is able to work is because Youtube serves audio and video streams separately. This extension intercepts response of all the requests on the youtube domains. In the response headers, it checks for Content-Type. If it's an audio file, then it assumes that we have got the audio stream for the video being played. It removes certain range related query parameters in accordance with HTTP RFC's range requests section. Then we set the source of Youtube's video player to audio stream.

Good luck!

