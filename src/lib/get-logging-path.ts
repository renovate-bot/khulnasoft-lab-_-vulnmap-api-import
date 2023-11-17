import * as fs from 'fs';

export function getLoggingPath(): string {
  const vulnmapLogPath = process.env.VULNMAP_LOG_PATH;
  if (!vulnmapLogPath) {
    throw new Error(
      `Please set the VULNMAP_LOG_PATH e.g. export VULNMAP_LOG_PATH='~/my/path'`,
    );
  }
  if (!fs.existsSync(vulnmapLogPath)) {
    try {
      fs.mkdirSync(vulnmapLogPath);
    } catch (e) {
      throw new Error(
        `Failed to auto create the path ${vulnmapLogPath} provided in the VULNMAP_LOG_PATH. Please check this variable is set correctly`,
      );
    }
  }
  return vulnmapLogPath;
}
