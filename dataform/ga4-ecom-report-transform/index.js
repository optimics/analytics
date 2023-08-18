const {
  getNumericDateFormat,
  getHistoricalTableName,
} = require('@optimics/dataform-tables')

const helper = require('./eventParams.js')

/** Return intraday table specific for utm source customers as a string
 * @param config.ga4Dataset The Fully Qualified dataset name prefixed with GCP project name
 * @example 'my-domain.cz'
 * @param config.utmSource The UTM Source, as it is received from URL
 * @param config.rangeCap How many days into the past should we download
 * @example 'my-project.my-dataset'
 * @return string
 */
function createIntradayTable({ ga4Dataset, rangeCap }) {
  const yesterday = getNumericDateFormat(-1)
  const yesterdayTable = getHistoricalTableName(1)
  const rangeCapDate = rangeCap ? getNumericDateFormat(rangeCap) : undefined

  function ref(sourceName) {
    return `${ga4Dataset}.${sourceName}`
  }

  const rangeCapFilter = rangeCapDate
    ? `
    _table_suffix BETWEEN '${rangeCapDate}' AND '${yesterday}'
    AND
  `
    : ''

  return `
SELECT
  event_date,
  event_name,
  event_timestamp,
  current_timestamp() as ts,
  timestamp_micros(event_timestamp) as timestamp_micro,
  user_pseudo_id,
  user_id,
  ecommerce.transaction_id,
  item_id,
  item_name,
  item_brand,
  item_variant,
  item_category,
  item_category2,
  item_category3,
  item_category4,
  item_category5,
  price_in_usd,
  price,
  quantity,
  item_revenue_in_usd,
  item_revenue,
  item_refund_in_usd,
  item_refund,
  coupon,
  affiliation,
  location_id,
  item_list_id,
  item_list_name,
  item_list_index,
  promotion_id,
  promotion_name,
  creative_name,
  creative_slot,
  ${helper.getEventParam('page_location')},
  ${helper.getEventParam('entrances')},
  ${helper.getEventParam('source')},
  ${helper.getEventParam('medium')},
  ${helper.getEventParam('ga_session_number')},
  ${helper.getEventParam('session_engaged')},
  ${helper.getEventParam('ignore_referrer')},
  ${helper.getEventParam('gclid')},
  ${helper.getEventParam('page_referrer')},
  ${helper.getEventParam('ga_session_id', 'int')},
FROM 
  ${ref(yesterdayTable)}, UNNEST(items)
WHERE
  ${rangeCapFilter}
  event_name IN ('add_payment_info', 'add_shipping_info', 'add_to_cart', 'add_to_wishlist', 'begin_checkout', 'refund', 'remove_from_cart', 'select_item', 'select_promotion', 'view_cart', 'view_item', 'view_item_list', 'view_promotion', 'purchase')
    `
}

module.exports = {
  createIntradayTable,
}
