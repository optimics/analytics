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

/** Construct GA4 table name based on the date
 * @param {number} daysAgo
 * @returns string
 */
function getHistoricalTableName(daysAgo) {
  const prefix_universal = 'events_'
  const prefix_intraday = daysAgo === 1 ? 'intraday_' : ''
  const formattedDate = getNumericDateFormat(daysAgo)
  return `${prefix_universal}${prefix_intraday}${formattedDate}`
}

module.exports = {
  formatDate,
  getHistoricalTableName,
  getNumericDateFormat,
}
