# Mirroring Github.com / Github Enterprise organizations and repos in Vulnmap

You will need your Vulnmap API token, with correct scope & [admin access for all Organizations](https://vulnmap.docs.apiary.io/#reference/import-projects/import/import-targets) you are importing to. As Github is both an auth & integration, how the integration is done has an effect on usage:
  - For users importing via [Github Vulnmap integration](https://docs.vulnmap.khulnasoft.com/integrations/git-repository-scm-integrations/github-integration#setting-up-a-github-integration) use your **personal Vulnmap API token** (Service Accounts are not supported for Github integration imports via API as this is a personal auth token only accessible to the user)
  - For Github Enterprise Vulnmap integration with a url & token (for Github.com, Github Enterprise Cloud & Github Enterprise hosted) use a **Vulnmap API service account token**

In order to import the entirety of Github/Github Enterprise repos into Vulnmap you can use the available utils to make it possible in 4 commands.
You will need to configure both Github token and Vulnmap token as environment variable to proceed.
Please refer to individual documentation pages for more detailed info, however the general steps are:

1. `export GITHUB_TOKEN=***` and `export VULNMAP_TOKEN=***`
2. Generate organization data e.g. `vulnmap-api-import orgs:data --source=github --groupId=<vulnmap_group_id>` [Full instructions](./orgs.md)
3. Create organizations in Vulnmap `vulnmap-api-import orgs:create --file=orgs.json` [Full instructions](./orgs.md) will create a `vulnmap-created-orgs.json` file with Vulnmap organization ids and integration ids that are needed for import.
4. Generate import data `vulnmap-api-import import:data --orgsData=vulnmap-created-orgs.json --source=github` [Full instructions](./import-data.md)
5. Run import `DEBUG=*vulnmap* vulnmap-api-import import`[Full instructions](./import.md)

## Re-importing new repos & organizations only while mirroring
Once initial import is complete you may want to periodically check for new repos and make sure they are added into Vulnmap. To do this a similar flow to what is described above with a few small changes can be used:
1. `export GITHUB_TOKEN=***` and `export VULNMAP_TOKEN=***`
2. Generate organization data in Vulnmap and skip any that do not have any repos via `--skipEmptyOrg` `vulnmap-api-import orgs:data --source=github --groupId=<vulnmap_group_id> --skipEmptyOrg` [Full instructions](./orgs.md)
3. Create organizations in Vulnmap and this time skip any that have been created already with `--noDuplicateNames` parameter `vulnmap-api-import orgs:create --file=orgs.json --noDuplicateNames` [Full instructions](./orgs.md) will create a `vulnmap-created-orgs.json` file with Vulnmap organization ids and integration ids that are needed for import.
4. Generate import data `vulnmap-api-import import:data --orgsData=vulnmap-created-orgs.json --source=github` [Full instructions](./import-data.md)
5. Generate the previously imported log to skip all previously imported repos in a Group (see full [documentation](./import.md#to-skip-all-previously-imported-targets)):
`vulnmap-api-import-macos list:imported --integrationType=<integration-type> --groupId=<vulnmap_group_id>`
6. Run import `DEBUG=*vulnmap* vulnmap-api-import import`[Full instructions](./import.md)

## Syncing previously imported repos
For repos already monitored in Vulnmap use the `sync` command to detect changes and update projects in Vulnmap.
1. Get a list of Vulnmap Organizations in the Group by listing all organizations a group admin belongs to via [Vulnmap Organizations API](https://vulnmap.docs.apiary.io/#reference/groups/list-all-organizations-in-a-group/list-all-organizations-in-a-group)
2. For every public Organization ID, run `sync` command [Full instructions](./sync.md)