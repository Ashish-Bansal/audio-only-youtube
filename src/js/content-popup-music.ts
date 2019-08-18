
let currentPopup: HTMLElement|null;
function showPopupIfMusic() {
  isMusic(function(res: boolean) {
    if (!res)
      return;
    if (currentPopup)
      currentPopup.remove();
    var popup = document.createElement("div");
    popup.style.maxWidth = "300px";
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "10px";
    popup.style.zIndex = "10000";
    popup.style.fontSize = "12px";
    popup.style.padding = "10px 20px";
    popup.style.backgroundColor = "white";
    popup.style.border = "solid 1px gray";
    popup.style.textAlign = "center";
    var popupMsg = document.createElement("div")
    popupMsg.innerHTML = "Enable Audio Only?";
    popupMsg.style.marginBottom = "10px";
    popup.appendChild(popupMsg);
    var popupButtons = document.createElement("div");
    var popupYes = document.createElement("button");
    popupYes.style.cursor = "pointer";
    popupYes.innerHTML = "Yes";
    popupYes.style.margin = "0 10px";
    popupYes.style.padding = "5px 20px";
    popupYes.style.backgroundColor = "red";
    popupYes.style.color = "white";
    popupButtons.appendChild(popupYes);
    var popupNo = document.createElement("button");
    popupNo.style.cursor = "pointer";
    popupNo.innerHTML = "No";
    popupNo.style.margin = "0 5px";
    popupNo.style.padding = "5px 20px";
    popupNo.style.backgroundColor = "white";
    popupNo.style.color = "gray";
    popupButtons.appendChild(popupNo);
    let eventListener : any;
    popup.remove = function() {
      currentPopup = null;
      window.removeEventListener("keydown", eventListener);
      try {
        document.body.removeChild(this);
      }
      catch (e) {
      }
    }
    popupYes.onclick = function() {
      popup.remove();
      chrome.runtime.sendMessage({
        action: 'enable_extension'
      });
    };
    popupNo.onclick = function() {
      popup.remove();
    };
    eventListener = window.addEventListener("keydown", function(e) {
      if (e.keyCode == 27)
        popup.remove();
    });
    popup.appendChild(popupButtons);
    document.body.appendChild(popup);
    currentPopup = popup;
  });
}
function waitUntil(condition:()=>boolean, callback:()=>any, ttl?:number) {
  if (!ttl) ttl = 8000;
  waitUntilAux(condition, callback, ttl);
}
function waitUntilAux(condition:()=>boolean, callback:()=>any, ttl:number) {
  if (condition())
    callback();
  else if (ttl > 0)
    setTimeout(function(){waitUntilAux(condition, callback, ttl-100)},100);
}
function isCategoryShown() {
  var lessButton = document.getElementById("less");
  return lessButton && (null === lessButton.getAttribute("hidden"));
}
function isMusic(callback:(res:boolean)=>any) {
  var wasShown = true;
  waitUntil(function() {
    if (isCategoryShown())
      return true;
    else {
      var res = !wasShown;
      wasShown = false;
      let plusLink: HTMLElement|null = document.querySelector(".more-button.style-scope.ytd-video-secondary-info-renderer");
      if (!plusLink)
        return false;
      plusLink.click();
      return res;
    }
  }, function() {
    setTimeout(function() {
      var links = document.querySelectorAll(".yt-simple-endpoint.style-scope.yt-formatted-string");
      var res = false;
      for (var i=0;i<links.length;i++) {
        let href = links[i].getAttribute("href");
        if (href && href.endsWith("UC-9-kyTW8ZkZNDHQJ6FgpwQ")) {
          res = true;
          break;
        }
      }
      if (!wasShown) {
        let lessButton: HTMLElement|null = document.querySelector(".less-button.style-scope.ytd-video-secondary-info-renderer");
        if (lessButton)
          lessButton.click();
      }
      callback(res);
    }, 1);
  });
}

function isVideoUrl() {
  return !!document.location.href.match(/youtube\.com\/watch\?(.*&)?v=(\w+)/g);
}

function showPopupIfShould() {
  chrome.storage.sync.get({ promptIfMusic: false }, function(item) {
    if (item.promptIfMusic) {
      chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
        if (values.audio_only_youtube_disabled)
          showPopupIfMusic();
      });
    }
  });
}
if (isVideoUrl())
  showPopupIfShould();

var oldHref = document.location.href;

function isOneVideoPlaying() {
  var videos = document.getElementsByTagName("video");
  for (var i=0;i<videos.length;i++) {
    var video = videos[i];
    if (video.readyState > 2 && video.currentTime > 0 && !video.paused)
      return true;
  }
  return false;
}

var bodyList = document.querySelector("body"),
observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (oldHref != document.location.href) {
      oldHref = document.location.href;
      if (currentPopup)
        currentPopup.remove();
      if (isVideoUrl()) {
        document.title = "YouTube";
        waitUntil(function() {
          return isOneVideoPlaying() && (document.title != "YouTube");
        }, function() {
          showPopupIfShould();
        });
      }
    }
  });
});

var config = {
  childList: true,
  subtree: true
};

if (bodyList)
  observer.observe(bodyList, config);