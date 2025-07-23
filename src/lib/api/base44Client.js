import { createClient } from '@base44/sdk';

export const base44 = createClient({
	appId: 'your-app-id', // This should be configured properly
	serverUrl: 'https://base44.app',
	env: 'prod'
});
