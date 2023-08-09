# `@ga4/manager`

> Synchronizes Google Analytics 4 configuration

This tool takes a data source, parses the GA4 configuration and then sets GA4
the way it was desired. Currently, it can synchronize:

* Custom Metrics

## Prerequisites

* Node.js >= 18
* npm

## Installation

* Enable GCP Google Spreadsheets API
* Enable GCP Google Analytics Admin API

Install the dependencies

```shell
npm ci
```

## The Spreadsheet

* Share the Spreadsheet to the runtime user

## Worksheets

* Works with all worksheets at the same time
* Make sure the first row the header containing column names
* Account name and Account IDs are ignored
* Any unrecognized columns are ignored, feel free to put anything in
* Each worksheet can be only of one [worksheet type](#markdown-header-worksheet-types)
* Cut unused columns and rows to improve performance

* [Custom Dimensions Worksheet](#markdown-header-custom-dimensions-worksheet)
* [Custom Metrics Worksheet](#markdown-header-custom-metrics-worksheet)

The `@ga4/manager` goes column by column, based on the header cell value.

If a column is marked as "beginning of horizontal list", it means, that the
resources will be recognized from the horizontal index of the marking, to the
absolute end of the sheet.

Unsupported columns are ignored.

### Custom Dimensions Worksheet

Purpose of this sheet is to synchronize settings of all Custom Dimensions. The
sheet is expected to have first row defined as header. The Header row is used
to pair attributes to objects.

The sheet must be named "Custom dimensions".

Supported columns:

* `"Property ID"`, the ID of the GA4 Property
* `"Custom dimensions"` marks the beginning of the horizontal list of dimensions

Please note, that the Custom Dimensions share name pool with Custom Metrics

### Custom Metrics Worksheet

Purpose of this sheet is to synchronize settings of all Custom Metrics. The
sheet is expected to have first row defined as header. The Header row is used
to pair attributes to objects.

The sheet must be named "Custom metrics".

Supported columns:

* `"Property ID"`, the ID of the GA4 Property
* `"Custom metrics"` marks the beginning of the horizontal list of Custom Metrics

Please note, that the Custom Metrics share name pool with Custom Dimensions

## Local development

See the available scripts by running

```
npm run
```

Please note, that the project is using 
[rome linter/formatter](https://rome.tools/). Please configure your IDE, to
support that.
