const showThumbnail: any = document.getElementById('show-thumbnail');
const autoEnableOnExit: any = document.getElementById('auto-enable-on-exit');
const promptIfMusic: any = document.getElementById('prompt-if-music');
const promptIfNotMusic: any = document.getElementById('prompt-if-not-music');

// Saves options to chrome.storage
function saveOptions() {
  chrome.storage.sync.set({
    showThumbnail: showThumbnail.checked,
    autoEnableOnExit: autoEnableOnExit.checked,
    promptIfMusic: promptIfMusic.checked,
    promptIfNotMusic: promptIfNotMusic.checked
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showThumbnail: true,
      autoEnableOnExit: false,
      promptIfMusic: false,
      promptIfNotMusic: false
    },
    function(items) {
      showThumbnail.checked = items.showThumbnail;
      autoEnableOnExit.checked = items.autoEnableOnExit;
      promptIfMusic.checked = items.promptIfMusic;
      promptIfNotMusic.checked = items.promptIfNotMusic;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
showThumbnail.addEventListener('change', saveOptions);
autoEnableOnExit.addEventListener('change', saveOptions);
promptIfMusic.addEventListener('change', saveOptions);
promptIfNotMusic.addEventListener('change', saveOptions);
