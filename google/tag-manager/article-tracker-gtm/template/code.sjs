/* This script is written using the Google "sAnDbOxEd jAvAsCrIpT", a shitty
 * invention based on shitty principles. That means, there will be no tests, no
 * linting and no code metrics on this piece. */

const injectScript = require('injectScript');
const copyFromWindow = require('copyFromWindow');
const getTimestampMillis = require('getTimestampMillis');
const connectTracking = () => {
  const at = copyFromWindow('articleTracker');
  at.trackArticle({
    selector: data.selector,
    resolveContentTypes: data.contentTypes,
    connectedEvents: data.connectedEvents,
    extraProps: data.extraProps,
    trackDefaultContentTypes: data.trackDefaultContentTypes,
  });
  data.gtmOnSuccess();
};

injectScript(
  data.staging ? ('{{atLibStagingUrl}}?cacheBreak=' + getTimestampMillis()) : '{{atLibUrl}}',
  connectTracking,
  data.gtmOnFailure,
  'article-tracker'
);
