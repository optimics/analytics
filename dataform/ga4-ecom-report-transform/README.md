# UTM Source Filter

## Overview

This Dataform package is designed to help e-shops evaluate the contribution of
`utm_source` on purchases. It extracts information about sessions that started
with the `utm_source` parameter and stores it in a new dataset in BigQuery. The
name of the dataset will be `partner_export_daily_ga4`.

## Setting Up Dataform Repository

To set up the Dataform repository and enable the tool through the Google Cloud
Platform API, follow these steps:

1. Navigate to [BigQuery >
   Dataform](https://console.cloud.google.com/bigquery/dataform) in the Google
Cloud Platform Console.
2. Create a Dataform repository. If you are located in the EU, choose the EU
   data region (e.g., `europe-west1`).
3. Connect the created repository with your Git repository.

## Creating a Development Workspace

To create a development workspace for your Dataform project, perform the
following steps:

1. Initialize the workspace.
2. After completing the initialization, Dataform will automatically generate
   two files in the `definitions` directory. You can delete these files as they
   are not required.

## Installing the npm Package

To install the `npm` package and add it to your Dataform workspace, follow
these steps:

1. Go to your Dataform workspace.
2. Add `@optimics/dataform-utm-source-filter` to your package.json dependencies:

```json
{
    "dependencies": {
        "@optimics/dataform-utm-source-filter": "^0.2"
    }
}
```

3. Click on "Install package" to install the package.

## Configuring the SQLX and JS Files

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

## Committing and Pushing Changes

Once you have made the necessary changes to the repository, commit the changes
and push them to the branch.
