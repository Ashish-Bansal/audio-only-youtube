var map = (function() {
    var _maxLength = 200;

    var _map = Object.create(null);
    var _keys = [];

    function map() {
        this.len = function() {
            return _keys.length;
        };

        this.setMaxLength = function(len) {
            _maxLength = len;
        };

        this.getMaxLength = function() {
            return _maxLength;
        };

        this.insert = function(key, value) {
            if (this.len.apply() == this.getMaxLength.apply() &&
                typeof _map[key] == "undefined") {
                var id = _keys.shift();
                delete _map[id];
            }

            _map[key] = value;
            if (!this.contains(key)) {
                _keys.push(key);
            }
        };

        this.value = function(key) {
            return _map[key];
        };

        this.contains = function(key) {
            return typeof _map[key] != "undefined";
        };

        this.remove = function(key) {
            if (this.contains(key)) {
                delete _map[key];
            }
        };

        this.clear = function() {
            _map = Object.create(null);
            _keys = [];
        }
    }

    return map;

})();

function removeURLParameters(url, parameters) {
    parameters.forEach(function(parameter) {
        var urlparts = url.split('?');
        if (urlparts.length >= 2) {
            var prefix = encodeURIComponent(parameter) + '=';
            var pars = urlparts[1].split(/[&;]/g);

            for (var i = pars.length; i-- > 0;) {
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                    pars.splice(i, 1);
                }
            }

            url = urlparts[0] + '?' + pars.join('&');
        }
    });
    return url;
}

var tabIds = new map();

function sendMessage(tabId) {
    if (tabIds.contains(tabId)) {
        chrome.tabs.sendMessage(tabId, {url: tabIds.value(tabId)});
    }
}

function processRequest(details) {
    if (details.url.indexOf('mime=audio') !== -1) {
        var parametersToBeRemoved = ['range', 'rn', 'rbuf'];
        var audioURL = removeURLParameters(details.url, parametersToBeRemoved);
        if (tabIds.value(details.tabId) != audioURL) {
            tabIds.insert(details.tabId, audioURL);
            chrome.tabs.sendMessage(details.tabId, {url: audioURL});
        }
    }
}

function enableExtension() {
    chrome.browserAction.setIcon({
        path : {
            19 : "img/icon19.png",
            38 : "img/icon38.png",
        }
    });
    chrome.tabs.onUpdated.addListener(sendMessage);
    chrome.webRequest.onBeforeRequest.addListener(
        processRequest,
        {urls: ["<all_urls>"]},
        ["blocking"]
    );
}

function disableExtension() {
    chrome.browserAction.setIcon({
        path : {
            19 : "img/disabled_icon19.png",
            38 : "img/disabled_icon38.png",
        }
    });
    chrome.tabs.onUpdated.removeListener(sendMessage);
    chrome.webRequest.onBeforeRequest.removeListener(processRequest);
    tabIds.clear();

}

function saveSettings(disabled) {
    chrome.storage.local.set({'audio_only_youtube_disabled': disabled});
}

chrome.browserAction.onClicked.addListener(function() {
    chrome.storage.local.get('audio_only_youtube_disabled', function(values) {
        var disabled = values.audio_only_youtube_disabled;

        if (disabled) {
            enableExtension();
        } else {
            disableExtension();
        }

        disabled = !disabled;
        saveSettings(disabled);
    });
    chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: "*://www.youtube.com/*"
    }, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        }
    });
});

chrome.storage.local.get('audio_only_youtube_disabled', function(values) {
    var disabled = values.audio_only_youtube_disabled;
    if (typeof disabled === "undefined") {
        disabled = false;
        saveSettings(disabled);
    }

    if (disabled) {
        disableExtension();
    } else {
        enableExtension();
    }
});
