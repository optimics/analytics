# Optimics Analytics tools

> Free tools used to measure application analytics and analyse data

* [@optimics/article-tracker](./browser/article-tracker) - track how your
  audience consumes article texts and multimedia
* [@optimics/experiment-runner](./browser/experiment-runner) - run ABCD tests
  on your audience
* [@optimics/dataform-ecom-report-transform](./dataform/ecom-report-transform) -
  transform GA4 ecommerce data into reportful tables
* [@optimics/dataform-utm-source-filter](./dataform/utm-source-filter) -
  consolidate your e-shop orders by UTM source
* [@optimics/ga4-manager](./google/sheets/ga4-manager) - configure your GA4
  custom properties and dimensions from Sheets

## Testing

There is a singular test suite that covers all the subprojects build on jest
using
[@optimics/jest](https://github.com/optimics/forge/tree/master/packages/jest)
configurator.

```
npm test
```

Tests can be run in watch mode, so they will respond to code changes.

```
npm test -- --watch
```

For more options, see [Jest CLI Options](https://jestjs.io/docs/cli)

### Potential issues

The project was not developed with Microsoft Windows in mind. If you are forced
to use this operating system, there might be unexpected, undocumented sporadic
issues in the test suite. If you encounter any, please [report
them](https://github.com/optimics/analytics/issues/new).

## Workflows

### [Integration](./actions/workflows/integraton.yml)

This workflow runs builds and tests. If all passes, it deploys code to staging
environments.

### [Release](./actions/workflows/release.yml)

This workflow initiates Release cycle, by creating Release Pull Request, that
needs to be reviewed. When the Pull Request is merged, new package versions are
released and new code is put to production.

### [Publish](./actions/workflows/publish.yml)

This workflow publishes new package versions and deploy code to production,
when a new version is marked in the repository.

