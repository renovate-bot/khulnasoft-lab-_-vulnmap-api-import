import * as debugLib from 'debug';
import * as _ from 'lodash';
import * as yargs from 'yargs';
import { getLoggingPath } from '../lib/get-logging-path';
import {
  CommandResult,
  SupportedIntegrationTypesToListVulnmapTargets,
} from '../lib/types';
const debug = debugLib('vulnmap:generate-data-script');

import { generateVulnmapImportedTargets } from '../scripts/generate-imported-targets-from-vulnmap';

export const command = ['list:imported'];
export const desc =
  'List all targets imported in Vulnmap for a given group & source type. An analysis is performed on all current organizations and their projects to generate this. The generated file can be used to skip previously imported targets when running the `import` command';
export const builder = {
  groupId: {
    required: false,
    default: undefined,
    desc: 'Public id of the group in Vulnmap (available on group settings)',
  },
  orgId: {
    required: false,
    default: undefined,
    desc: 'Public id of the organization in Vulnmap (available in organization settings)',
  },
  integrationType: {
    required: true, // TODO: allow to not set any type to return all
    default: [...Object.values(SupportedIntegrationTypesToListVulnmapTargets)],
    choices: [...Object.values(SupportedIntegrationTypesToListVulnmapTargets)],
    desc: 'The configured integration type (source of the projects in Vulnmap e.g. Github, Github Enterprise.). This will be used to pick the correct integrationID from each org in Vulnmap E.g. --integrationType=github, --integrationType=github-enterprise',
  },
};

const entityName: {
  [source in SupportedIntegrationTypesToListVulnmapTargets]: string;
} = {
  github: 'repo',
  'github-enterprise': 'repo',
  'bitbucket-cloud': 'repo',
  gcr: 'images',
  'docker-hub': 'images',
  gitlab: 'repo',
  'azure-repos': 'repo',
  'bitbucket-server': 'repo',
};

export async function createListImported(
  integrationType: SupportedIntegrationTypesToListVulnmapTargets,
  groupId?: string,
  orgId?: string,
): Promise<CommandResult> {
  try {
    if (!(groupId || orgId)) {
      throw new Error(
        'Missing required parameters: orgId or groupId must be provided.',
      );
    }

    if (groupId && orgId) {
      throw new Error(
        'Too many parameters: orgId or groupId must be provided, not both.',
      );
    }

    const integrationTypes = _.castArray(integrationType);
    const { targets, fileName, failedOrgs } =
      await generateVulnmapImportedTargets(
        { groupId, orgId },
        integrationTypes,
      );
    const integrationEntity =
      integrationTypes.length > 1 ? 'target' : entityName[integrationTypes[0]];

    const entityMessage = groupId ? `Group ${groupId} ` : `Org ${orgId}`;
    const targetsMessage =
      targets.length > 0
        ? `Found ${targets.length} ${integrationEntity}(s). Written the data to file: ${fileName}`
        : `⚠ No ${integrationEntity}(s) ${entityMessage} and integration type(s) ${integrationTypes.join(
            ', ',
          )}!`;

    if (failedOrgs.length > 0) {
      console.warn(
        `Failed to process the following orgs: ${failedOrgs
          .map((org) => org.id)
          .join(',')}`,
      );
    }

    return {
      fileName: fileName,
      exitCode: 0,
      message: targetsMessage,
    };
  } catch (e) {
    const errorMessage = `ERROR! Failed to list imported targets in Vulnmap. Try running with \`DEBUG=vulnmap* <command> for more info\`.\nERROR: ${e.message}`;

    return {
      fileName: undefined,
      exitCode: 1,
      message: errorMessage,
    };
  }
}

export async function handler(argv: {
  groupId?: string;
  orgId?: string;
  integrationType: SupportedIntegrationTypesToListVulnmapTargets;
}): Promise<void> {
  getLoggingPath();
  const { groupId, integrationType, orgId } = argv;

  debug('ℹ️  Options: ' + JSON.stringify(argv));

  const res = await createListImported(integrationType, groupId, orgId);

  if (res.exitCode === 1) {
    debug('Failed to create organizations.\n' + res.message);

    console.error(res.message);
    setTimeout(() => yargs.exit(1, new Error(res.message)), 3000);
  } else {
    console.log(res.message);
  }
}
