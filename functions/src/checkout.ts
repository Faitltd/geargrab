import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stripe, STRIPE_CONFIG, getFrontendUrl, getWebhookSecret } from "./config/stripe";
import Stripe from "stripe";
import * as cors from "cors";
import {
  sendRentalConfirmationToRenter,
  sendRentalNotificationToOwner,
  sendSaleConfirmationToBuyer,
  sendSaleNotificationToOwner,
  type RentalNotificationData,
  type SaleNotificationData,
} from "./services/email";
import { getUserData, shouldSendEmailNotification, logUserActivity } from "./services/users";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Interface for checkout session request
interface CheckoutSessionRequest {
  listingId: string;
  mode: "rental" | "sale";
  bookingData?: {
    dates: string[];
    startDate: string;
    endDate: string;
    deliveryOption: "pickup" | "delivery";
    insuranceOption: boolean;
    totalCost: number;
    breakdown: {
      basePrice: number;
      days: number;
      subtotal: number;
      deliveryFee: number;
      insuranceFee: number;
      taxAmount: number;
      total: number;
    };
  };
}

// Interface for listing data
interface ListingData {
  id: string;
  title: string;
  description: string;
  listingType: "sale" | "rent";
  price?: string;
  rentalPrice?: string;
  rentalPeriod?: "day" | "week" | "month";
  ownerId: string;
  ownerEmail: string;
  imageUrls: string[];
  status: string;
}

/**
 * Cloud Function to create a Stripe Checkout Session
 * Supports both rental and sale transactions
 */
export const createCheckoutSession = functions.https.onCall(async (data: CheckoutSessionRequest, context) => {
  try {
    // Verify user authentication
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to create checkout session");
    }

    const { listingId, mode, bookingData } = data;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    // Validate required parameters
    if (!listingId || !mode) {
      throw new functions.https.HttpsError("invalid-argument", "listingId and mode are required");
    }

    if (!["rental", "sale"].includes(mode)) {
      throw new functions.https.HttpsError("invalid-argument", "mode must be either 'rental' or 'sale'");
    }

    // For rentals, booking data is required
    if (mode === "rental" && !bookingData) {
      throw new functions.https.HttpsError("invalid-argument", "bookingData is required for rental mode");
    }

    // Get listing data from Firestore
    const listingDoc = await db.collection("listings").doc(listingId).get();
    
    if (!listingDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Listing not found");
    }

    const listing = { id: listingDoc.id, ...listingDoc.data() } as ListingData;

    // Verify listing is active
    if (listing.status !== "active") {
      throw new functions.https.HttpsError("failed-precondition", "Listing is not available for purchase/rental");
    }

    // Verify user is not the owner
    if (listing.ownerId === userId) {
      throw new functions.https.HttpsError("failed-precondition", "Cannot purchase/rent your own listing");
    }

    // Verify listing type matches mode
    if (mode === "rental" && listing.listingType !== "rent") {
      throw new functions.https.HttpsError("invalid-argument", "Listing is not available for rental");
    }

    if (mode === "sale" && listing.listingType !== "sale") {
      throw new functions.https.HttpsError("invalid-argument", "Listing is not available for sale");
    }

    // Create line items for Stripe checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (mode === "sale") {
      // Sale mode - single purchase
      const price = parseFloat(listing.price || "0");
      if (price <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid listing price");
      }

      lineItems.push({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: listing.title,
            description: listing.description,
            images: listing.imageUrls.slice(0, 8), // Stripe allows max 8 images
            metadata: {
              listingId: listing.id,
              mode: "sale",
              ownerId: listing.ownerId,
            },
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: 1,
      });
    } else {
      // Rental mode - use booking data
      if (!bookingData) {
        throw new functions.https.HttpsError("internal", "Booking data is missing for rental");
      }

      const { breakdown } = bookingData;

      // Base rental cost
      lineItems.push({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: `${listing.title} - Rental (${breakdown.days} ${breakdown.days === 1 ? "day" : "days"})`,
            description: `Rental from ${bookingData.startDate} to ${bookingData.endDate}`,
            images: listing.imageUrls.slice(0, 8),
            metadata: {
              listingId: listing.id,
              mode: "rental",
              ownerId: listing.ownerId,
              startDate: bookingData.startDate,
              endDate: bookingData.endDate,
            },
          },
          unit_amount: Math.round(breakdown.subtotal * 100),
        },
        quantity: 1,
      });

      // Add delivery fee if applicable
      if (breakdown.deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: "Delivery Service",
              description: "Door-to-door delivery and pickup",
            },
            unit_amount: Math.round(breakdown.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Add insurance fee if applicable
      if (breakdown.insuranceFee > 0) {
        lineItems.push({
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: "Rental Insurance",
              description: "Protection coverage for your rental",
            },
            unit_amount: Math.round(breakdown.insuranceFee * 100),
          },
          quantity: 1,
        });
      }
    }

    // Create metadata for the session
    const metadata: Record<string, string> = {
      listingId: listing.id,
      mode,
      userId,
      ownerId: listing.ownerId,
    };

    if (mode === "rental" && bookingData) {
      metadata.bookingData = JSON.stringify(bookingData);
    }

    // Get frontend URL for success/cancel redirects
    const frontendUrl = getFrontendUrl();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: STRIPE_CONFIG.paymentMethodTypes,
      line_items: lineItems,
      mode: STRIPE_CONFIG.mode.payment,
      success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/checkout/cancel?listing_id=${listingId}`,
      customer_email: userEmail || undefined,
      billing_address_collection: STRIPE_CONFIG.billingAddressCollection,
      shipping_address_collection: mode === "sale" ? STRIPE_CONFIG.shippingAddressCollection : undefined,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
      automatic_tax: {
        enabled: true,
      },
    });

    // Store checkout session reference in Firestore for tracking
    await db.collection("checkout_sessions").doc(session.id).set({
      sessionId: session.id,
      listingId: listing.id,
      userId,
      ownerId: listing.ownerId,
      mode,
      status: "pending",
      amount: mode === "sale" ? parseFloat(listing.price || "0") : bookingData?.totalCost || 0,
      currency: STRIPE_CONFIG.currency,
      bookingData: mode === "rental" ? bookingData : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // Return the checkout session URL
    return {
      sessionId: session.id,
      url: session.url,
      expiresAt: session.expires_at,
    };

  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    // Re-throw Firebase Functions errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Handle Stripe errors
    if (error instanceof Error && "type" in error) {
      const stripeError = error as Stripe.StripeError;
      throw new functions.https.HttpsError("internal", `Stripe error: ${stripeError.message}`);
    }

    // Generic error
    throw new functions.https.HttpsError("internal", "Failed to create checkout session");
  }
});

/**
 * Webhook handler for Stripe events
 * Processes payment completion and updates booking/purchase status
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  const corsHandler = cors({ origin: true });

  return new Promise<void>((resolve) => {
    corsHandler(req, res, async () => {
      try {
        const sig = req.headers["stripe-signature"] as string;
        const webhookSecret = getWebhookSecret();

        if (!sig) {
          console.error("Missing stripe-signature header");
          res.status(400).send("Missing stripe-signature header");
          resolve();
          return;
        }

        // Verify webhook signature
        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          res.status(400).send(`Webhook Error: ${err}`);
          resolve();
          return;
        }

        console.log(`Received webhook event: ${event.type}`);

        // Handle the event
        switch (event.type) {
          case "checkout.session.completed":
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
          case "checkout.session.expired":
            await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
            break;
          case "payment_intent.succeeded":
            console.log("Payment succeeded:", event.data.object.id);
            break;
          case "payment_intent.payment_failed":
            await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
            break;
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
        resolve();
      } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).send("Webhook handler error");
        resolve();
      }
    });
  });
});

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log("Processing completed checkout session:", session.id);

    const { listingId, mode, userId, ownerId } = session.metadata || {};

    if (!listingId || !mode || !userId || !ownerId) {
      console.error("Missing required metadata in session:", session.metadata);
      return;
    }

    // Update checkout session status
    await db.collection("checkout_sessions").doc(session.id).update({
      status: "completed",
      paymentStatus: session.payment_status,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (mode === "rental") {
      await handleRentalPaymentSuccess(session);
    } else if (mode === "sale") {
      await handleSalePaymentSuccess(session);
    }

  } catch (error) {
    console.error("Error handling checkout session completion:", error);
  }
}

/**
 * Handle successful rental payment
 */
async function handleRentalPaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const { listingId, userId, ownerId, bookingData } = session.metadata || {};

    if (!bookingData || !listingId || !userId || !ownerId) {
      console.error("Missing required data for rental payment:", { listingId, userId, ownerId, hasBookingData: !!bookingData });
      return;
    }

    const parsedBookingData = JSON.parse(bookingData);

    // Get listing data
    const listingDoc = await db.collection("listings").doc(listingId).get();
    if (!listingDoc.exists) {
      console.error("Listing not found:", listingId);
      return;
    }
    const listing = { id: listingDoc.id, ...listingDoc.data() };

    // Create rental record in /rentals collection
    const rentalRef = await db.collection("rentals").add({
      listingId,
      listingTitle: listing.title || "Rental Item",
      ownerId,
      renterId: userId,
      renterEmail: session.customer_email,
      dates: parsedBookingData.dates,
      startDate: parsedBookingData.startDate,
      endDate: parsedBookingData.endDate,
      deliveryOption: parsedBookingData.deliveryOption,
      insuranceOption: parsedBookingData.insuranceOption,
      totalCost: parsedBookingData.totalCost,
      breakdown: parsedBookingData.breakdown,
      status: "confirmed",
      paymentIntentId: session.payment_intent,
      checkoutSessionId: session.id,
      verification: {
        beforePhotos: {
          required: true,
          completed: false,
          completedAt: null,
          conditionCheckId: null
        },
        afterPhotos: {
          required: true,
          completed: false,
          completedAt: null,
          conditionCheckId: null
        }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Created rental record:", rentalRef.id);

    // Update checkout session with rental ID
    await db.collection("checkout_sessions").doc(session.id).update({
      rentalId: rentalRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also create booking record for backward compatibility
    await db.collection("bookings").add({
      listingId,
      listingTitle: listing.title || "Rental Item",
      ownerId,
      renterId: userId,
      renterEmail: session.customer_email,
      dates: parsedBookingData.dates,
      startDate: parsedBookingData.startDate,
      endDate: parsedBookingData.endDate,
      deliveryOption: parsedBookingData.deliveryOption,
      insuranceOption: parsedBookingData.insuranceOption,
      totalCost: parsedBookingData.totalCost,
      breakdown: parsedBookingData.breakdown,
      status: "confirmed",
      paymentIntentId: session.payment_intent,
      checkoutSessionId: session.id,
      rentalId: rentalRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update listing availability (remove booked dates)
    const currentAvailability = listing.availabilityDates || [];
    const bookedDates = parsedBookingData.dates;
    const updatedAvailability = currentAvailability.filter((date: string) => !bookedDates.includes(date));

    await db.collection("listings").doc(listingId).update({
      availabilityDates: updatedAvailability,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email notifications
    await sendRentalNotifications(rentalRef.id, {
      booking: {
        id: rentalRef.id,
        dates: parsedBookingData.dates,
        startDate: parsedBookingData.startDate,
        endDate: parsedBookingData.endDate,
        totalCost: parsedBookingData.totalCost,
        deliveryOption: parsedBookingData.deliveryOption,
        insuranceOption: parsedBookingData.insuranceOption,
      },
      listing,
      renterId: userId,
      ownerId,
    });

    // Log user activities
    await logUserActivity(userId, "rental_confirmed", { rentalId: rentalRef.id, listingId });
    await logUserActivity(ownerId, "rental_received", { rentalId: rentalRef.id, listingId });

  } catch (error) {
    console.error("Error handling rental payment success:", error);
  }
}

/**
 * Handle successful sale payment
 */
async function handleSalePaymentSuccess(session: Stripe.Checkout.Session) {
  try {
    const { listingId, userId, ownerId } = session.metadata || {};

    if (!listingId || !userId || !ownerId) {
      console.error("Missing required data for sale payment:", { listingId, userId, ownerId });
      return;
    }

    // Get listing data
    const listingDoc = await db.collection("listings").doc(listingId).get();
    if (!listingDoc.exists) {
      console.error("Listing not found:", listingId);
      return;
    }
    const listing = { id: listingDoc.id, ...listingDoc.data() };

    // Create sale record in /sales collection
    const saleRef = await db.collection("sales").add({
      listingId,
      listingTitle: listing.title || "Purchase Item",
      ownerId,
      buyerId: userId,
      buyerEmail: session.customer_email,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      status: "confirmed",
      paymentIntentId: session.payment_intent,
      checkoutSessionId: session.id,
      shippingAddress: session.shipping_details?.address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Created sale record:", saleRef.id);

    // Also create purchase record for backward compatibility
    await db.collection("purchases").add({
      listingId,
      listingTitle: listing.title || "Purchase Item",
      ownerId,
      buyerId: userId,
      buyerEmail: session.customer_email,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      status: "completed",
      paymentIntentId: session.payment_intent,
      checkoutSessionId: session.id,
      shippingAddress: session.shipping_details?.address,
      saleId: saleRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update listing status to sold
    await db.collection("listings").doc(listingId).update({
      status: "sold",
      soldAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email notifications
    await sendSaleNotifications(saleRef.id, {
      purchase: {
        id: saleRef.id,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        shippingAddress: session.shipping_details?.address,
      },
      listing,
      buyerId: userId,
      ownerId,
    });

    // Log user activities
    await logUserActivity(userId, "purchase_confirmed", { saleId: saleRef.id, listingId });
    await logUserActivity(ownerId, "item_sold", { saleId: saleRef.id, listingId });

  } catch (error) {
    console.error("Error handling sale payment success:", error);
  }
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    console.log("Processing expired checkout session:", session.id);

    // Update checkout session status
    await db.collection("checkout_sessions").doc(session.id).update({
      status: "expired",
      expiredAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error("Error handling checkout session expiration:", error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("Processing failed payment:", paymentIntent.id);

    // Find associated checkout session
    const sessionsQuery = await db.collection("checkout_sessions")
      .where("sessionId", "==", paymentIntent.id)
      .limit(1)
      .get();

    if (!sessionsQuery.empty) {
      const sessionDoc = sessionsQuery.docs[0];
      await sessionDoc.ref.update({
        status: "failed",
        paymentStatus: "failed",
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

/**
 * Send rental confirmation notifications to both parties
 */
async function sendRentalNotifications(
  rentalId: string,
  data: {
    booking: any;
    listing: any;
    renterId: string;
    ownerId: string;
  }
) {
  try {
    // Get user data for both parties
    const [renterData, ownerData] = await Promise.all([
      getUserData(data.renterId),
      getUserData(data.ownerId),
    ]);

    if (!renterData || !ownerData) {
      console.error("Could not fetch user data for notifications:", {
        renterId: data.renterId,
        ownerId: data.ownerId,
        hasRenterData: !!renterData,
        hasOwnerData: !!ownerData
      });
      return;
    }

    // Check notification preferences
    const [shouldNotifyRenter, shouldNotifyOwner] = await Promise.all([
      shouldSendEmailNotification(data.renterId, "rental"),
      shouldSendEmailNotification(data.ownerId, "rental"),
    ]);

    const notificationData: RentalNotificationData = {
      booking: data.booking,
      listing: data.listing,
      renter: renterData,
      owner: ownerData,
    };

    // Send notifications in parallel
    const notificationPromises: Promise<boolean>[] = [];

    if (shouldNotifyRenter) {
      notificationPromises.push(sendRentalConfirmationToRenter(notificationData));
    }

    if (shouldNotifyOwner) {
      notificationPromises.push(sendRentalNotificationToOwner(notificationData));
    }

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(Boolean).length;

    console.log(`Sent ${successCount}/${notificationPromises.length} rental notifications for rental ${rentalId}`);

  } catch (error) {
    console.error("Error sending rental notifications:", error);
  }
}

/**
 * Send sale confirmation notifications to both parties
 */
async function sendSaleNotifications(
  saleId: string,
  data: {
    purchase: any;
    listing: any;
    buyerId: string;
    ownerId: string;
  }
) {
  try {
    // Get user data for both parties
    const [buyerData, ownerData] = await Promise.all([
      getUserData(data.buyerId),
      getUserData(data.ownerId),
    ]);

    if (!buyerData || !ownerData) {
      console.error("Could not fetch user data for notifications:", {
        buyerId: data.buyerId,
        ownerId: data.ownerId,
        hasBuyerData: !!buyerData,
        hasOwnerData: !!ownerData
      });
      return;
    }

    // Check notification preferences
    const [shouldNotifyBuyer, shouldNotifyOwner] = await Promise.all([
      shouldSendEmailNotification(data.buyerId, "sale"),
      shouldSendEmailNotification(data.ownerId, "sale"),
    ]);

    const notificationData: SaleNotificationData = {
      purchase: data.purchase,
      listing: data.listing,
      buyer: buyerData,
      owner: ownerData,
    };

    // Send notifications in parallel
    const notificationPromises: Promise<boolean>[] = [];

    if (shouldNotifyBuyer) {
      notificationPromises.push(sendSaleConfirmationToBuyer(notificationData));
    }

    if (shouldNotifyOwner) {
      notificationPromises.push(sendSaleNotificationToOwner(notificationData));
    }

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(Boolean).length;

    console.log(`Sent ${successCount}/${notificationPromises.length} sale notifications for sale ${saleId}`);

  } catch (error) {
    console.error("Error sending sale notifications:", error);
  }
}
