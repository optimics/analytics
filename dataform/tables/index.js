function formatDate(date) {
  return String(
    date.getFullYear() * 1e4 + (date.getMonth() + 1) * 100 + date.getDate(),
  )
}

/** Get date from n-days ago and return it in numeric format without time.
 * @example 20230603
 */
function getNumericDateFormat(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return formatDate(date)
}
  
const eventsPrefix = 'events_'
const intradayPrefix = 'intraday_'

function getEventsName(formattedDate) {
  return `${eventsPrefix}${formattedDate}`
}

function getIntradayEventsName(formattedDate) {
  return `${eventsPrefix}${intradayPrefix}${formattedDate}`
}

/** Construct GA4 table name based on the date
 * @param {number} daysAgo
 * @returns string
 */
function getHistoricalTableName(daysAgo) {
  const formattedDate = getNumericDateFormat(daysAgo)
  return daysAgo === 1
    ? getIntradayEventsName(formattedDate)
    : getEventsName(formatDate)
}

module.exports = {
  formatDate,
  getEventsName,
  getHistoricalTableName,
  getIntradayEventsName,
  getNumericDateFormat,
}
