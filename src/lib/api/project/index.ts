import 'source-map-support/register';
import * as needle from 'needle';
import * as debugLib from 'debug';
import { getApiToken } from '../../get-api-token';
import { getVulnmapHost } from '../../get-vulnmap-host';
import type { requestsManager } from 'snyk-request-manager';
import type { VulnmapProject } from '../../types';
const debug = debugLib('vulnmap:api-project');

interface BulkProjectUpdateResponse {
  publicId: string;
  name: string;
}
export async function deleteProjects(
  orgId: string,
  projects: string[],
): Promise<{
  success: BulkProjectUpdateResponse[];
  failure: BulkProjectUpdateResponse[];
}> {
  const apiToken = getApiToken();
  if (!(orgId && projects)) {
    throw new Error(
      `Missing required parameters. Please ensure you have provided: orgId & projectIds.`,
    );
  }
  debug('Deleting projectIds:', projects.join(', '));

  try {
    const VULNMAP_API = getVulnmapHost();
    const body = {
      projects,
    };
    const res = await needle(
      'post',
      `${VULNMAP_API}/org/${orgId.trim()}/projects/bulk-delete`,
      body,
      {
        json: true,
        // eslint-disable-next-line @typescript-eslint/camelcase
        read_timeout: 30000,
        headers: {
          'content-type': 'application/json',
          Authorization: `token ${apiToken}`,
        },
      },
    );
    const statusCode = res.statusCode;
    if (!statusCode || statusCode !== 200) {
      throw new Error(
        `Expected a 200 response, instead received statusCode: ${
          res.statusCode
        },
          body: ${JSON.stringify(res.body)}`,
      );
    }
    return res.body;
  } catch (error) {
    debug('Could not delete project:', error.message || error);
    const err: {
      message?: string | undefined;
      innerError?: string;
    } = new Error('Could not delete project');
    err.innerError = error;
    throw err;
  }
}

export async function deactivateProject(
  requestManager: requestsManager,
  orgId: string,
  projectPublicId: string,
): Promise<boolean> {
  getApiToken();
  getVulnmapHost();
  if (!(orgId && projectPublicId)) {
    throw new Error(
      `Missing required parameters. Please ensure you have provided: orgId & projectId.`,
    );
  }
  debug(`De-activating project: ${projectPublicId}`);
  const url = `/org/${orgId.trim()}/project/${projectPublicId}/deactivate`;

  const res = await requestManager.request({
    verb: 'post',
    url: url,
    body: JSON.stringify({}),
    useRESTApi: false,
  });

  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 200) {
    debug(`Failed de-activating project projectId`);
    throw new Error(
      'Expected a 200 response, instead received: ' +
        JSON.stringify({ data: res.data, status: statusCode }),
    );
  }

  debug('Updated projects batch');
  return true;
}

export async function updateProject(
  requestManager: requestsManager,
  orgId: string,
  projectId: string,
  config: { branch: string },
): Promise<VulnmapProject> {
  getApiToken();
  getVulnmapHost();
  if (!orgId || !projectId) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId and projectId.
      \nFor more information see: https://vulnmap.docs.apiary.io/reference/projects/individual-project/update-a-project`,
    );
  }

  const body = {
    branch: config.branch,
  };

  const url = `/org/${orgId.trim()}/project/${projectId.trim()}`;
  const res = await requestManager.request({
    verb: 'put',
    url: url,
    body: JSON.stringify(body),
    useRESTApi: false,
  });

  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 200) {
    debug('Failed updating project: ' + projectId);
    throw new Error(
      'Expected a 200 response, instead received: ' +
        JSON.stringify({ data: res.data, status: statusCode }),
    );
  }

  const updatedProject: VulnmapProject = res.data;
  debug('Updated project: ' + projectId);
  return updatedProject;
}
