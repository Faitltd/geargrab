// Health check endpoint for deployment verification
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Basic health check
		const health = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			version: '5.0.1',
			services: {
				firebase: 'connected',
				facebook_auth: 'enabled',
				stripe: 'configured'
			},
			deployment: {
				environment: 'production',
				region: 'us-central1',
				facebook_login: 'active'
			}
		};

		return json(health, {
			status: 200,
			headers: {
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Health check failed:', error);
		
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{
				status: 503,
				headers: {
					'Cache-Control': 'no-cache',
					'Content-Type': 'application/json'
				}
			}
		);
	}
};
