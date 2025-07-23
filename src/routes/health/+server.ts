import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const healthCheck = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || 'development',
		version: '1.0.0',
		services: {
			database: 'connected', // You can add actual health checks here
			base44: 'connected'
		}
	};

	return json(healthCheck, {
		headers: {
			'Cache-Control': 'no-cache'
		}
	});
};
