const showThumbnail: any = document.getElementById('show-thumbnail');
const autoSaveBandwidth: any = document.getElementById('auto-save-bandwidth');

// Saves options to chrome.storage
function saveOptions(): void {
  if (showThumbnail) {
    chrome.storage.sync.set({
      autoSaveBandwidth: autoSaveBandwidth.checked,
      showThumbnail: showThumbnail.checked,
    });
  }
}

if (showThumbnail || autoSaveBandwidth) {
  document.addEventListener('change', saveOptions);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions(): void {
  chrome.storage.sync.get(
    {
      autoSaveBandwidth: true,
      showThumbnail: true,
    },
    (items) => {
      autoSaveBandwidth.checked = items.autoSaveBandwidth;
      showThumbnail.checked = items.showThumbnail;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
