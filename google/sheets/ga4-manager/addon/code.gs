function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

/* Analytics sync methods */

const apiUrl = 'https://ga4-sg-manager-api-bu7dtw5lpq-ez.a.run.app/'

function syncAnalytics() {
  UrlFetchApp.fetch(apiUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      docId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    }),
  })
}

/* General UI methods */

const menuTitle = 'Analytics'
const interestingSheetTitles = [
  'GA4: Custom Dimensions',
  'GA4: Custom Metrics',
  'GA4: Conversion Events',
].map(camelize)

function getNormalizedSheetTitles () {
  return SpreadsheetApp.getActive().getSheets().map(sheet => camelize(sheet.getName()))
}

function hasInterestingSheets () {
  return getNormalizedSheetTitles().some(title => interestingSheetTitles.includes(title))
}

function createMenu() {
  SpreadsheetApp.getUi().createMenu(menuTitle).addItem('Deploy GA4 Config', 'syncAnalytics').addToUi()
}

function removeMenu () {
  SpreadsheetApp.getUi().removeMenu(menuTitle)
}

/** Reactively update the addon UI based on the workspace UI state */
function renderUi () {
  if (hasInterestingSheets()) {
    createMenu()
  } else {
    removeMenu()
  }
}

/** Render the UI when document is opened */
function onOpen () {
  renderUi()
}

/** React to document changes */
function onChange (e) {
  if (e.changeType === 'INSERT_GRID' || e.changeType === 'REMOVE_GRID') {
    renderUi()
  }
}