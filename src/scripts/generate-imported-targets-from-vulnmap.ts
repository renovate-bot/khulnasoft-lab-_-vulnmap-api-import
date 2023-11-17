import { requestsManager } from 'snyk-request-manager';
import * as debugLib from 'debug';
import * as path from 'path';
import * as pMap from 'p-map';
import * as _ from 'lodash';

import type { FilePath, VulnmapProject, Target } from '../lib/types';
import { SupportedIntegrationTypesToListVulnmapTargets } from '../lib/types';
import {
  getAllOrgs,
  getLoggingPath,
  listIntegrations,
  listProjects,
} from '../lib';
import { logImportedTargets } from '../loggers/log-imported-targets';
import { IMPORT_LOG_NAME, targetProps } from '../common';
import { generateTargetId } from '../generate-target-id';

const debug = debugLib('vulnmap:generate-vulnmap-imported-targets');

export interface ImportTarget {
  orgId: string;
  integrationId: string;
  target: Target;
  files?: FilePath[];
  exclusionGlobs?: string;
}

export function projectToTarget(
  project: Pick<VulnmapProject, 'name' | 'branch'>,
): Target {
  const [owner, name] = project.name.split(':')[0].split('/');
  return {
    owner,
    branch: project.branch || undefined, // TODO: make it not optional
    name: name.split('(')[0],
  };
}
export function bitbucketServerProjectToTarget(
  project: Pick<VulnmapProject, 'name' | 'branch'>,
): Target {
  const [projectKey, repoSlug] = project.name.split(':')[0].split('/');
  return {
    projectKey,
    repoSlug: repoSlug.split('(')[0],
  };
}

export function gitlabProjectToImportLogTarget(
  project: Pick<VulnmapProject, 'name' | 'branch'>,
): Target {
  // Gitlab target is only `id` & branch and the Vulnmap API does not return the id.
  // However we are already logging `name` which for Gitlab is "owner/repo", branch & id so if we use the same name we can match on it
  // TODO: add support for customBranch projects
  const name = project.name.split(':')[0];
  return {
    branch: project.branch || undefined, // TODO: make it not optional
    name,
  };
}

export function imageProjectToTarget(
  project: Pick<VulnmapProject, 'name'>,
): Target {
  return {
    name: project.name,
  };
}

export const targetGenerators = {
  [SupportedIntegrationTypesToListVulnmapTargets.GITHUB]: projectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.GITLAB]:
    gitlabProjectToImportLogTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.GHE]: projectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.BITBUCKET_CLOUD]:
    projectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.GCR]: imageProjectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.DOCKER_HUB]:
    imageProjectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.AZURE_REPOS]: projectToTarget,
  [SupportedIntegrationTypesToListVulnmapTargets.BITBUCKET_SERVER]:
    bitbucketServerProjectToTarget,
};

interface VulnmapOrg {
  id: string;
  slug?: string;
  name?: string;
}

export async function generateVulnmapImportedTargets(
  id: { groupId?: string; orgId?: string },
  integrationTypes: SupportedIntegrationTypesToListVulnmapTargets[],
): Promise<{
  targets: ImportTarget[];
  fileName: string;
  failedOrgs: VulnmapOrg[];
}> {
  const { groupId, orgId } = id;
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
  const requestManager = new requestsManager({
    userAgentPrefix: 'vulnmap-api-import:list',
  });
  const targetsData: ImportTarget[] = [];
  const groupOrgs = groupId
    ? await getAllOrgs(requestManager, groupId)
    : [{ id: orgId! }];
  const failedOrgs: VulnmapOrg[] = [];
  const projectFilters =
    integrationTypes.length > 1
      ? { limit: 100 }
      : { origin: integrationTypes[0], limit: 100 };
  await pMap(
    groupOrgs,
    async (org: VulnmapOrg) => {
      const { id: orgId, name, slug } = org;
      try {
        const [resProjects, resIntegrations] = await Promise.all([
          listProjects(requestManager, orgId, projectFilters),
          listIntegrations(requestManager, orgId),
        ]);
        const { projects } = resProjects;
        const scmTargets = projects
          .filter((p) =>
            integrationTypes.includes(
              p.origin as SupportedIntegrationTypesToListVulnmapTargets,
            ),
          )
          .map((p) => {
            const target =
              targetGenerators[
                p.origin as SupportedIntegrationTypesToListVulnmapTargets
              ](p);
            return {
              target,
              integrationId: resIntegrations[p.origin],
            };
          });

        const uniqueTargets: Set<string> = new Set();
        const orgTargets: Target[] = [];
        if (!scmTargets.length || scmTargets.length === 0) {
          console.warn('No projects in org', orgId);
          return;
        }
        for (const data of scmTargets) {
          const { target, integrationId } = data;
          const targetId = generateTargetId(orgId, integrationId, target);
          if (uniqueTargets.has(targetId)) {
            continue;
          }
          uniqueTargets.add(targetId);
          const importedTarget = {
            target: _.pick(target, ...targetProps),
            integrationId,
            orgId,
          };
          targetsData.push(importedTarget);
          orgTargets.push(target);
        }
        console.log(
          'Extracted',
          uniqueTargets.size,
          'unique targets from',
          scmTargets.length,
          'projects from org',
          orgId,
        );
        await logImportedTargets(
          targetsData,
          null,
          undefined,
          'Target exists in Vulnmap',
        );
      } catch (e) {
        failedOrgs.push(org);
        console.warn(
          `Failed to process projects for organization ${
            name && slug ? `${name}(${slug})` : orgId
          }. Continuing.`,
        );
      }
    },
    { concurrency: 15 },
  );
  if (targetsData.length === 0) {
    debug(
      'No targets could be generated. Could Vulnmap Group have no projects?',
    );
    const message = groupId
      ? `Could Vulnmap organizations in the group (${groupId}) be empty?`
      : `Could the organization ${orgId} be empty?`;
    console.warn(`No targets could be generated. ${message}`);
  }
  return {
    targets: targetsData,
    fileName: path.resolve(getLoggingPath(), IMPORT_LOG_NAME),
    failedOrgs,
  };
}
