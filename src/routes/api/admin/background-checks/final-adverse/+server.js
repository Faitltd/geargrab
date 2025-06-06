/**
 * Admin endpoint to manually trigger final adverse notice job
 * For testing and manual processing
 */

import { json } from '@sveltejs/kit';
import { finalAdverseNoticeJob } from '$lib/jobs/finalAdverseCron.js';

export async function POST({ request }) {
  try {
    // In production, add admin authentication here
    // const user = await authenticateAdmin(request);
    
    console.log('Manually triggering final adverse notice job...');
    
    // Run the job manually
    await finalAdverseNoticeJob.runJob();
    
    // Get job statistics
    const stats = finalAdverseNoticeJob.getStats();
    
    return json({
      success: true,
      message: 'Final adverse notice job completed',
      stats
    });

  } catch (error) {
    console.error('Manual final adverse notice job failed:', error);
    return json({
      error: 'Failed to run final adverse notice job',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get job statistics without running the job
    const stats = finalAdverseNoticeJob.getStats();
    
    return json({
      success: true,
      stats,
      message: 'Final adverse notice job statistics'
    });

  } catch (error) {
    console.error('Failed to get job statistics:', error);
    return json({
      error: 'Failed to get job statistics',
      details: error.message
    }, { status: 500 });
  }
}
