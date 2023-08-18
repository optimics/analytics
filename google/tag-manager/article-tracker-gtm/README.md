# `@optimics/article-tracker-gtm`

> Connect article tracker with Google Tag Manager with a community template

## Build

The build process creates a local copy of a remote gtm template repository and
hardcodes the article tracker library URLs into the template code. Define
following environment variables before building the project.

* `AT_LIB_URL_BASE` is the base URL, where the article tracker code will live. It defaults to `'https://storage.googleapis.com/zt-le-scripts/at/'`
* `AT_DIST_REPO` is the git origin source. It defaults to
  `'git@github.com:optimics/gtm-template-article-tracker'`
