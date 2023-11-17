import 'source-map-support/register';
import type { requestsManager } from 'snyk-request-manager';
import * as debugLib from 'debug';
import * as qs from 'querystring';
import { getApiToken } from '../../get-api-token';
import { getVulnmapHost } from '../../get-vulnmap-host';
import type {
  VulnmapProject,
  RESTTargetResponse,
  RESTProjectData,
  VulnmapTarget,
} from '../../types';

const debug = debugLib('vulnmap:api-group');

export interface IntegrationsListResponse {
  [name: string]: string;
}

export async function listIntegrations(
  requestManager: requestsManager,
  orgId: string,
): Promise<IntegrationsListResponse> {
  getApiToken();
  getVulnmapHost();
  debug('Listing integrations for org: ' + orgId);

  if (!orgId) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId.
      \nFor more information see: https://vulnmap.docs.apiary.io/#reference/integrations/list`,
    );
  }

  const res = await requestManager.request({
    verb: 'get',
    url: `/org/${orgId.trim()}/integrations`,
    body: JSON.stringify({}),
  });

  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 200) {
    throw new Error(
      'Expected a 200 response, instead received: ' +
        JSON.stringify({ data: res.data || res.body, status: statusCode }),
    );
  }
  return res.data || {};
}

const defaultDisabledSettings = {
  'new-issues-remediations': {
    enabled: false,
    issueType: 'none',
    issueSeverity: 'high',
  },
  'project-imported': {
    enabled: false,
  },
  'test-limit': {
    enabled: false,
  },
  'weekly-report': {
    enabled: false,
  },
};

interface NotificationSettings {
  [name: string]: {
    enabled?: boolean;
    issueSeverity?: string;
    issueType?: string;
  };
}

export async function setNotificationPreferences(
  requestManager: requestsManager,
  orgId: string,
  orgName: string,
  settings: NotificationSettings = defaultDisabledSettings,
): Promise<IntegrationsListResponse> {
  getApiToken();
  getVulnmapHost();
  debug(`Disabling notifications for org: ${orgName} (${orgId})`);

  if (!orgId) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId, settings.
      \nFor more information see: https://vulnmap.docs.apiary.io/#reference/organizations/the-vulnmap-organization-for-a-request/set-notification-settings`,
    );
  }
  try {
    const res = await requestManager.request({
      verb: 'put',
      url: `/org/${orgId.trim()}/notification-settings`,
      body: JSON.stringify(settings),
    });

    const statusCode = res.statusCode || res.status;
    if (!statusCode || statusCode !== 200) {
      throw new Error(
        'Expected a 200 response, instead received: ' +
          JSON.stringify({ data: res.data, status: statusCode }),
      );
    }
    return res.data || {};
  } catch (e) {
    debug('Failed to update notification settings for ', orgId, e);
    throw e;
  }
}

export async function deleteOrg(
  requestManager: requestsManager,
  orgId: string,
): Promise<unknown> {
  getApiToken();
  getVulnmapHost();
  debug(`Deleting org: "${orgId}"`);

  if (!orgId) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId.
      \nFor more information see: https://vulnmap.docs.apiary.io/#reference/organizations/manage-organization/remove-organization`,
    );
  }
  const res = await requestManager.request({
    verb: 'delete',
    url: `/org/${orgId}`,
    body: JSON.stringify({}),
  });
  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 204) {
    throw new Error(
      'Expected a 204 response, instead received: ' +
        JSON.stringify({ data: res.data, status: statusCode }),
    );
  }
  return res.data;
}

export interface ProjectsResponse {
  org: {
    id: string;
  };
  projects: VulnmapProject[];
}

interface RESTProjectsResponse {
  data: RESTProjectData[];
  jsonapi: {
    version: string;
  };
  links: {
    first: string;
    last: string;
    next: string;
    prev: string;
    related: string;
    self: string;
  };
}

interface ProjectsFilters {
  name?: string; // If supplied, only projects that have a name that starts with this value will be returned
  origin?: string; //If supplied, only projects that exactly match this origin will be returned
  type?: string; //If supplied, only projects that exactly match this type will be returned
  isMonitored?: boolean; // If set to true, only include projects which are monitored, if set to false, only include projects which are not monitored
  targetId?: string; // The target public ID
  limit?: number; // how many results per page, defaults to 10
}

export async function listProjects(
  requestManager: requestsManager,
  orgId: string,
  filters?: ProjectsFilters,
): Promise<ProjectsResponse> {
  getApiToken();
  getVulnmapHost();
  debug(
    `Listing all projects for org: ${orgId} with filter ${JSON.stringify(
      filters,
    )}`,
  );
  if (!orgId) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId, settings.
        \nFor more information see: https://vulnmap.docs.apiary.io/#reference/projects/all-projects/list-all-projects`,
    );
  }

  const projects = await listAllProjects(requestManager, orgId, filters);

  return {
    org: {
      id: orgId,
    },
    projects: projects,
  };
}

async function listAllProjects(
  requestManager: requestsManager,
  orgId: string,
  filters?: ProjectsFilters,
): Promise<VulnmapProject[]> {
  let lastPage = false;
  const projectsList: VulnmapProject[] = [];
  let pageCount = 1;
  let nextPageLink: string | undefined = undefined;
  while (!lastPage) {
    try {
      debug(
        `Fetching page ${pageCount} to list all projects for org ${orgId}\n`,
      );
      const {
        projects,
        next,
      }: {
        projects: VulnmapProject[];
        next?: string;
      } = await getProjectsPage(requestManager, orgId, filters, nextPageLink);

      projectsList.push(...projects);
      next
        ? ((lastPage = false), (nextPageLink = next))
        : ((lastPage = true), (nextPageLink = ''));
      pageCount++;
    } catch (e) {
      debug('Failed to get projects for ', orgId, e);
      throw e;
    }
  }
  return projectsList;
}

async function getProjectsPage(
  requestManager: requestsManager,
  orgId: string,
  filters?: ProjectsFilters,
  nextPageLink?: string,
): Promise<{ projects: VulnmapProject[]; next?: string }> {
  const query = qs.stringify({
    version: '2022-09-15~beta',
    ...filters,
  });

  const url = nextPageLink ?? `/orgs/${orgId.trim()}/projects?${query}`;

  const res = await requestManager.request({
    verb: 'get',
    url: url,
    useRESTApi: true,
  });

  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 200) {
    throw new Error(
      'Expected a 200 response, instead received: ' +
        JSON.stringify({ data: res.data, status: statusCode }),
    );
  }

  const response = res.data as RESTProjectsResponse;

  const projects = convertToVulnmapProject(response.data);
  const next = response.links.next;

  return { projects, next };
}

function convertToVulnmapProject(
  projectData: RESTProjectData[],
): VulnmapProject[] {
  const projects: VulnmapProject[] = [];

  for (const project of projectData) {
    const projectTmp: VulnmapProject = {
      id: project.id,
      branch: project.attributes.targetReference,
      created: project.attributes.created,
      origin: project.attributes.origin,
      name: project.attributes.name,
      type: project.attributes.type,
      status: project.attributes.status,
    };
    projects.push(projectTmp);
  }

  return projects;
}
export interface TargetFilters {
  remoteUrl?: string;
  limit?: number;
  isPrivate?: boolean;
  origin?: string;
  displayName?: string;
  excludeEmpty?: boolean;
}
export async function listTargets(
  requestManager: requestsManager,
  orgId: string,
  config?: TargetFilters,
): Promise<{ targets: VulnmapTarget[] }> {
  getApiToken();
  getVulnmapHost();
  debug(`Listing all targets for org: ${orgId}`);

  if (!orgId && orgId.length > 0) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId, settings.
        \nFor more information see: https://apidocs.vulnmap.khulnasoft.com/?version=2022-09-15%7Ebeta#get-/orgs/-org_id-/targets`,
    );
  }

  const targets = await listAllVulnmapTargets(requestManager, orgId, config);

  return { targets };
}

export async function listAllVulnmapTargets(
  requestManager: requestsManager,
  orgId: string,
  config?: TargetFilters,
): Promise<VulnmapTarget[]> {
  let lastPage = false;
  const targetsList: VulnmapTarget[] = [];
  let pageCount = 1;
  let nextPageLink: string | undefined = undefined;
  while (!lastPage) {
    try {
      debug(`Fetching page ${pageCount} of targets for orgId: ${orgId}\n`);
      const { targets, next }: { targets: VulnmapTarget[]; next?: string } =
        await getVulnmapTarget(requestManager, orgId, nextPageLink, config);

      targetsList.push(...targets);
      next
        ? ((lastPage = false), (nextPageLink = next))
        : ((lastPage = true), (nextPageLink = undefined));
      pageCount++;
    } catch (e) {
      debug('Failed to get targets for ', orgId, e);
      throw e;
    }
  }
  return targetsList;
}

export async function getVulnmapTarget(
  requestManager: requestsManager,
  orgId: string,
  nextPageLink?: string,
  config: {
    limit?: number;
    excludeEmpty?: boolean;
    origin?: string;
  } = {
    limit: 20,
    excludeEmpty: true,
  },
): Promise<{ targets: VulnmapTarget[]; next?: string }> {
  const query = qs.stringify({
    version: '2022-09-15~beta',
    ...config,
  });
  const url = nextPageLink ?? `/orgs/${orgId.trim()}/targets?${query}`;

  const res = await requestManager.request({
    verb: 'get',
    url: url,
    body: undefined,
    useRESTApi: true,
  });

  const statusCode = res.statusCode || res.status;
  if (!statusCode || statusCode !== 200) {
    throw new Error(
      'Expected a 200 response, instead received: ' +
        JSON.stringify({ data: res.data, status: statusCode }),
    );
  }

  const responseData = res.data as RESTTargetResponse;
  const targets = responseData.data;
  const { next } = responseData.links;

  return { targets, next };
}
