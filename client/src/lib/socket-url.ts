// Accept a server URL or the full namespace URL without appending it twice.
export function resolveSocketUrl(configuredUrl = 'http://localhost:3000') {
    const url = configuredUrl.trim().replace(/\/+$/, '');
    return url.endsWith('/realtime') ? url : `${url}/realtime`;
}
