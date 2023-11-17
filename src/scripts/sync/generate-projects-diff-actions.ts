import { OPEN_SOURCE_PACKAGE_MANAGERS } from '../../lib/supported-project-types/supported-manifests';
import type { VulnmapProject } from '../../lib/types';

export function generateProjectDiffActions(
  repoManifests: string[],
  vulnmapMonitoredProjects: VulnmapProject[],
  manifestTypes: string[] = Object.keys(OPEN_SOURCE_PACKAGE_MANAGERS),
): {
  import: string[];
  remove: VulnmapProject[];
} {
  const filesToImport: string[] = [];
  const remove: VulnmapProject[] = [];

  // any files in the repo, not in Vulnmap already should be
  // imported
  for (const manifest of repoManifests) {
    const vulnmapProjectManifests = vulnmapMonitoredProjects.map(
      (p) => p.name.split(':')[1],
    );
    if (!vulnmapProjectManifests.includes(manifest)) {
      filesToImport.push(manifest);
    }
  }

  // any files in Vulnmap, not found in the repo should have the
  // related project deactivated
  for (const project of getSupportedProjectsToDeactivate(
    vulnmapMonitoredProjects,
  )) {
    const targetFile = project.name.split(':')[1];
    if (!targetFile) {
      continue;
    }
    if (!repoManifests.includes(targetFile)) {
      if (manifestTypes.includes(project.type)) {
        remove.push(project);
      }
    }
  }

  return {
    import: filesToImport,
    remove,
  };
}

// should return only projects that reference a manifest file in their name
function getSupportedProjectsToDeactivate(
  projects: VulnmapProject[],
): VulnmapProject[] {
  return projects
    .filter((p) => p.status !== 'inactive')
    .filter((p) => p.type !== 'sast');
}
