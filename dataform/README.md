# Dataform packages

> This is a collection of tools for dataform transforms

## Working with Dataform packages

### Setting Up Dataform Repository

To set up the Dataform repository and enable the tool through the Google Cloud
Platform API, follow these steps:

1. Navigate to [BigQuery >
   Dataform](https://console.cloud.google.com/bigquery/dataform) in the Google
Cloud Platform Console.
2. Create a Dataform repository. If you are located in the EU, choose the EU
   data region (e.g., `europe-west1`).
3. Connect the created repository with your Git repository.

### Creating a Development Workspace

To create a development workspace for your Dataform project, perform the
following steps:

1. Initialize the workspace.
2. After completing the initialization, Dataform will automatically generate
   two files in the `definitions` directory. You can delete these files as they
   are not required.

### Installing npm package

To install the `npm` package and add it to your Dataform workspace, follow
these steps:

1. Check the latest package version
2. Go to your Dataform workspace.
3. Add your package full name to your `package.json` dependencies
   with the current version of the package
4. Click "Install Packages" button in the dataform interface

The `package.json` `"dependencies"` section should include your package, like
this:

```json
{
  "dependencies": {
    "@optimics/dataform-utm-source-filter": "^0.6"
  }
}
```

### Committing and Pushing Changes

Once you have made the necessary changes to the repository, commit the changes
and push them to the branch.
