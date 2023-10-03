# `@optimics/dataform-utm-source-filter`

![npm](https://img.shields.io/npm/dm/%40optimics/dataform-utm-source-filter)
![npm (scoped)](https://img.shields.io/npm/v/%40optimics/dataform-utm-source-filter)

> Consolidate your e-shop orders by UTM source.

## Overview

This Dataform package is designed to help e-shops evaluate the contribution of
`utm_source` on purchases. It extracts information about sessions that started
with the `utm_source` parameter and stores it in a new dataset in BigQuery. The
name of the dataset will be `partner_export_daily_ga4`.

## Before you begin

Install the package `@optimics/dataform-utm-source-filter` to your dataform.
Refer to our [dataform workflow](../README.md), if you need help. The current
package version is ![npm
(scoped)](https://img.shields.io/npm/v/%40optimics/dataform-utm-source-filter)

## Configuration

1. In the `definitions` directory, create a `.sqlx` file.
2. Insert the following code into the `.sqlx` file:

```sqlx
config {
  type: "incremental",
  schema: "partner_export_daily_ga4",
}

${intraday.query}
```

3. In the `includes` directory, create a `.js` file.
4. Insert the following code into the `.js` file:

```javascript
const { createIntradayTable } = require('@optimics/dataform-utm-source-filter')
const query = createIntradayTable({
  ga4Dataset: '{YOUR GOOGLE CLOUD PROJECT ID}.{YOUR DATASET ID}',
  utmSource: '{YOUR UTM SOURCE}'
})
module.exports = { query }
```
