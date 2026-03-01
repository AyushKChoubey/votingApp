const mailjet = require("node-mailjet");
const serviceHealth = require("./serviceHealth");

/**
 * Email Service for sending verification and notification emails
 */
class EmailService {
  constructor() {
    this.mailjetClient = null;
    this.initialized = false;
  }

  /**
   * Sanitize HTML to prevent XSS attacks in emails
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  sanitizeHtml(str) {
    if (!str || typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Initialize email service with Mailjet SDK
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if Mailjet credentials are configured
      const hasMailjetCredentials =
        process.env.MAILJET_API_KEY &&
        process.env.MAILJET_SECRET_KEY &&
        process.env.EMAIL_USER;

      if (hasMailjetCredentials) {
        // Initialize Mailjet client using SDK
        this.mailjetClient = mailjet.apiConnect(
          process.env.MAILJET_API_KEY,
          process.env.MAILJET_SECRET_KEY
        );

        console.log(`✅ Email service initialized with Mailjet SDK`);
        console.log(`   Sending from: ${process.env.EMAIL_USER}`);
        
        this.initialized = true;
        
        // Mark email service healthy for the global health tracker
        try {
          serviceHealth.setStatus("email", true);
        } catch (e) {
          // ignore if serviceHealth isn't available for some reason
        }
        
        console.log("✅ Email service ready");
      } else {
        console.warn("⚠️  Mailjet credentials not configured");
        console.log(
          "   💡 Configure MAILJET_API_KEY, MAILJET_SECRET_KEY, and EMAIL_USER in .env to send emails",
        );
        
        // Mark email service as unhealthy
        try {
          serviceHealth.setStatus("email", false);
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      // Mark email service as unhealthy so /api/health/services reflects the issue
      try {
        serviceHealth.setStatus("email", false);
      } catch (e) {
        // ignore
      }
      // Don't throw - allow app to run without email in development
    }
  }

  /**
   * Send email verification link
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.name - Recipient name
   * @param {string} options.token - Verification token (unhashed)
   */
  async sendVerificationEmail({ to, name, token }) {
    if (!this.initialized || !this.mailjetClient) {
      console.warn("⚠️  Email service not initialized. Skipping email.");
      return { success: false, message: "Email service unavailable" };
    }

    try {
      const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

      const request = await this.mailjetClient
        .post("send", { version: "v3.1" })
        .request({
          Messages: [
            {
              From: {
                Email: process.env.EMAIL_USER || "noreply@votebooth.com",
                Name: "VoteBooth",
              },
              To: [
                {
                  Email: to,
                  Name: name,
                },
              ],
              Subject: "Verify Your Email - VoteBooth",
              TextPart: `Hello ${name},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
              HTMLPart: this.getVerificationEmailTemplate(name, verificationUrl),
            },
          ],
        });

      console.log(`✅ Verification email sent to ${to}`);

      return {
        success: true,
        messageId: request.body.Messages[0].To[0].MessageID,
      };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.name - Recipient name
   * @param {string} options.token - Reset token
   */
  async sendPasswordResetEmail({ to, name, token }) {
    if (!this.initialized || !this.mailjetClient) {
      console.warn("⚠️  Email service not initialized. Skipping email.");
      return { success: false, message: "Email service unavailable" };
    }

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

      const request = await this.mailjetClient
        .post("send", { version: "v3.1" })
        .request({
          Messages: [
            {
              From: {
                Email: process.env.EMAIL_USER || "noreply@votebooth.com",
                Name: "VoteBooth",
              },
              To: [
                {
                  Email: to,
                  Name: name,
                },
              ],
              Subject: "Password Reset Request - VoteBooth",
              TextPart: `Hello ${name},\n\nYou requested a password reset. Click this link to reset:\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
              HTMLPart: this.getPasswordResetTemplate(name, resetUrl),
            },
          ],
        });

      console.log(`✅ Password reset email sent to ${to}`);

      return {
        success: true,
        messageId: request.body.Messages[0].To[0].MessageID,
      };
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send contact form message to support email
   * @param {Object} options - Email options
   * @param {string} options.name - Sender name
   * @param {string} options.email - Sender email
   * @param {string} options.subject - Message subject
   * @param {string} options.message - Message content
   */
  async sendContactFormEmail({ name, email, subject, message }) {
    if (!this.initialized || !this.mailjetClient) {
      console.warn("⚠️  Email service not initialized. Skipping email.");
      return { success: false, message: "Email service unavailable" };
    }

    try {
      // Sanitize all user inputs to prevent XSS
      const sanitizedName = this.sanitizeHtml(name);
      const sanitizedEmail = this.sanitizeHtml(email);
      const sanitizedSubject = this.sanitizeHtml(subject);
      const sanitizedMessage = this.sanitizeHtml(message);

      // Use environment variable for support email with fallback
      const supportEmail = process.env.SUPPORT_EMAIL || "votebooth1@gmail.com";

      const request = await this.mailjetClient
        .post("send", { version: "v3.1" })
        .request({
          Messages: [
            {
              From: {
                Email: process.env.EMAIL_USER || "noreply@votebooth.com",
                Name: "VoteBooth Contact Form",
              },
              To: [
                {
                  Email: supportEmail,
                  Name: "VoteBooth Support",
                },
              ],
              ReplyTo: {
                Email: email,
                Name: name,
              },
              Subject: `Contact Form: ${sanitizedSubject}`,
              TextPart: `New contact form message from ${name} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
              HTMLPart: this.getContactFormTemplate(
                sanitizedName,
                sanitizedEmail,
                sanitizedSubject,
                sanitizedMessage,
              ),
            },
          ],
        });

      console.log(`✅ Contact form email sent from ${email}`);

      return {
        success: true,
        messageId: request.body.Messages[0].To[0].MessageID,
      };
    } catch (error) {
      console.error("❌ Failed to send contact form email:", error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * HTML template for email verification
   */
  getVerificationEmailTemplate(name, verificationUrl) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
                    .button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
                    .button:hover { background-color: #1d4ed8; }
                    .link-text { word-break: break-all; color: #2563eb; font-size: 14px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to VoteBooth!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${name},</p>
                        <p>Thank you for registering with VoteBooth. Please verify your email address to activate your account.</p>
                        <p style="text-align: center;">
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p class="link-text">${verificationUrl}</p>
                        <p><strong>This link expires in 24 hours.</strong></p>
                        <p>If you didn't create an account with VoteBooth, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 VoteBooth. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  /**
   * HTML template for password reset
   */
  getPasswordResetTemplate(name, resetUrl) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
                    .button { display: inline-block; padding: 14px 28px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500; }
                    .button:hover { background-color: #b91c1c; }
                    .link-text { word-break: break-all; color: #dc2626; font-size: 14px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${name},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p class="link-text">${resetUrl}</p>
                        <p><strong>This link expires in 10 minutes.</strong></p>
                        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 VoteBooth. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }

  /**
   * HTML template for contact form
   */
  getContactFormTemplate(name, email, subject, message) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .content { background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
                    .info-row { margin: 10px 0; padding: 12px; background: #f9fafb; border-left: 4px solid #059669; border-radius: 4px; }
                    .label { font-weight: 600; color: #047857; display: inline-block; min-width: 70px; }
                    .message-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    a { color: #2563eb; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Contact Form Submission</h1>
                    </div>
                    <div class="content">
                        <div class="info-row">
                            <span class="label">From:</span> ${name}
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                        </div>
                        <div class="info-row">
                            <span class="label">Subject:</span> ${subject}
                        </div>
                        <div class="message-box">
                            <p class="label">Message:</p>
                            <p style="white-space: pre-wrap; margin: 10px 0 0 0;">${message}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2026 VoteBooth. All rights reserved.</p>
                        <p>Sent via VoteBooth Contact Form</p>
                    </div>
                </div>
            </body>
            </html>
        `;
  }
}

// Export singleton instance
const emailService = new EmailService();
module.exports = emailService;
