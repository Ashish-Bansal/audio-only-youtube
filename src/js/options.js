// Saves options to chrome.storage
function saveOptions() {
  var showThumbnail = document.getElementById('show-thumbnail');
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
      document.getElementById('show-thumbnail').checked = items.showThumbnail;
    }
  );
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document
  .getElementById('show-thumbnail')
  .addEventListener('change', saveOptions);
