const showThumbnail: any = document.getElementById('show-thumbnail');
const autoEnableOnExit: any = document.getElementById('auto-enable-on-exit');

// Saves options to chrome.storage
function saveOptions() {
  chrome.storage.sync.set({
    showThumbnail: showThumbnail.checked,
    autoEnableOnExit: autoEnableOnExit.checked
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showThumbnail: true,
      autoEnableOnExit: false,
    },
    function(items) {
      showThumbnail.checked = items.showThumbnail;
      autoEnableOnExit.checked = items.autoEnableOnExit;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
showThumbnail.addEventListener('change', saveOptions);
autoEnableOnExit.addEventListener('change', saveOptions);
