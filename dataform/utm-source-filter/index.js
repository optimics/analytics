/** Get date from n-days ago and return it in numeric format without time.
 * @example 20230603
 */
function getNumericDateFormat(daysAgo) {
    let date = new Date();
    date.setDate(date.getDate() + daysAgo);
    return date.getFullYear() * 1e4 + (date.getMonth() +1) * 100 + date.getDate() + ''
}

const timeDiff = 2
const formatedDateThirtyDays = getNumericDateFormat(-(timeDiff + 14));
const formatedDateTwoDays = getNumericDateFormat(-(timeDiff + 1))
const formatedDateOneDays = getNumericDateFormat(-timeDiff)

const GA4_TABLE_THIRTYDAYS_AGO = formatedDateThirtyDays;
const GA4_TABLE_TWODAYS_AGO = formatedDateTwoDays;
const GA4_TABLE_ONEDAY_AGO = 'events_' + (timeDiff == 1 ? 'intraday_' : '' ) + formatedDateOneDays;

/** Return intraday table specific for utm source customers as a string
 * @param config.ga4Dataset The Fully Qualified dataset name prefixed with GCP project name
 * @example 'my-domain.cz'
 * @param config.utmSource The UTM Source, as it is received from URL
 * @example 'my-project.my-dataset'
 * @return string
 */
function createIntradayTable({ ga4Dataset, utmSource }) {
  function ref(sourceName) {
    return `${ga4Dataset}.${sourceName}`
  }

    return `
    /* Nápočet posledního znamého souce během posledních 30 dní */
WITH 
  last_sources AS (
  SELECT  
    DISTINCT(user_pseudo_id),
    MAX(event_timestamp) last_timestamp,
    (select value.string_value from unnest(event_params) where key = 'source') AS source,
  FROM \`${ga4Dataset}.events_*\`
  WHERE
    _table_suffix between '${GA4_TABLE_THIRTYDAYS_AGO}' and '${GA4_TABLE_TWODAYS_AGO}'
    AND
    (select value.string_value from unnest(event_params) where key = 'source') = '${utmSource}'
  GROUP BY user_pseudo_id, source

  UNION ALL

  SELECT  
    DISTINCT(user_pseudo_id),
    MAX(event_timestamp) last_timestamp,
    (select value.string_value from unnest(event_params) where key = 'source') AS source,
  FROM ${ref(GA4_TABLE_ONEDAY_AGO)}
  WHERE
    (select value.string_value from unnest(event_params) where key = 'source') = '${utmSource}'
  GROUP BY user_pseudo_id, source

),

/* Dotazování na e-commerce data */

ecommerce_data AS (
  SELECT
    event_date,
    user_pseudo_id,
    (select value.string_value from unnest(event_params) where key = 'page_location') AS page_location,
    (select value.string_value from unnest(event_params) where key = 'source') AS source,
    (select value.string_value from unnest(event_params) where key = 'medium') AS medium,
    event_name,
    event_timestamp,
    current_timestamp() AS ts,
    timestamp_micros(event_timestamp) AS timestamp_micro,
    ecommerce.transaction_id,
    item_revenue,
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
    quantity
FROM 
    ${ref(GA4_TABLE_ONEDAY_AGO)}, UNNEST(items)
WHERE
    event_name = 'purchase'
ORDER BY event_timestamp
)

/* Left join aktuálních transakcích a až měsíc starých sources */

SELECT
  ecommerce_data.user_pseudo_id,
  ecommerce_data.event_date,
  last_sources.source,
  ecommerce_data.transaction_id,
  ecommerce_data.item_id,
  ecommerce_data.item_name,
  ecommerce_data.item_revenue,
  ecommerce_data.item_brand,
  ecommerce_data.item_variant,
  ecommerce_data.item_category,
  ecommerce_data.item_category2,
  ecommerce_data.item_category3,
  ecommerce_data.item_category4,
  ecommerce_data.item_category5,
  ecommerce_data.price_in_usd,
  ecommerce_data.price,
  ecommerce_data.quantity
FROM ecommerce_data
LEFT JOIN last_sources
  ON ecommerce_data.user_pseudo_id = last_sources.user_pseudo_id
WHERE
  last_sources.source = '${utmSource}'
ORDER BY event_date
    `
}

module.exports = {
  createIntradayTable,
}
