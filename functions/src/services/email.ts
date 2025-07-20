import * as functions from "firebase-functions";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const sendGridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.warn("SendGrid API key not configured. Email notifications will be disabled.");
} else {
  sgMail.setApiKey(sendGridApiKey);
}

// Email configuration
export const EMAIL_CONFIG = {
  fromEmail: functions.config().email?.from || process.env.FROM_EMAIL || "noreply@geargrab.com",
  fromName: "GearGrab",
  replyTo: functions.config().email?.reply_to || process.env.REPLY_TO_EMAIL || "support@geargrab.com",
};

// Email template types
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// User data interface
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

// Listing data interface
export interface ListingData {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  location: string;
  rentalPrice?: string;
  price?: string;
}

// Rental notification data
export interface RentalNotificationData {
  booking: {
    id: string;
    dates: string[];
    startDate: string;
    endDate: string;
    totalCost: number;
    deliveryOption: string;
    insuranceOption: boolean;
  };
  listing: ListingData;
  renter: UserData;
  owner: UserData;
}

// Sale notification data
export interface SaleNotificationData {
  purchase: {
    id: string;
    amount: number;
    shippingAddress?: any;
  };
  listing: ListingData;
  buyer: UserData;
  owner: UserData;
}

/**
 * Send email using SendGrid
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  if (!sendGridApiKey) {
    console.warn("SendGrid not configured, skipping email to:", to);
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: EMAIL_CONFIG.fromEmail,
        name: EMAIL_CONFIG.fromName,
      },
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      html,
      text: text || stripHtml(html),
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

/**
 * Send rental confirmation email to renter
 */
export const sendRentalConfirmationToRenter = async (
  data: RentalNotificationData
): Promise<boolean> => {
  const { booking, listing, renter, owner } = data;
  
  const subject = `Rental Confirmed: ${listing.title}`;
  const html = generateRentalConfirmationHtml(data, "renter");
  
  return sendEmail(renter.email, subject, html);
};

/**
 * Send rental notification email to owner
 */
export const sendRentalNotificationToOwner = async (
  data: RentalNotificationData
): Promise<boolean> => {
  const { booking, listing, renter, owner } = data;
  
  const subject = `New Rental Booking: ${listing.title}`;
  const html = generateRentalConfirmationHtml(data, "owner");
  
  return sendEmail(owner.email, subject, html);
};

/**
 * Send sale confirmation email to buyer
 */
export const sendSaleConfirmationToBuyer = async (
  data: SaleNotificationData
): Promise<boolean> => {
  const { purchase, listing, buyer } = data;
  
  const subject = `Purchase Confirmed: ${listing.title}`;
  const html = generateSaleConfirmationHtml(data, "buyer");
  
  return sendEmail(buyer.email, subject, html);
};

/**
 * Send sale notification email to owner
 */
export const sendSaleNotificationToOwner = async (
  data: SaleNotificationData
): Promise<boolean> => {
  const { purchase, listing, owner } = data;
  
  const subject = `Item Sold: ${listing.title}`;
  const html = generateSaleConfirmationHtml(data, "owner");
  
  return sendEmail(owner.email, subject, html);
};

/**
 * Generate rental confirmation HTML
 */
function generateRentalConfirmationHtml(
  data: RentalNotificationData,
  recipient: "renter" | "owner"
): string {
  const { booking, listing, renter, owner } = data;
  const isRenter = recipient === "renter";
  
  const recipientName = isRenter 
    ? (renter.displayName || renter.firstName || "there")
    : (owner.displayName || owner.firstName || "there");
  
  const otherPartyName = isRenter
    ? (owner.displayName || owner.firstName || "the owner")
    : (renter.displayName || renter.firstName || "the renter");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isRenter ? "Rental Confirmed" : "New Rental Booking"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">GearGrab</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          ${isRenter ? "Your rental is confirmed!" : "You have a new rental booking!"}
        </p>
      </div>
      
      <!-- Content -->
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">
          Hi ${recipientName}!
        </h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          ${isRenter 
            ? `Great news! Your rental booking for <strong>${listing.title}</strong> has been confirmed and payment processed successfully.`
            : `You have received a new rental booking for <strong>${listing.title}</strong> from ${otherPartyName}.`
          }
        </p>
        
        <!-- Booking Details -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
          
          <div style="margin: 15px 0;">
            <strong>Item:</strong> ${listing.title}<br>
            <strong>Rental Period:</strong> ${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}<br>
            <strong>Duration:</strong> ${booking.dates.length} ${booking.dates.length === 1 ? "day" : "days"}<br>
            <strong>Delivery:</strong> ${booking.deliveryOption === "delivery" ? "Delivery" : "Pickup"}<br>
            <strong>Insurance:</strong> ${booking.insuranceOption ? "Yes" : "No"}<br>
            <strong>Total Cost:</strong> $${booking.totalCost.toFixed(2)}
          </div>
          
          ${isRenter 
            ? `<p style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 5px; color: #2d5a2d;">
                 <strong>✓ Payment Confirmed</strong><br>
                 Your payment has been processed successfully.
               </p>`
            : `<p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; color: #856404;">
                 <strong>💰 Payment Received</strong><br>
                 The rental payment has been processed and will be transferred to your account.
               </p>`
          }
        </div>
        
        <!-- Next Steps -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Next Steps</h3>
          ${isRenter 
            ? `<ul style="padding-left: 20px;">
                 <li>You'll receive pickup/delivery details from ${otherPartyName} soon</li>
                 <li>Make sure to inspect the item upon receipt</li>
                 <li>Contact the owner if you have any questions</li>
                 <li>Return the item in the same condition by the end date</li>
               </ul>`
            : `<ul style="padding-left: 20px;">
                 <li>Contact ${otherPartyName} to arrange pickup/delivery</li>
                 <li>Prepare the item for rental</li>
                 <li>Ensure the item is in good condition</li>
                 <li>Collect the item at the end of the rental period</li>
               </ul>`
          }
        </div>
        
        <!-- Contact Info -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Contact Information</h3>
          <p>
            <strong>${isRenter ? "Owner" : "Renter"}:</strong> ${otherPartyName}<br>
            <strong>Email:</strong> ${isRenter ? owner.email : renter.email}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at <a href="mailto:support@geargrab.com" style="color: #667eea;">support@geargrab.com</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 15px;">
            This email was sent by GearGrab. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate sale confirmation HTML
 */
function generateSaleConfirmationHtml(
  data: SaleNotificationData,
  recipient: "buyer" | "owner"
): string {
  const { purchase, listing, buyer, owner } = data;
  const isBuyer = recipient === "buyer";
  
  const recipientName = isBuyer 
    ? (buyer.displayName || buyer.firstName || "there")
    : (owner.displayName || owner.firstName || "there");
  
  const otherPartyName = isBuyer
    ? (owner.displayName || owner.firstName || "the seller")
    : (buyer.displayName || buyer.firstName || "the buyer");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isBuyer ? "Purchase Confirmed" : "Item Sold"}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">GearGrab</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
          ${isBuyer ? "Your purchase is confirmed!" : "Your item has been sold!"}
        </p>
      </div>
      
      <!-- Content -->
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">
          Hi ${recipientName}!
        </h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
          ${isBuyer 
            ? `Congratulations! Your purchase of <strong>${listing.title}</strong> has been confirmed and payment processed successfully.`
            : `Great news! Your item <strong>${listing.title}</strong> has been sold to ${otherPartyName}.`
          }
        </p>
        
        <!-- Purchase Details -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea;">Purchase Details</h3>
          
          <div style="margin: 15px 0;">
            <strong>Item:</strong> ${listing.title}<br>
            <strong>Amount:</strong> $${purchase.amount.toFixed(2)}<br>
            ${purchase.shippingAddress ? `<strong>Shipping Address:</strong><br>
              ${purchase.shippingAddress.line1}<br>
              ${purchase.shippingAddress.line2 ? purchase.shippingAddress.line2 + "<br>" : ""}
              ${purchase.shippingAddress.city}, ${purchase.shippingAddress.state} ${purchase.shippingAddress.postal_code}<br>
              ${purchase.shippingAddress.country}<br>` : ""}
          </div>
          
          ${isBuyer 
            ? `<p style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 5px; color: #2d5a2d;">
                 <strong>✓ Payment Confirmed</strong><br>
                 Your payment has been processed successfully.
               </p>`
            : `<p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; color: #856404;">
                 <strong>💰 Payment Received</strong><br>
                 The sale payment has been processed and will be transferred to your account.
               </p>`
          }
        </div>
        
        <!-- Next Steps -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Next Steps</h3>
          ${isBuyer 
            ? `<ul style="padding-left: 20px;">
                 <li>The seller will prepare your item for shipping</li>
                 <li>You'll receive tracking information once shipped</li>
                 <li>Contact the seller if you have any questions</li>
                 <li>Leave a review after receiving your item</li>
               </ul>`
            : `<ul style="padding-left: 20px;">
                 <li>Prepare the item for shipping to the buyer</li>
                 <li>Package the item securely</li>
                 <li>Ship to the provided address</li>
                 <li>Provide tracking information to the buyer</li>
               </ul>`
          }
        </div>
        
        <!-- Contact Info -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #667eea;">Contact Information</h3>
          <p>
            <strong>${isBuyer ? "Seller" : "Buyer"}:</strong> ${otherPartyName}<br>
            <strong>Email:</strong> ${isBuyer ? owner.email : buyer.email}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at <a href="mailto:support@geargrab.com" style="color: #667eea;">support@geargrab.com</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 15px;">
            This email was sent by GearGrab. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
