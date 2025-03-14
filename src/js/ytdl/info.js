/* eslint-disable no-unused-vars */
const sax = require('sax');
const utils = require('./utils');
// Forces Node JS version of setTimeout for Electron based applications
const { setTimeout } = require('timers');
const extras = require('./info-extras');
const Cache = require('./cache');
const sig = require('./sig');


const BASE_URL = 'https://www.youtube.com/watch?v=';


// Cached for storing basic/full info.
exports.cache = new Cache();
exports.watchPageCache = new Cache();

// List of URLs that show up in `notice_url` for age restricted videos.
const AGE_RESTRICTED_URLS = [
  'support.google.com/youtube/?p=age_restrictions',
  'youtube.com/t/community_guidelines',
];

/**
 * Gets info from a video without getting additional formats.
 *
 * @param {string} id
 * @param {Object} options
 * @returns {Promise<Object>}
 */
exports.getBasicInfo = async(id, options) => {
  utils.applyDefaultHeaders(options);
  const retryOptions = Object.assign({}, options.requestOptions);
  const info = await retryFunc(getWatchHTMLPage, [id, options], retryOptions);

  const playErr = utils.playError(info.player_response);
  if (playErr) throw playErr;

  // Add additional properties to info.
  const additional = {
    video_url: BASE_URL + id,
  };

  info.videoDetails = extras.cleanVideoDetails(Object.assign({},
    info.player_response && info.player_response.microformat &&
    info.player_response.microformat.playerMicroformatRenderer,
    info.player_response && info.player_response.videoDetails, additional), info);

  return info;
};

const getWatchHTMLURL = (id, options) =>
  `${BASE_URL + id}&hl=${options.lang || 'en'}&bpctr=${Math.ceil(Date.now() / 1000)}&has_verified=1`;
const getWatchHTMLPageBody = (id, options) => {
  const url = getWatchHTMLURL(id, options);
  return exports.watchPageCache.getOrSet(url, () => utils.request(url, options));
};


const EMBED_URL = 'https://www.youtube.com/embed/';
const getEmbedPageBody = (id, options) => {
  const embedUrl = `${EMBED_URL + id}?hl=${options.lang || 'en'}`;
  return utils.request(embedUrl, options);
};


const getHTML5player = body => {
  let html5playerRes =
    /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/
      .exec(body);
  return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
};

/**
 * Given a function, calls it with `args` until it's successful,
 * or until it encounters an unrecoverable error.
 * Currently, any error from miniget is considered unrecoverable. Errors such as
 * too many redirects, invalid URL, status code 404, status code 502.
 *
 * @param {Function} func
 * @param {Array.<Object>} args
 * @param {Object} options
 * @param {number} options.maxRetries
 * @param {Object} options.backoff
 * @param {number} options.backoff.inc
 */
const retryFunc = async(func, args, options) => {
  let currentTry = 0, result;
  if (!options.maxRetries) options.maxRetries = 3;
  if (!options.backoff) options.backoff = { inc: 500, max: 5000 };
  while (currentTry <= options.maxRetries) {
    try {
      result = await func(...args);
      break;
    } catch (err) {
      if ((err && err.statusCode < 500) || currentTry >= options.maxRetries) throw err;
      let wait = Math.min(++currentTry * options.backoff.inc, options.backoff.max);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
  return result;
};


const jsonClosingChars = /^[)\]}'\s]+/;
const parseJSON = (source, varName, json) => {
  if (!json || typeof json === 'object') {
    return json;
  } else {
    try {
      json = json.replace(jsonClosingChars, '');
      return JSON.parse(json);
    } catch (err) {
      throw Error(`Error parsing ${varName} in ${source}: ${err.message}`);
    }
  }
};


const findJSON = (source, varName, body, left, right, prependJSON) => {
  let jsonStr = utils.between(body, left, right);
  if (!jsonStr) {
    throw Error(`Could not find ${varName} in ${source}`);
  }
  return parseJSON(source, varName, utils.cutAfterJS(`${prependJSON}${jsonStr}`));
};


const findPlayerResponse = (source, info) => {
  const player_response = info && (
    (info.args && info.args.player_response) ||
    info.player_response || info.playerResponse || info.embedded_player_response);
  return parseJSON(source, 'player_response', player_response);
};

const getWatchHTMLPage = async(id, options) => {
  let body = await getWatchHTMLPageBody(id, options);
  let info = { page: 'watch' };
  try {
    try {
      info.player_response =
        utils.tryParseBetween(body, 'var ytInitialPlayerResponse = ', '}};', '', '}}') ||
        utils.tryParseBetween(body, 'var ytInitialPlayerResponse = ', ';var') ||
        utils.tryParseBetween(body, 'var ytInitialPlayerResponse = ', ';</script>') ||
        findJSON('watch.html', 'player_response', body, /\bytInitialPlayerResponse\s*=\s*\{/i, '</script>', '{');
    } catch (_e) {
      let args = findJSON('watch.html', 'player_response', body, /\bytplayer\.config\s*=\s*{/, '</script>', '{');
      info.player_response = findPlayerResponse('watch.html', args);
    }

    info.response =
      utils.tryParseBetween(body, 'var ytInitialData = ', '}};', '', '}}') ||
      utils.tryParseBetween(body, 'var ytInitialData = ', ';</script>') ||
      utils.tryParseBetween(body, 'window["ytInitialData"] = ', '}};', '', '}}') ||
      utils.tryParseBetween(body, 'window["ytInitialData"] = ', ';</script>') ||
      findJSON('watch.html', 'response', body, /\bytInitialData("\])?\s*=\s*\{/i, '</script>', '{');
    info.html5player = getHTML5player(body);
  } catch (_) {
    throw Error(
      'Error when parsing watch.html, maybe YouTube made a change.\n' +
      `Please report this issue on https://github.com/distubejs/ytdl-core/issues.`,
    );
  }
  return info;
};

/**
 * @param {Object} player_response
 * @returns {Array.<Object>}
 */
const parseFormats = player_response => {
  let formats = [];
  if (player_response && player_response.streamingData) {
    formats = formats
      .concat(player_response.streamingData.formats || [])
      .concat(player_response.streamingData.adaptiveFormats || []);
  }
  return formats;
};

// TODO: Clean up this function for readability and support more clients
/**
 * Gets info from a video additional formats and deciphered URLs.
 *
 * @param {string} id
 * @param {Object} options
 * @returns {Promise<Object>}
 */
exports.getInfo = async(id, options) => {
  utils.applyDefaultHeaders(options);
  const info = await exports.getBasicInfo(id, options);
  let funcs = [];
    // Bring back web-scraping for now. TODO: tv client
    info.html5player = info.html5player ||
      getHTML5player(await getWatchHTMLPageBody(id, options)) || getHTML5player(await getEmbedPageBody(id, options));
    if (!info.html5player) {
      throw Error('Unable to find html5player file');
    }
    const html5player = new URL(info.html5player, BASE_URL).toString();
    funcs.push(sig.decipherFormats(parseFormats(info.player_response), html5player, options));
    if (info.player_response && info.player_response.streamingData) {
      if (info.player_response.streamingData.dashManifestUrl) {
        let url = info.player_response.streamingData.dashManifestUrl;
        funcs.push(getDashManifest(url, options));
      }
      if (info.player_response.streamingData.hlsManifestUrl) {
        let url = info.player_response.streamingData.hlsManifestUrl;
        funcs.push(getM3U8(url, options));
      }
    }

  let results = await Promise.all(funcs);
  info.formats = Object.values(Object.assign({}, ...results));
  info.formats = info.formats.map(utils.addFormatMeta);

  info.full = true;
  return info;
};

/**
 * Gets additional DASH formats.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Array.<Object>>}
 */
const getDashManifest = (url, options) => new Promise((resolve, reject) => {
  let formats = {};
  const parser = sax.parser(false);
  parser.onerror = reject;
  let adaptationSet;
  parser.onopentag = node => {
    if (node.name === 'ADAPTATIONSET') {
      adaptationSet = node.attributes;
    } else if (node.name === 'REPRESENTATION') {
      const itag = parseInt(node.attributes.ID);
      if (!isNaN(itag)) {
        formats[url] = Object.assign({
          itag,
          url,
          bitrate: parseInt(node.attributes.BANDWIDTH),
          mimeType: `${adaptationSet.MIMETYPE}; codecs="${node.attributes.CODECS}"`,
        }, node.attributes.HEIGHT ? {
          width: parseInt(node.attributes.WIDTH),
          height: parseInt(node.attributes.HEIGHT),
          fps: parseInt(node.attributes.FRAMERATE),
        } : {
          audioSampleRate: node.attributes.AUDIOSAMPLINGRATE,
        });
      }
    }
  };
  parser.onend = () => {
    resolve(formats);
  };
  utils.request(new URL(url, BASE_URL).toString(), options).then(res => {
    parser.write(res);
    parser.close();
  }).catch(reject);
});


/**
 * Gets additional formats.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Promise<Array.<Object>>}
 */
const getM3U8 = async(url, options) => {
  url = new URL(url, BASE_URL);
  const body = await utils.request(url.toString(), options);
  let formats = {};
  body
    .split('\n')
    .filter(line => /^https?:\/\//.test(line))
    .forEach(line => {
      const itag = parseInt(line.match(/\/itag\/(\d+)\//)[1]);
      formats[line] = { itag, url: line };
    });
  return formats;
};
