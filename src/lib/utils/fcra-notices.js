/**
 * FCRA-Compliant Email Notices
 * Handles pre-adverse and final adverse action notices as required by FCRA
 */

import nodemailer from 'nodemailer';

class FCRANoticeService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT) || 587,
      secure: process.env.EMAIL_SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.fromEmail = process.env.COMPANY_FROM_EMAIL || 'no-reply@geargrab.co';
  }

  /**
   * Send pre-adverse action notice as required by FCRA
   * @param {string} toEmail - Recipient email address
   * @param {string} reportPdfUrl - URL to the background check report PDF
   * @param {Object} candidateInfo - Candidate information
   * @returns {Promise<boolean>} Success status
   */
  async sendPreAdverseNotice(toEmail, reportPdfUrl, candidateInfo = {}) {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: toEmail,
        subject: 'Important: Pre-Adverse Action Notice from GearGrab',
        html: this.generatePreAdverseHTML(reportPdfUrl, candidateInfo),
        text: this.generatePreAdverseText(reportPdfUrl, candidateInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Pre-adverse notice sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('Error sending pre-adverse notice:', error);
      throw new Error(`Failed to send pre-adverse notice: ${error.message}`);
    }
  }

  /**
   * Send final adverse action notice as required by FCRA
   * @param {string} toEmail - Recipient email address
   * @param {string} reportPdfUrl - URL to the background check report PDF
   * @param {Object} candidateInfo - Candidate information
   * @returns {Promise<boolean>} Success status
   */
  async sendFinalAdverseNotice(toEmail, reportPdfUrl, candidateInfo = {}) {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: toEmail,
        subject: 'Final Adverse Action Notice from GearGrab',
        html: this.generateFinalAdverseHTML(reportPdfUrl, candidateInfo),
        text: this.generateFinalAdverseText(reportPdfUrl, candidateInfo)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Final adverse notice sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('Error sending final adverse notice:', error);
      throw new Error(`Failed to send final adverse notice: ${error.message}`);
    }
  }

  /**
   * Generate HTML content for pre-adverse notice
   */
  generatePreAdverseHTML(reportPdfUrl, candidateInfo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pre-Adverse Action Notice</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .notice-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .contact-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Pre-Adverse Action Notice</h1>
          <p><strong>From:</strong> GearGrab, Inc.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>Dear ${candidateInfo.firstName || 'Applicant'},</p>

        <div class="notice-box">
          <p><strong>IMPORTANT NOTICE:</strong> This is not a final denial of your application.</p>
        </div>

        <p>We are writing to inform you that we have obtained a consumer report as part of your application to use GearGrab's platform for renting or listing outdoor gear. The information in this report may result in an adverse action regarding your application.</p>

        <p><strong>What this means:</strong></p>
        <ul>
          <li>We have not made a final decision on your application</li>
          <li>You have the right to review the information that may affect our decision</li>
          <li>You have the right to dispute any inaccurate information</li>
          <li>We will wait at least 5 business days before making a final decision</li>
        </ul>

        <p><strong>Your Consumer Report:</strong></p>
        <p>You can view your complete consumer report by clicking the link below:</p>
        <a href="${reportPdfUrl}" class="button">View Your Background Check Report</a>

        <div class="contact-info">
          <h3>Consumer Reporting Agency Information:</h3>
          <p><strong>iProspectCheck, Inc.</strong><br>
          1234 Background Lane<br>
          Suite 100<br>
          Denver, CO 80202<br>
          Phone: 800-555-1234</p>

          <p><strong>Important:</strong> iProspectCheck, Inc. did not make the decision to take adverse action and cannot provide specific reasons for the decision. They can only provide information about the contents of your report.</p>
        </div>

        <p><strong>Your Rights Under the Fair Credit Reporting Act:</strong></p>
        <ul>
          <li>You have the right to obtain a free copy of your consumer report from iProspectCheck</li>
          <li>You have the right to dispute incomplete or inaccurate information with iProspectCheck</li>
          <li>You have the right to add a statement to your file explaining any disputed information</li>
          <li>Consumer reporting agencies must correct or delete inaccurate, incomplete, or unverifiable information</li>
        </ul>

        <p><strong>Next Steps:</strong></p>
        <p>If you believe any information in your report is inaccurate or incomplete, please contact iProspectCheck directly using the information provided above. We will wait at least 5 business days from the date of this notice before making a final decision on your application.</p>

        <p>If you have any questions about this notice or our decision-making process, please contact us at <a href="mailto:support@geargrab.co">support@geargrab.co</a>.</p>

        <p>Sincerely,<br>
        The GearGrab Team</p>

        <div class="footer">
          <p>This notice is provided in compliance with the Fair Credit Reporting Act (FCRA). GearGrab, Inc. is committed to fair and lawful hiring and tenant screening practices.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text content for pre-adverse notice
   */
  generatePreAdverseText(reportPdfUrl, candidateInfo) {
    return `
PRE-ADVERSE ACTION NOTICE

From: GearGrab, Inc.
Date: ${new Date().toLocaleDateString()}

Dear ${candidateInfo.firstName || 'Applicant'},

IMPORTANT NOTICE: This is not a final denial of your application.

We are writing to inform you that we have obtained a consumer report as part of your application to use GearGrab's platform for renting or listing outdoor gear. The information in this report may result in an adverse action regarding your application.

What this means:
• We have not made a final decision on your application
• You have the right to review the information that may affect our decision
• You have the right to dispute any inaccurate information
• We will wait at least 5 business days before making a final decision

Your Consumer Report:
You can view your complete consumer report at: ${reportPdfUrl}

Consumer Reporting Agency Information:
iProspectCheck, Inc.
1234 Background Lane
Suite 100
Denver, CO 80202
Phone: 800-555-1234

Important: iProspectCheck, Inc. did not make the decision to take adverse action and cannot provide specific reasons for the decision. They can only provide information about the contents of your report.

Your Rights Under the Fair Credit Reporting Act:
• You have the right to obtain a free copy of your consumer report from iProspectCheck
• You have the right to dispute incomplete or inaccurate information with iProspectCheck
• You have the right to add a statement to your file explaining any disputed information
• Consumer reporting agencies must correct or delete inaccurate, incomplete, or unverifiable information

Next Steps:
If you believe any information in your report is inaccurate or incomplete, please contact iProspectCheck directly using the information provided above. We will wait at least 5 business days from the date of this notice before making a final decision on your application.

If you have any questions about this notice or our decision-making process, please contact us at support@geargrab.co.

Sincerely,
The GearGrab Team

This notice is provided in compliance with the Fair Credit Reporting Act (FCRA). GearGrab, Inc. is committed to fair and lawful hiring and tenant screening practices.
    `;
  }

  /**
   * Generate HTML content for final adverse notice
   */
  generateFinalAdverseHTML(reportPdfUrl, candidateInfo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Final Adverse Action Notice</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .notice-box { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .contact-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Final Adverse Action Notice</h1>
          <p><strong>From:</strong> GearGrab, Inc.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>Dear ${candidateInfo.firstName || 'Applicant'},</p>

        <div class="notice-box">
          <p><strong>FINAL DECISION:</strong> We regret to inform you that your application has been denied.</p>
        </div>

        <p>After careful review of your consumer report, we have determined that you do not meet our eligibility criteria for using GearGrab's platform to rent or list outdoor gear.</p>

        <p><strong>This decision was based in whole or in part on information contained in your consumer report obtained from:</strong></p>

        <div class="contact-info">
          <h3>Consumer Reporting Agency:</h3>
          <p><strong>iProspectCheck, Inc.</strong><br>
          1234 Background Lane<br>
          Suite 100<br>
          Denver, CO 80202<br>
          Phone: 800-555-1234</p>
        </div>

        <p><strong>Your Consumer Report:</strong></p>
        <p>You can view your complete consumer report by clicking the link below:</p>
        <a href="${reportPdfUrl}" class="button">View Your Background Check Report</a>

        <p><strong>Your Rights Under the Fair Credit Reporting Act:</strong></p>
        <ul>
          <li>You have the right to obtain a free copy of your consumer report from Checkr, Inc. within 60 days of this notice</li>
          <li>You have the right to dispute incomplete or inaccurate information directly with Checkr, Inc.</li>
          <li>You have the right to add a statement to your file explaining any disputed information</li>
          <li>If you dispute information and it is found to be inaccurate, you have the right to have GearGrab reconsider your application</li>
        </ul>

        <p><strong>Important:</strong> Checkr, Inc. did not make the decision to deny your application and cannot provide specific reasons for our decision. They can only provide information about the contents of your report and assist with any disputes about the accuracy of the information.</p>

        <p><strong>Future Applications:</strong></p>
        <p>You may reapply to GearGrab in the future. If you believe the information in your consumer report was inaccurate and you have had it corrected, please feel free to submit a new application.</p>

        <p>If you have any questions about this decision, please contact us at <a href="mailto:support@geargrab.co">support@geargrab.co</a>.</p>

        <p>Thank you for your interest in GearGrab.</p>

        <p>Sincerely,<br>
        The GearGrab Team</p>

        <div class="footer">
          <p>This notice is provided in compliance with the Fair Credit Reporting Act (FCRA). GearGrab, Inc. is committed to fair and lawful hiring and tenant screening practices.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text content for final adverse notice
   */
  generateFinalAdverseText(reportPdfUrl, candidateInfo) {
    return `
FINAL ADVERSE ACTION NOTICE

From: GearGrab, Inc.
Date: ${new Date().toLocaleDateString()}

Dear ${candidateInfo.firstName || 'Applicant'},

FINAL DECISION: We regret to inform you that your application has been denied.

After careful review of your consumer report, we have determined that you do not meet our eligibility criteria for using GearGrab's platform to rent or list outdoor gear.

This decision was based in whole or in part on information contained in your consumer report obtained from:

Consumer Reporting Agency:
Checkr, Inc.
1 Montgomery Street, Suite 2400
San Francisco, CA 94104
Phone: (844) 824-3257
Website: checkr.com

Your Consumer Report:
You can view your complete consumer report at: ${reportPdfUrl}

Your Rights Under the Fair Credit Reporting Act:
• You have the right to obtain a free copy of your consumer report from Checkr, Inc. within 60 days of this notice
• You have the right to dispute incomplete or inaccurate information directly with Checkr, Inc.
• You have the right to add a statement to your file explaining any disputed information
• If you dispute information and it is found to be inaccurate, you have the right to have GearGrab reconsider your application

Important: Checkr, Inc. did not make the decision to deny your application and cannot provide specific reasons for our decision. They can only provide information about the contents of your report and assist with any disputes about the accuracy of the information.

Future Applications:
You may reapply to GearGrab in the future. If you believe the information in your consumer report was inaccurate and you have had it corrected, please feel free to submit a new application.

If you have any questions about this decision, please contact us at support@geargrab.co.

Thank you for your interest in GearGrab.

Sincerely,
The GearGrab Team

This notice is provided in compliance with the Fair Credit Reporting Act (FCRA). GearGrab, Inc. is committed to fair and lawful hiring and tenant screening practices.
    `;
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Success status
   */
  async testEmailConfiguration() {
    try {
      await this.transporter.verify();
      console.log('Email configuration is valid');
      return true;
    } catch (error) {
      console.error('Email configuration error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fcraNoticeService = new FCRANoticeService();
export default fcraNoticeService;
