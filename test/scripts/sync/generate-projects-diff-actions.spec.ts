import { generateProjectDiffActions } from '../../../src/scripts/sync/generate-projects-diff-actions';
import type { VulnmapProject } from '../../../src/lib/types';
import {
  CONTAINER,
  OPEN_SOURCE_PACKAGE_MANAGERS,
} from '../../../src/lib/supported-project-types/supported-manifests';

describe('generateProjectDiffActions', () => {
  it('identifies correctly the diff between files in the repo vs monitored in Vulnmap', async () => {
    // Arrange
    const projects: VulnmapProject[] = [
      {
        name: 'vulnmap/goof:todo/package.json',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'npm',
        branch: 'master',
        status: 'active',
      },
      {
        name: 'vulnmap/goof:src/Dockerfile',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'dockerfile',
        branch: 'master',
        status: 'active',
      },
    ];
    // Act
    const res = await generateProjectDiffActions(
      ['package.json', 'path/to/build.gradle', 'src/Dockerfile'],
      projects,
      [...Object.keys(OPEN_SOURCE_PACKAGE_MANAGERS), ...Object.keys(CONTAINER)],
    );

    // Assert
    expect(res).toStrictEqual({
      import: ['package.json', 'path/to/build.gradle'],
      remove: [
        {
          name: 'vulnmap/goof:todo/package.json',
          id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
          created: '2018-10-29T09:50:54.014Z',
          origin: 'github',
          type: 'npm',
          branch: 'master',
          status: 'active',
        },
      ],
    });
  });
  it('no changes needed', async () => {
    // Arrange
    const projects: VulnmapProject[] = [
      {
        name: 'vulnmap/goof:package.json',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'npm',
        branch: 'master',
        status: 'active',
      },
      {
        name: 'vulnmap/goof:Code Analysis',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'sast',
        branch: 'master',
        status: 'active',
      },
    ];
    // Act
    const res = await generateProjectDiffActions(['package.json'], projects);

    // Assert
    expect(res).toStrictEqual({
      import: [],
      remove: [],
    });
  });

  it('ignores non Open Source projects like Docker', async () => {
    // Arrange
    const projects: VulnmapProject[] = [
      {
        name: 'vulnmap/goof:package.json',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'npm',
        branch: 'master',
        status: 'active',
      },
      {
        name: 'vulnmap/goof:Dockerfile',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'dockerfile',
        branch: 'master',
        status: 'active',
      },
    ];
    // Act
    const res = await generateProjectDiffActions(['package.json'], projects);

    // Assert
    expect(res).toStrictEqual({
      import: [],
      remove: [],
    });
  });
  it('compares Open Source + Docker projects', async () => {
    // Arrange
    const projects: VulnmapProject[] = [
      {
        name: 'vulnmap/goof:package.json',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'npm',
        branch: 'master',
        status: 'active',
      },
      {
        name: 'vulnmap/goof:Dockerfile',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'dockerfile',
        branch: 'master',
        status: 'active',
      },
      {
        name: 'vulnmap/goof:Code Analysis',
        id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
        created: '2018-10-29T09:50:54.014Z',
        origin: 'github',
        type: 'sast',
        branch: 'master',
        status: 'active',
      },
    ];
    // Act
    const res = await generateProjectDiffActions(['package.json'], projects, [
      ...Object.keys(OPEN_SOURCE_PACKAGE_MANAGERS),
      ...Object.keys(CONTAINER),
    ]);

    // Assert
    expect(res).toStrictEqual({
      import: [],
      remove: [
        {
          name: 'vulnmap/goof:Dockerfile',
          id: 'af137b96-6966-46c1-826b-2e79ac49bbxx',
          created: '2018-10-29T09:50:54.014Z',
          origin: 'github',
          type: 'dockerfile',
          branch: 'master',
          status: 'active',
        },
      ],
    });
  });
});
