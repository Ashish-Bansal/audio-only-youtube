// Saves options to chrome.storage
function save_options() {
  var showThumbnail = document.getElementById('show-thumbnail');
  chrome.storage.sync.set({
    showThumbnail: showThumbnail.checked
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    showThumbnail: true
  }, function(items) {
    document.getElementById('show-thumbnail').checked = items.showThumbnail;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('show-thumbnail').addEventListener('change', save_options);