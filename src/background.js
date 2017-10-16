const removeURLParameters = (url, parameters) => {
    parameters.forEach(parameter => {
        const urlparts = url.split('?');
        if (urlparts.length < 2) return;
        const prefix = encodeURIComponent(parameter) + '=';
        const pars = urlparts[1]
                .split(/[&;]/g)
                .filter(par => par.lastIndexOf(prefix,0) === -1);

        url = `${urlparts[0]}?${pars.join('&')}`;
    });
    return url;
};

const saveSettings = (tab) => {
    chrome.tabs.query({}, allTabs => {
        chrome.storage.local.get('audio_only_youtube_disabled', values => {
            let aoySettings = values.audio_only_youtube_disabled;
            if(!aoySettings.push)
                aoySettings = [];
            
            //Cleanning up unnecessary tab info
            aoySettings = aoySettings.filter(tabSettings => {
                if(tabSettings.tabId === tab.id) return false;
                return allTabs.find(t => t.id === tabSettings.tabId);
            });
            aoySettings.push({
                'tabId': tab.id,
                'aoyDisabled': tab.aoyDisabled
            });
            chrome.storage.local.set({
                'audio_only_youtube_disabled': aoySettings
            });
        });
    });
};

const getSettings = () => {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if(!tabs)
                tabs = [];

            const tab = {...tabs[0]};
            if(!tab.id) return;
            chrome.storage.local.get('audio_only_youtube_disabled', (values) => {
                let aoySettings = values.audio_only_youtube_disabled;
                if(!aoySettings.find)
                    aoySettings = [];

                aoySettings = aoySettings.find(tabSettings => tabSettings.tabId === tab.id);

                const tabSettings = {...aoySettings};
                tab.aoyDisabled = tabSettings.aoyDisabled;
                resolve(tab);
            });
        });
    });
};
const extensionClick = () => {
    getSettings().then(
    tab => {
        tab.aoyDisabled = !tab.aoyDisabled;
        saveSettings(tab);
        updateTab();
    });
};

const sendMessage = tabDetails => {
    getSettings().then(
    tab => {
        if(tab.id !== tabDetails.id) return;

        if(typeof tab.aoyDisabled === "undefined")
            tab.aoyDisabled = true;

        if(!tab.aoyDisabled)
            chrome.tabs.sendMessage(tabDetails.id, tabDetails);
    });
};

const processRequest = details => {
    if (details.url.indexOf('mime=audio') === -1) return;
    const parametersToBeRemoved = ['range', 'rn', 'rbuf'];
    const tabDetails = {
        id: details.tabId,
        url: removeURLParameters(details.url, parametersToBeRemoved)
    }
    sendMessage(tabDetails);
};

const checkTab = () => {
    getSettings().then(
    tab => {
        if(typeof tab.aoyDisabled === "undefined")
            tab.aoyDisabled = true;

        handleExtension(tab.aoyDisabled);
        saveSettings(tab);
    });
};

const updateTab = () => {
    chrome.tabs.query({
        active: true,
        currentWindow: true,
        url: "*://www.youtube.com/*"
    }, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        }
    });
};

const handleListeners = () => {
    chrome.tabs.onUpdated.removeListener(checkTab);
    chrome.tabs.onUpdated.addListener(checkTab);

    chrome.tabs.onActivated.removeListener(checkTab);
    chrome.tabs.onActivated.addListener(checkTab);
    
    chrome.browserAction.onClicked.removeListener(extensionClick);
    chrome.browserAction.onClicked.addListener(extensionClick);
};

const handleExtension = (disabled) => {
    const imgStr = (disabled) ? "disabled_" : "";

    chrome.browserAction.setIcon({
        path : {
            19 : "img/"+imgStr+"icon19.png",
            38 : "img/"+imgStr+"icon38.png",
        }
    });

    chrome.webRequest.onBeforeRequest.removeListener(processRequest);
    
    if(disabled) return;

    chrome.webRequest.onBeforeRequest.addListener(
        processRequest,
        {urls: ["<all_urls>"]},
        ["blocking"]
    );

};

handleListeners();