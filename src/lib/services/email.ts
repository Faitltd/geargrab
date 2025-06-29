// Email service - refactored into modular components
// This file maintains backward compatibility while using the new modular structure

// Re-export everything from the new modular email service
export * from "./email/index";

// Maintain backward compatibility with the old interface
export { emailService as emailTemplates } from "./email/index";
export { sendEmail } from "./email/index";
