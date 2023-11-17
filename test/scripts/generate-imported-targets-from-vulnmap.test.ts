import * as fs from 'fs';
import * as path from 'path';

import { generateLogsPaths } from '../generate-log-file-names';
import { deleteFiles } from '../delete-files';
import {
  generateVulnmapImportedTargets,
  projectToTarget,
  imageProjectToTarget,
  bitbucketServerProjectToTarget,
} from '../../src/scripts/generate-imported-targets-from-vulnmap';
import { IMPORT_LOG_NAME } from '../../src/common';
import { SupportedIntegrationTypesToListVulnmapTargets } from '../../src/lib/types';

const ORG_ID = process.env.TEST_ORG_ID as string;
const VULNMAP_API_TEST = process.env.VULNMAP_API_TEST as string;
const GROUP_ID = process.env.TEST_GROUP_ID as string;

jest.unmock('snyk-request-manager');
jest.requireActual('snyk-request-manager');

describe('Generate imported targets based on Vulnmap data', () => {
  let logs: string[];
  const OLD_ENV = process.env;
  process.env.VULNMAP_API = VULNMAP_API_TEST;
  process.env.VULNMAP_TOKEN = process.env.VULNMAP_TOKEN_TEST;
  process.env.VULNMAP_LOG_PATH = __dirname;

  afterAll(async () => {
    await deleteFiles(logs);
    process.env = { ...OLD_ENV };
  });

  it('succeeds to generate targets for Group for Github & GHE', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ groupId: GROUP_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.GITHUB,
        SupportedIntegrationTypesToListVulnmapTargets.GHE,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        branch: expect.any(String),
        name: expect.any(String),
        owner: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.owner as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);
  it.todo('One org failed to be processed');

  it('succeeds to generate targets for Org + Gitlab', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ orgId: ORG_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.GITHUB,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        branch: expect.any(String),
        name: expect.any(String),
        owner: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.owner as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);

  it('succeeds to generate targets for Org + Azure', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ orgId: ORG_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.AZURE_REPOS,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        branch: expect.any(String),
        name: expect.any(String),
        owner: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.owner as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);

  it('succeeds to generate targets for Org + Bitbucket server', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ orgId: ORG_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.BITBUCKET_SERVER,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        projectKey: expect.any(String),
        repoSlug: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.projectKey as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);

  it('succeeds to generate targets for Group for Bitbucket Cloud', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ groupId: GROUP_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.BITBUCKET_CLOUD,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        name: expect.any(String),
        owner: expect.any(String),
        branch: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.name as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);

  it('succeeds to generate targets for Org + Bitbucket Cloud', async () => {
    const logFiles = generateLogsPaths(__dirname, ORG_ID);
    logs = Object.values(logFiles);
    const { targets, failedOrgs, fileName } =
      await generateVulnmapImportedTargets({ orgId: ORG_ID }, [
        SupportedIntegrationTypesToListVulnmapTargets.BITBUCKET_CLOUD,
      ]);
    expect(failedOrgs).toEqual([]);
    expect(fileName).toEqual(path.resolve(__dirname, IMPORT_LOG_NAME));
    expect(targets[0]).toMatchObject({
      integrationId: expect.any(String),
      orgId: expect.any(String),
      target: {
        name: expect.any(String),
        owner: expect.any(String),
        branch: expect.any(String),
      },
    });
    // give file a little time to be finished to be written
    await new Promise((r) => setTimeout(r, 20000));
    const importedTargetsLog = fs.readFileSync(logFiles.importLogPath, 'utf8');
    expect(importedTargetsLog).toMatch(targets[0].target.owner as string);
    expect(importedTargetsLog).toMatch(targets[0].orgId);
    expect(importedTargetsLog).toMatch(targets[0].integrationId);
  }, 240000);
});

describe('projectToTarget', () => {
  it('succeed to convert Github / Gitlab project name to target', async () => {
    const project = {
      name: 'lili-vulnmap/huge-monorepo:cockroach/build/builder/Dockerfile',
      branch: 'main',
    };
    const target = projectToTarget(project);
    expect(target).toEqual({
      branch: 'main',
      name: 'huge-monorepo',
      owner: 'lili-vulnmap',
    });
  });

  it('succeed to convert Github / Gitlab project name to target with branch in the name', async () => {
    const project = {
      name: 'lili-vulnmap/huge-monorepo(main):cockroach/build/builder/Dockerfile',
      branch: 'main',
    };
    const target = projectToTarget(project);
    expect(target).toEqual({
      branch: 'main',
      name: 'huge-monorepo',
      owner: 'lili-vulnmap',
    });
  });

  it('succeed to convert GCR project name to target', async () => {
    const project = {
      name: 'vulnmap-main/bundle-lock-job:prod',
    };
    const target = imageProjectToTarget(project);
    expect(target).toEqual({
      name: 'vulnmap-main/bundle-lock-job:prod',
    });
  });

  it('succeed to convert Azure project name to target', async () => {
    const project = {
      name: 'Test 105/goof.git:Dockerfile',
      branch: 'master',
    };
    const target = projectToTarget(project);
    expect(target).toEqual({
      branch: 'master',
      name: 'goof.git',
      owner: 'Test 105',
    });
  });

  it('succeed to convert Bitbucket server project name to target', async () => {
    const project = {
      name: 'antoine-vulnmap-demo/TestRepoAntoine:goof/package.json',
      branch: 'master',
    };
    const target = bitbucketServerProjectToTarget(project);
    expect(target).toEqual({
      projectKey: 'antoine-vulnmap-demo',
      repoSlug: 'TestRepoAntoine',
    });
  });
});
