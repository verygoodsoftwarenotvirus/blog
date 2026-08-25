import { env } from '$env/dynamic/public';

/**
 * Canonical origin for absolute URLs (RSS links, guids).
 * Override at build time with PUBLIC_SITE_URL to publish the same
 * content under a different host without editing source.
 */
export const SITE_URL = (
	env.PUBLIC_SITE_URL || 'https://blog.verygoodsoftwarenotvirus.ru'
).replace(/\/$/, '');
