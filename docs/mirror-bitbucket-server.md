# Mirroring Bitbucket Server organizations and repos in Vulnmap
In order to import the entirety of Bitbucket Server repos into Vulnmap you can use the available utils to make it possible in 4 commands.
You will need to configure both Bitbucket Server token and Vulnmap token as environment variable to proceed.
Please refer to individual documentation pages for more detailed info, however the general steps are:

1. `export BITBUCKET_SERVER_TOKEN=***` and `export VULNMAP_TOKEN=***`
2. Generate organization data e.g. `vulnmap-api-import orgs:data --source=bitbucket-server --groupId=<vulnmap_group_id>` [Full instructions](./orgs.md)
3. Create organizations in Vulnmap `vulnmap-api-import orgs:create --file=orgs.json` [Full instructions](./orgs.md) will create a `vulnmap-created-orgs.json` file with Vulnmap organization ids and integration ids that are needed for import.
4. Generate import data `vulnmap-api-import import:data --orgsData=vulnmap-created-orgs.json --source=bitbucket-server` [Full instructions](./import-data.md)
5. Run import `DEBUG=*vulnmap* vulnmap-api-import import`[Full instructions](./import.md)

## Re-importing new repos & orgs only while Mirroring
Once initial import is complete you may want to periodically check for new repos and make sure they are added into Vulnmap. To do this a similar flow to what is described above with a few small changes can be used:
1. `export BITBUCKET_SERVER_TOKEN=***` and `export VULNMAP_TOKEN=***`
2. Generate organization data in Vulnmap and skip any that do not have any repos via `--skipEmptyOrg` `vulnmap-api-import orgs:data --source=bitbucket-server --groupId=<vulnmap_group_id> --skipEmptyOrg` [Full instructions](./orgs.md)
3. Create organizations in Vulnmap and this time skip any that have been created already with `--noDuplicateNames` parameter `vulnmap-api-import orgs:create --file=orgs.json --noDuplicateNames` [Full instructions](./orgs.md) will create a `vulnmap-created-orgs.json` file with Vulnmap organization ids and integration ids that are needed for import.
4. Generate import data `vulnmap-api-import import:data --orgsData=vulnmap-created-orgs.json --source=bitbucket-server` [Full instructions](./import-data.md)
5. Optional. Generate the previously imported log to skip all previously imported repos a Group (see full [documentation](./import.md#to-skip-all-previously-imported-targets)):
`vulnmap-api-import-macos list:imported --integrationType=<integration-type> --groupId=<vulnmap_group_id>`
6. Run import `DEBUG=*vulnmap* vulnmap-api-import import`[Full instructions](./import.md)
