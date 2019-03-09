const showThumbnail: any = document.getElementById('show-thumbnail');

// Saves options to chrome.storage
function saveOptions() {
  chrome.storage.sync.set({
    showThumbnail: showThumbnail.checked,
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showThumbnail: true,
    },
    function(items) {
      showThumbnail.checked = items.showThumbnail;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
showThumbnail.addEventListener('change', saveOptions);
