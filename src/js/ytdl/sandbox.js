const querystring = require('querystring');

const evaluationPromiseMapping = new Map()
let creating; // A global promise to avoid concurrency issues
async function setupSandbox() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: 'html/offscreen.html',
      reasons: ['DOM_SCRAPING'],
      justification: 'Create Sandbox document for running evals',
    });
    await creating;
    creating = null;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.target !== 'background') {
        return false;
    }

    const resolver = evaluationPromiseMapping.get(message.data.messageId)
    if (!resolver) return false;
    resolver(message.data.result)
  });
}

const randomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

const evaluateInSandbox = async (script, argumentName, argumentValue) => {
  await setupSandbox();

  return new Promise(async (resolve, reject) => {
    const messageId = randomString(20)
    evaluationPromiseMapping.set(messageId, resolve)

    // Post the code to the iframe for evaluation
    chrome.runtime.sendMessage({
      target: 'offscreen',
      data: { script, argumentName, argumentValue, messageId }
    });
  });
}

const DECIPHER_ARGUMENT = "sig";
const N_ARGUMENT = "ncode";

/**
 * Apply decipher and n-transform to individual format
 *
 * @param {Object} format
 * @param {string} decipherScript
 * @param {string} nTransformScript
 */
exports.setDownloadURL = async (format, decipherScript, nTransformScript) => {
    if (!decipherScript) return;

    const decipher = async url => {
      const args = querystring.parse(url);
      if (!args.s) return args.url;
      const components = new URL(decodeURIComponent(args.url));
      const signature = await evaluateInSandbox(decipherScript, DECIPHER_ARGUMENT, decodeURIComponent(args.s))
      components.searchParams.set(args.sp || 'sig', signature);
      return components.toString();
    };

    const nTransform = async url => {
      const components = new URL(decodeURIComponent(url));
      const n = components.searchParams.get('n');
      if (!n || !nTransformScript) return url;
      const transformedN = await evaluateInSandbox(nTransformScript, N_ARGUMENT, n)
      components.searchParams.set('n', transformedN);
      return components.toString();
    };

    const cipher = !format.url;
    const url = format.url || format.signatureCipher || format.cipher;
    format.url = await nTransform(cipher ? await decipher(url) : url);
    delete format.signatureCipher;
    delete format.cipher;
  };