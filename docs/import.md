# Import
## Table of Contents
- [Import](#import)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
- [Kick off an import](#kick-off-an-import)
  - [1. Create the `import-projects.json` file](#1-create-the-import-projectsjson-file)
    - [Example: Gitlab](#example-gitlab)
    - [Example: Bitbucket Server](#example-bitbucket-server)
    - [Example: Github.com | Github Enterprise | dev.azure.com | Hosted Azure Repos](#example-githubcom--github-enterprise--devazurecom--hosted-azure-repos)
    - [Example: Google Container Registry](#example-google-container-registry)
    - [Example: Azure Container Registry, Elastic Container Registry, Artifactory Container Registry](#example-azure-container-registry-elastic-container-registry-artifactory-container-registry)
  - [2. Set the env vars](#2-set-the-env-vars)
  - [3. Download \& run](#3-download--run)
  - [4. Review logs](#4-review-logs)
- [Tips](#tips)
  - [Skip all previously imported targets](#skip-all-previously-imported-targets)
  - [Check how many projects successfully imported](#check-how-many-projects-successfully-imported)
  - [Check how many projects failed to import\& why](#check-how-many-projects-failed-to-import-why)


## Prerequisites
You will need to have setup in advance:
- your [Vulnmap organizations](docs/orgs.md) should be setup before running an import
- your Vulnmap organizations configured with some connection to SCM (Github/Gitlab/Bitbucket etc) as you will need the `integrationId` to generate the import files.
- you will need your Vulnmap API token, with correct scope & [admin access for all Organizations](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets) you are importing to. **Github Integration Note**: As Github is both an auth & integration, how the integration is done has an effect on usage:
  - For users importing via [Github Vulnmap integration](https://docs.vulnmap.khulnasoft.com/integrations/git-repository-scm-integrations/github-integration#setting-up-a-github-integration) use your **personal Vulnmap API token** (Service Accounts are not supported for Github integration imports via API as this is a personal auth token only accessible to the user)
  - For Github Enterprise Vulnmap integration with a url & token (for Github.com, Github Enterprise Cloud & Github Enterprise hosted) use a **Vulnmap API service account token**
- Recommended: have [notifications disabled](https://vulnmap.docs.apiary.io/#reference/organizations/notification-settings/set-notification-settings) for emails etc to avoid receiving import notifications
- Recommended: have the [fix PRs and PR checks disabled](https://vulnmap.docs.apiary.io/#reference/integrations/integration-settings/update) until import is complete to avoid sending extra requests to SCMs (Github/Gitlab/Bitbucket etc)

Any logs will be generated at `VULNMAP_LOG_PATH` directory.

# Kick off an import
## 1. Create the `import-projects.json` file

The file is expected to have a **required** `targets` top level key which is an array of **import targets**.

```
{
  targets: [
    {..},
    {..}
  ],
}
```

Each **import target** has the following keys:

```
{
  // required
  "orgId": "<public_vulnmap_org_id>",
  "integrationId": <"public_vulnmap_integration_id>",
  "target": {..} // the identifier of where the projects can be found (for example branch, repo name and owner for Github)

   // optional
  "files": [ { path: "full/path/to/file1"} , { path: "full/path/to/file2" }],
  "exclusionGlobs": "fixtures, tests, __tests__, node_modules",
}
```

- `orgId` - Can be found in https://app.vulnmap.khulnasoft.com/org/YOUR_ORG/manage/settings
- `integrationId` - Can be found in Integrations menu for each SCM https://app.vulnmap.khulnasoft.com/org/YOUR_ORG/manage/settings
- `target`, `files`, `exclusionGlobs` - see our [Import API documentation](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets) for more info
  - `exclusionGlobs` a comma-separated list of up to 10 folder names to exclude from scanning (each folder name must not exceed 100 characters). If not specified, it will default to "fixtures, tests, **tests**, node_modules". If an empty string is provided - no folders will be excluded
  - `files` is an object array, each path must be the full relative path to file from the root of the target. Only those files will be imported if located at that location.

_Note_: For a repo that may have 200+ manifest files it is recommended to split this import into multiple by targeting specific files. Importing hundreds of files at once from 1 repo can cause the import to result in some errors/failures.
_Note_: Keep in mind there is a [limit on the # or projects per Organization in Vulnmap](https://docs.vulnmap.khulnasoft.com/getting-started/introduction-to-vulnmap-projects/maximum-number-of-projects-in-an-organsation).
To reduce the chances of reaching this limit use multiple Organizations in Vulnmap instead of adding many repos into 1.
Splitting it to target some files, or some folders only will benefit from the re-tries and yield a smaller load on the source control management system being used. Populate the the `files` property to accomplish this in the import JSON.

If you have any tests ot fixtures that should be ignored, please set the `exclusionGLobs` property:

> a comma-separated list of up to 10 folder names to exclude from scanning. If not specified, it will default to "fixtures, tests, **tests**, node_modules". If an empty string is provided - no folders will be excluded

**Note: vulnmap-api-import supports 100% of the same integration types and project sources as the [Import API documentation](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets). If an example is not present below for your use case please see the API documentation**

### Example: Gitlab

```
{
  "targets": [
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "id": 13,
        "branch": "master"
      },
    },
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "id": 2,
        "branch": "master"
      },
    },
  ]
}

```

### Example: Bitbucket Server

```
{
  "targets": [
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "repoSlug": "api-import-circle-test",
        "name": "Vulnmap api-import-circle-test",
        "projectKey": "PROJECT"
      },
      "files": [
        {
          "path": "package.json"
        },
        {
          "path": "package/package.json"
        },
        {
          "path": "Gemfile.lock"
        }
      ],
      "exclusionGlobs": "fixtures, test"
    },
  ]
}
```

### Example: Github.com | Github Enterprise | dev.azure.com | Hosted Azure Repos

```
{
  "targets": [
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "name": "shallow-goof-policy",
        "owner": "api-import-circle-test",
        "branch": "master"
      },
      "exclusionGlobs": "fixtures, test"
    }
  ]
}
```

### Example: Google Container Registry

```
{
  "targets": [
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "name": "projectId/repository:tag"
      },
    }
  ]
}
```

### Example: Azure Container Registry, Elastic Container Registry, Artifactory Container Registry

```
{
  "targets": [
    {
      "orgId": "******",
      "integrationId": "******",
      "target": {
        "name": "repository:tag"
      },
    }
  ]
}
```

## 2. Set the env vars

- `VULNMAP_IMPORT_PATH`- the path to the import file or use `--file` parameter
- `VULNMAP_TOKEN` - your [Vulnmap api token](https://app.vulnmap.khulnasoft.com/account)
- `VULNMAP_LOG_PATH` - the path to folder where all logs should be saved,it is recommended creating a dedicated logs folder per import you have running. (Note: all logs will append)
- `CONCURRENT_IMPORTS` (optional) defaults to 15 repos at a time, which is the recommended amount to import at once as a max. Just 1 repo may have many projects inside which can trigger a many files at once to be requested from the user's SCM instance and some may have rate limiting in place. This script aims to help reduce the risk of hitting a rate limit.
- `VULNMAP_API` (optional) defaults to `https://vulnmap.khulnasoft.com/api/v1`

## 3. Download & run

Grab a binary from the [releases page](https://github.com/khulnasoft-lab/vulnmap-api-import/releases) and run with `DEBUG=vulnmap* vulnmap-api-import-macos import --file=path/to/imported-targets.json`

## 4. Review logs
When import is started via Vulnmap API, many files & targets will be added to an import job. This job when complete will provide logs of what projects could be detected, which failed and any errors that were encountered. For more details see [Import API documentation](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets)

`import` command will generate several logs:
- `<public_org_id>.failed-polls.log` - contains errors received when polling an import job for status (complete / pending)
- `<public_org_id>.failed-projects.log` - contains entry per project that was identified but failed to be created
- `<public_org_id>.imported_projects.log` - contains entry per projects of all projects that were successfully created in Vulnmap
- `import-job-results.log` - contains the [Import API](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets) logs received for this job once it completed.
- `imported-targets.log` - contains information on which targets have been requested for processing.

# Tips
## Skip all previously imported targets

This can be used to skip previously imported targets (repos) so only remaining targets will be imported.

This utility helps generate the `imported-targets.log` file by analysing the projects already in a given Vulnmap Group. When present in the logging path this file is used to look up targets that should be skipped during the import.

Example:

- all Github repos have been imported into Vulnmap into their respective organizations during initial onboarding
- new Github repos have since been added and now need to be added to Vulnmap
- to avoid importing everything again, using this util and running import again provides a way to only import "new" Github repos. This is much much faster and removes unnecessary calls to Vulnmap & Github to fetch files and do the import for everything again.

Note:

- The same target imported into a different organization will be allowed to be imported
- The same target from a differed source be allowed to be imported (For example the same repo is present in Github and now it being imported via Github Enterprise into the same org)

Command to run:

- skip all previously imported into all orgs in a Group:
  `vulnmap-api-import-macos list:imported --integrationType=<integration-type> --groupId=<vulnmap_group_id>`
- skip all previously imported for a specific Organization:
  `vulnmap-api-import-macos list:imported --integrationType=<integration-type> --orgId=<vulnmap_org_id>`
- a single integration / projects source `vulnmap-api-import-macos list:imported --integrationType=<integration-type> --groupId=<vulnmap_group_id>`
- multiple integrations / projects sources `vulnmap-api-import-macos list:imported --integrationType=<integration-type> --integrationType=<integration-type> --orgId=<vulnmap_org_id>`

Supported integration types:

- Github.com `github`
- Github Enterprise `github-enterprise`
- Gitlab `gitlab`
- Bitbucket Cloud `bitbucket-cloud`
- Google Cloud Registry `gcr`
- DockerHub registry `docker-hub`
- Azure repos `azure-repos`

## Check how many projects successfully imported
We recommend you use [jq](https://stedolan.github.io/jq/download/), which is a lightweight and flexible command-line JSON processor:
`jq -s length vulnmap-log/$VULNMAP_ORG_ID.imported-projects.log`

## Check how many projects failed to import& why
We recommend you use [jq](https://stedolan.github.io/jq/download/), which is a lightweight and flexible command-line JSON processor:
`jq . vulnmap-log/$VULNMAP_ORG_ID.failed-projects.log`
