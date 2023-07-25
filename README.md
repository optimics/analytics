# Optimics Analytics tools

> Free tools used to measure application analytics and analyse data

* [@optimics/article-tracker](./browser/article-tracker) - track how your
  audience consumes article texts and multimedia
* [@optimics/experiment-runner](./browser/experiment-runner) - run ABCD tests
  on your audience
* [@optimics/dataform-utm-source-filter](./dataform/utm-source-filter) -
  evaluate `utm_source` contribution in conversions

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
