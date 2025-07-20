import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export all cloud functions
export { createCheckoutSession, stripeWebhook } from "./checkout";

// Export test functions (remove in production)
export { testEmailNotifications, testSendGridConfig } from "./test-email";

// Additional utility functions can be exported here
// export { sendNotification } from "./notifications";
// export { processImage } from "./image-processing";
