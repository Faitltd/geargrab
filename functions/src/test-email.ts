import * as functions from "firebase-functions";
import {
  sendRentalConfirmationToRenter,
  sendRentalNotificationToOwner,
  sendSaleConfirmationToBuyer,
  sendSaleNotificationToOwner,
  type RentalNotificationData,
  type SaleNotificationData,
} from "./services/email";

/**
 * Test function to send sample email notifications
 * This is useful for testing email templates and SendGrid configuration
 * 
 * Usage:
 * firebase functions:shell
 * testEmailNotifications({type: 'rental', email: 'test@example.com'})
 */
export const testEmailNotifications = functions.https.onCall(async (data, context) => {
  // Verify user authentication (optional for testing)
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { type, email } = data;

  if (!type || !email) {
    throw new functions.https.HttpsError("invalid-argument", "type and email are required");
  }

  if (!["rental", "sale"].includes(type)) {
    throw new functions.https.HttpsError("invalid-argument", "type must be 'rental' or 'sale'");
  }

  try {
    if (type === "rental") {
      await testRentalNotifications(email);
    } else {
      await testSaleNotifications(email);
    }

    return { success: true, message: `Test ${type} notifications sent to ${email}` };
  } catch (error) {
    console.error("Error sending test notifications:", error);
    throw new functions.https.HttpsError("internal", "Failed to send test notifications");
  }
});

/**
 * Test rental notifications
 */
async function testRentalNotifications(email: string) {
  const testData: RentalNotificationData = {
    booking: {
      id: "test-rental-123",
      dates: ["2024-02-15", "2024-02-16", "2024-02-17"],
      startDate: "2024-02-15",
      endDate: "2024-02-17",
      totalCost: 225.50,
      deliveryOption: "delivery",
      insuranceOption: true,
    },
    listing: {
      id: "test-listing-456",
      title: "Professional DSLR Camera Kit",
      description: "High-quality camera with lenses and accessories perfect for photography projects",
      imageUrls: ["https://example.com/camera1.jpg", "https://example.com/camera2.jpg"],
      location: "San Francisco, CA",
      rentalPrice: "75",
    },
    renter: {
      uid: "test-renter-uid",
      email: email,
      displayName: "John Doe",
      firstName: "John",
      lastName: "Doe",
    },
    owner: {
      uid: "test-owner-uid",
      email: "owner@example.com",
      displayName: "Jane Smith",
      firstName: "Jane",
      lastName: "Smith",
    },
  };

  // Send both renter and owner notifications
  const results = await Promise.all([
    sendRentalConfirmationToRenter(testData),
    sendRentalNotificationToOwner({
      ...testData,
      owner: { ...testData.owner, email: email }, // Send owner notification to test email
    }),
  ]);

  console.log("Rental notification results:", results);
}

/**
 * Test sale notifications
 */
async function testSaleNotifications(email: string) {
  const testData: SaleNotificationData = {
    purchase: {
      id: "test-sale-789",
      amount: 1299.99,
      shippingAddress: {
        line1: "123 Main Street",
        line2: "Apt 4B",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US",
      },
    },
    listing: {
      id: "test-listing-789",
      title: "MacBook Pro 16-inch",
      description: "Excellent condition MacBook Pro with M2 chip, perfect for creative work",
      imageUrls: ["https://example.com/macbook1.jpg", "https://example.com/macbook2.jpg"],
      location: "San Francisco, CA",
      price: "1299",
    },
    buyer: {
      uid: "test-buyer-uid",
      email: email,
      displayName: "Alice Johnson",
      firstName: "Alice",
      lastName: "Johnson",
    },
    owner: {
      uid: "test-seller-uid",
      email: "seller@example.com",
      displayName: "Bob Wilson",
      firstName: "Bob",
      lastName: "Wilson",
    },
  };

  // Send both buyer and seller notifications
  const results = await Promise.all([
    sendSaleConfirmationToBuyer(testData),
    sendSaleNotificationToOwner({
      ...testData,
      owner: { ...testData.owner, email: email }, // Send seller notification to test email
    }),
  ]);

  console.log("Sale notification results:", results);
}

/**
 * Test function to validate SendGrid configuration
 */
export const testSendGridConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "email is required");
  }

  try {
    const { sendEmail } = await import("./services/email");
    
    const result = await sendEmail(
      email,
      "GearGrab - SendGrid Test",
      `
        <h1>SendGrid Configuration Test</h1>
        <p>If you're receiving this email, your SendGrid configuration is working correctly!</p>
        <p>Test sent at: ${new Date().toISOString()}</p>
      `,
      "SendGrid Configuration Test - If you're receiving this email, your SendGrid configuration is working correctly!"
    );

    return { 
      success: result, 
      message: result 
        ? `Test email sent successfully to ${email}` 
        : "Failed to send test email - check SendGrid configuration"
    };
  } catch (error) {
    console.error("SendGrid test error:", error);
    throw new functions.https.HttpsError("internal", "SendGrid configuration test failed");
  }
});
