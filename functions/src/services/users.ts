import * as admin from "firebase-admin";
import type { UserData } from "./email";

const db = admin.firestore();
const auth = admin.auth();

/**
 * Get user data by UID
 * Combines Firebase Auth data with Firestore profile data
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    // Get user from Firebase Auth
    const userRecord = await auth.getUser(uid);
    
    // Get additional profile data from Firestore (if exists)
    let profileData: any = {};
    try {
      const profileDoc = await db.collection("users").doc(uid).get();
      if (profileDoc.exists) {
        profileData = profileDoc.data() || {};
      }
    } catch (profileError) {
      console.warn("Could not fetch user profile data:", profileError);
      // Continue without profile data
    }

    // Combine auth and profile data
    const userData: UserData = {
      uid: userRecord.uid,
      email: userRecord.email || "",
      displayName: userRecord.displayName || profileData.displayName || "",
      firstName: profileData.firstName || extractFirstName(userRecord.displayName),
      lastName: profileData.lastName || extractLastName(userRecord.displayName),
    };

    return userData;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

/**
 * Get multiple users data by UIDs
 */
export const getUsersData = async (uids: string[]): Promise<{ [uid: string]: UserData | null }> => {
  const results: { [uid: string]: UserData | null } = {};
  
  // Fetch users in parallel
  const promises = uids.map(async (uid) => {
    const userData = await getUserData(uid);
    results[uid] = userData;
  });
  
  await Promise.all(promises);
  return results;
};

/**
 * Create or update user profile in Firestore
 */
export const createOrUpdateUserProfile = async (
  uid: string,
  profileData: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }
): Promise<void> => {
  try {
    const userRef = db.collection("users").doc(uid);
    
    // Check if profile exists
    const existingProfile = await userRef.get();
    
    const updateData = {
      ...profileData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (existingProfile.exists) {
      // Update existing profile
      await userRef.update(updateData);
    } else {
      // Create new profile
      await userRef.set({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log("User profile updated:", uid);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Get user's notification preferences
 */
export const getUserNotificationPreferences = async (uid: string): Promise<{
  emailNotifications: boolean;
  rentalConfirmations: boolean;
  saleConfirmations: boolean;
  marketingEmails: boolean;
}> => {
  try {
    const prefsDoc = await db.collection("users").doc(uid).collection("preferences").doc("notifications").get();
    
    if (prefsDoc.exists) {
      const prefs = prefsDoc.data();
      return {
        emailNotifications: prefs?.emailNotifications ?? true,
        rentalConfirmations: prefs?.rentalConfirmations ?? true,
        saleConfirmations: prefs?.saleConfirmations ?? true,
        marketingEmails: prefs?.marketingEmails ?? false,
      };
    }
    
    // Default preferences
    return {
      emailNotifications: true,
      rentalConfirmations: true,
      saleConfirmations: true,
      marketingEmails: false,
    };
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    // Return default preferences on error
    return {
      emailNotifications: true,
      rentalConfirmations: true,
      saleConfirmations: true,
      marketingEmails: false,
    };
  }
};

/**
 * Update user's notification preferences
 */
export const updateUserNotificationPreferences = async (
  uid: string,
  preferences: {
    emailNotifications?: boolean;
    rentalConfirmations?: boolean;
    saleConfirmations?: boolean;
    marketingEmails?: boolean;
  }
): Promise<void> => {
  try {
    const prefsRef = db.collection("users").doc(uid).collection("preferences").doc("notifications");
    
    await prefsRef.set({
      ...preferences,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log("Notification preferences updated:", uid);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

/**
 * Check if user should receive email notifications
 */
export const shouldSendEmailNotification = async (
  uid: string,
  notificationType: "rental" | "sale"
): Promise<boolean> => {
  try {
    const prefs = await getUserNotificationPreferences(uid);
    
    if (!prefs.emailNotifications) {
      return false;
    }
    
    if (notificationType === "rental" && !prefs.rentalConfirmations) {
      return false;
    }
    
    if (notificationType === "sale" && !prefs.saleConfirmations) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    // Default to sending notifications on error
    return true;
  }
};

/**
 * Extract first name from display name
 */
function extractFirstName(displayName?: string): string {
  if (!displayName) return "";
  return displayName.split(" ")[0] || "";
}

/**
 * Extract last name from display name
 */
function extractLastName(displayName?: string): string {
  if (!displayName) return "";
  const parts = displayName.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get user's display name with fallback
 */
export const getUserDisplayName = (userData: UserData): string => {
  if (userData.displayName) {
    return userData.displayName;
  }
  
  if (userData.firstName && userData.lastName) {
    return `${userData.firstName} ${userData.lastName}`;
  }
  
  if (userData.firstName) {
    return userData.firstName;
  }
  
  if (userData.email) {
    return userData.email.split("@")[0];
  }
  
  return "GearGrab User";
};

/**
 * Log user activity for analytics
 */
export const logUserActivity = async (
  uid: string,
  activity: string,
  metadata?: { [key: string]: any }
): Promise<void> => {
  try {
    await db.collection("user_activity").add({
      uid,
      activity,
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging user activity:", error);
    // Don't throw error for logging failures
  }
};
