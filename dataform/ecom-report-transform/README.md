# `@optimics/dataform-ecom-report-transform`

![npm](https://img.shields.io/npm/dm/%40optimics/dataform-ecom-report-transform)
![npm (scoped)](https://img.shields.io/npm/v/%40optimics/dataform-ecom-report-transform)

> Transform GA4 ecommerce data into reportful tables.

## Overview

This Dataform package is designed to help e-shops evaluate ecommerce data from
Google Analaytics 4. It extracts information about ecommerce events and item parameters
and stores it in a new dataset in BigQuery. The name of the dataset will be `ga4_datamart`.

## Before you begin

Install the package `@optimics/dataform-ecom-report-transform` to your dataform.
Refer to our [dataform workflow](../README.md), if you need help. The current
package version is ![npm
(scoped)](https://img.shields.io/npm/v/%40optimics/dataform-ecom-report-transform)

## Configuration

1. In the `definitions` directory, create a `.sqlx` file.
2. Insert the following code into the `.sqlx` file:

```sqlx
config {
    type: "incremental",
    schema: "ga4_datamart",
}

${ecom.query}

```

3. In the `includes` directory, create a `ecom.js` file.
4. Insert the following code into the `.js` file:

```javascript
const { getEcomQuery } = require('@optimics/dataform-ecom-report-transform')
const query = getEcomQuery({
    ga4Dataset: 'optimics.analytics_12345678', 
    rangeCap: 30
})

module.exports = { query }
```
