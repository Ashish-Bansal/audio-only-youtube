import axios from 'axios';
const FORMATS = require('./formats')


/**
 * Extract string inbetween another.
 *
 * @param {string} haystack
 * @param {string} left
 * @param {string} right
 * @returns {string}
 */
const between = exports.between = (haystack, left, right) => {
  let pos;
  if (left instanceof RegExp) {
    const match = haystack.match(left);
    if (!match) { return ''; }
    pos = match.index + match[0].length;
  } else {
    pos = haystack.indexOf(left);
    if (pos === -1) { return ''; }
    pos += left.length;
  }
  haystack = haystack.slice(pos);
  pos = haystack.indexOf(right);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(0, pos);
  return haystack;
};

exports.tryParseBetween = (body, left, right, prepend = '', append = '') => {
  try {
    let data = between(body, left, right);
    if (!data) return null;
    return JSON.parse(`${prepend}${data}${append}`);
  } catch (e) {
    return null;
  }
};


/**
 * Escape sequences for cutAfterJS
 * @param {string} start the character string the escape sequence
 * @param {string} end the character string to stop the escape seequence
 * @param {undefined|Regex} startPrefix a regex to check against the preceding 10 characters
 */
const ESCAPING_SEQUENZES = [
  // Strings
  { start: '"', end: '"' },
  { start: "'", end: "'" },
  { start: '`', end: '`' },
  // RegeEx
  { start: '/', end: '/', startPrefix: /(^|[[{:;,/])\s?$/ },
];

/**
 * Match begin and end braces of input JS, return only JS
 *
 * @param {string} mixedJson
 * @returns {string}
*/
exports.cutAfterJS = mixedJson => {
  // Define the general open and closing tag
  let open, close;
  if (mixedJson[0] === '[') {
    open = '[';
    close = ']';
  } else if (mixedJson[0] === '{') {
    open = '{';
    close = '}';
  }

  if (!open) {
    throw new Error(`Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`);
  }

  // States if the loop is currently inside an escaped js object
  let isEscapedObject = null;

  // States if the current character is treated as escaped or not
  let isEscaped = false;

  // Current open brackets to be closed
  let counter = 0;

  let i;
  // Go through all characters from the start
  for (i = 0; i < mixedJson.length; i++) {
    // End of current escaped object
    if (!isEscaped && isEscapedObject !== null && mixedJson[i] === isEscapedObject.end) {
      isEscapedObject = null;
      continue;
    // Might be the start of a new escaped object
    } else if (!isEscaped && isEscapedObject === null) {
      for (const escaped of ESCAPING_SEQUENZES) {
        if (mixedJson[i] !== escaped.start) continue;
        // Test startPrefix against last 10 characters
        if (!escaped.startPrefix || mixedJson.substring(i - 10, i).match(escaped.startPrefix)) {
          isEscapedObject = escaped;
          break;
        }
      }
      // Continue if we found a new escaped object
      if (isEscapedObject !== null) {
        continue;
      }
    }

    // Toggle the isEscaped boolean for every backslash
    // Reset for every regular character
    isEscaped = mixedJson[i] === '\\' && !isEscaped;

    if (isEscapedObject !== null) continue;

    if (mixedJson[i] === open) {
      counter++;
    } else if (mixedJson[i] === close) {
      counter--;
    }

    // All brackets have been closed, thus end of JSON is reached
    if (counter === 0) {
      // Return the cut JSON
      return mixedJson.substring(0, i + 1);
    }
  }

  // We ran through the whole string and ended up with an unclosed bracket
  throw Error("Can't cut unsupported JSON (no matching closing bracket found)");
};

class UnrecoverableError extends Error {}
/**
 * Checks if there is a playability error.
 *
 * @param {Object} player_response
 * @returns {!Error}
 */
exports.playError = player_response => {
  const playability = player_response && player_response.playabilityStatus;
  if (!playability) return null;
  if (['ERROR', 'LOGIN_REQUIRED'].includes(playability.status)) {
    return new UnrecoverableError(playability.reason || (playability.messages && playability.messages[0]));
  }
  if (playability.status === 'LIVE_STREAM_OFFLINE') {
    return new UnrecoverableError(playability.reason || 'The live stream is offline.');
  }
  if (playability.status === 'UNPLAYABLE') {
    return new UnrecoverableError(playability.reason || 'This video is unavailable.');
  }
  return null;
};

exports.request = async (url, options = {}) => {
  const { requestOptions } = options;

  try {
    const response = await axios({
      url,
      ...requestOptions,
      validateStatus: (status) => true, // Allow handling of all status codes manually
    });

    const code = response.status.toString();

    if (code.startsWith('2')) {
      if (response.headers['content-type'] && response.headers['content-type'].includes('application/json')) {
        return response.data;
      }
      return response.data;
    }

    if (code.startsWith('3')) {
      const location = response.headers['location'];
      if (location) {
        return exports.request(location, options);
      }
    }

    const e = new Error(`Status code: ${code}`);
    e.statusCode = response.status;
    throw e;

  } catch (error) {
    throw error;
  }
};

/**
 * Temporary helper to help deprecating a few properties.
 *
 * @param {Object} obj
 * @param {string} prop
 * @param {Object} value
 * @param {string} oldPath
 * @param {string} newPath
 */
exports.deprecate = (obj, prop, value, oldPath, newPath) => {
  Object.defineProperty(obj, prop, {
    get: () => {
      console.warn(`\`${oldPath}\` will be removed in a near future release, ` +
        `use \`${newPath}\` instead.`);
      return value;
    },
  });
};

exports.applyDefaultHeaders = options => {
  options.requestOptions = Object.assign({}, options.requestOptions);
  options.requestOptions.headers = Object.assign({}, {
    // eslint-disable-next-line max-len
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
  }, options.requestOptions.headers);
};

exports.addFormatMeta = format => {
  format = Object.assign({}, FORMATS[format.itag], format);
  format.hasVideo = !!format.qualityLabel;
  format.hasAudio = !!format.audioBitrate;
  format.container = format.mimeType ?
    format.mimeType.split(';')[0].split('/')[1] : null;
  format.codecs = format.mimeType ?
    between(format.mimeType, 'codecs="', '"') : null;
  format.videoCodec = format.hasVideo && format.codecs ?
    format.codecs.split(', ')[0] : null;
  format.audioCodec = format.hasAudio && format.codecs ?
    format.codecs.split(', ').slice(-1)[0] : null;
  format.isLive = /\bsource[/=]yt_live_broadcast\b/.test(format.url);
  format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
  format.isDashMPD = /\/manifest\/dash\//.test(format.url);
  return format;
};
