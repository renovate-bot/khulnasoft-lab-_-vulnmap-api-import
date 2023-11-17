export function getVulnmapHost(): string {
  return process.env.VULNMAP_API || 'https://vulnmap.khulnasoft.com/api/v1';
}
