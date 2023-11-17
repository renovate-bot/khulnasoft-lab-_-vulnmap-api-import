export function getApiToken(): string {
  const apiToken = process.env.VULNMAP_TOKEN;

  if (!apiToken) {
    throw new Error(
      `Please set the VULNMAP_TOKEN e.g. export VULNMAP_TOKEN='*****'`,
    );
  }
  return apiToken;
}
