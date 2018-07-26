const showThumbnail: any = document.getElementById('show-thumbnail');

// Saves options to chrome.storage
function saveOptions(): void {
  if (showThumbnail) {
    chrome.storage.sync.set({
      showThumbnail: showThumbnail.checked,
    });
  }
}

if (showThumbnail) {
  document.addEventListener('change', saveOptions);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showThumbnail: true,
    },
    (items) => {
      showThumbnail.checked = items.showThumbnail;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
