# `ga4-manager`

> Configure your GA4 custom properties and dimensions from Google Sheets

This is the source code for [Google Sheets Optilytics
addon](https://workspace.google.com/u/1/marketplace/app/optilytics_dev/120581552484).
It uses Cloud Functions based API to consume a Spreadsheet of predefined looks
and set up your Google Analytics 4 based on the defined matrix, while giving
you feedback into the sheet.

Before using the plugin, do not forget to share the Spreadsheet to the runtime
user.

## Worksheets

* Works with all worksheets at the same time
* Make sure the first row the header containing column names
* Account name and Account IDs are ignored
* Any unrecognized columns are ignored, feel free to put anything in
* Each worksheet can be only of one [worksheet type](#user-content-worksheet-types)
* Cut unused columns and rows to improve performance

We currently support setting up:

* [Custom Dimensions](#user-content-custom-dimensions-worksheet)
* [Custom Metrics](#user-content-custom-metrics-worksheet)
* [Custom Properties](#user-content-custom-properties-worksheet)

The `@ga4/manager` goes column by column, based on the header cell value.

If a column is marked as "beginning of horizontal list", it means, that the
resources will be recognized from the horizontal index of the marking, to the
absolute end of the sheet.

Unknown and unsupported columns are ignored.

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

