const utils = require('./utils');

const getText = obj => obj ? obj.runs ? obj.runs[0].text : obj.simpleText : null;

/**
 * Cleans up a few fields on `videoDetails`.
 *
 * @param {Object} videoDetails
 * @param {Object} info
 * @returns {Object}
 */
exports.cleanVideoDetails = (videoDetails, info) => {
  videoDetails.thumbnails = videoDetails.thumbnail.thumbnails;
  delete videoDetails.thumbnail;
  utils.deprecate(videoDetails, 'thumbnail', { thumbnails: videoDetails.thumbnails },
    'videoDetails.thumbnail.thumbnails', 'videoDetails.thumbnails');
  videoDetails.description = videoDetails.shortDescription || getText(videoDetails.description);
  delete videoDetails.shortDescription;
  utils.deprecate(videoDetails, 'shortDescription', videoDetails.description,
    'videoDetails.shortDescription', 'videoDetails.description');

  // Use more reliable `lengthSeconds` from `playerMicroformatRenderer`.
  videoDetails.lengthSeconds =
    (info.player_response.microformat &&
    info.player_response.microformat.playerMicroformatRenderer.lengthSeconds) ||
    info.player_response.videoDetails.lengthSeconds;
  return videoDetails;
};
