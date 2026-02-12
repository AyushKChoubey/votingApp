const nodemailer = require("nodemailer");

/**
 * Email Service for sending verification and notification emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
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
   * Initialize email transporter
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if Mailjet credentials are configured
      const hasMailjetCredentials =
        process.env.MAILJET_API_KEY &&
        process.env.MAILJET_SECRET_KEY &&
        process.env.EMAIL_USER;

      // Create transporter based on credentials availability
      if (hasMailjetCredentials) {
        // Use Mailjet SMTP service
        this.transporter = nodemailer.createTransport({
          host: "in-v3.mailjet.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.MAILJET_API_KEY,
            pass: process.env.MAILJET_SECRET_KEY,
          },
        });

        console.log(`✅ Email service initialized with Mailjet`);
        console.log(`   Sending from: ${process.env.EMAIL_USER}`);
      } else {
        // Development: Use Ethereal (fake SMTP service for testing)
        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        console.log("📧 Email service initialized with Ethereal (test mode)");
        console.log(
          "   💡 Configure MAILJET_API_KEY, MAILJET_SECRET_KEY, and EMAIL_USER in .env to send real emails",
        );
        console.log("   Preview emails at: https://ethereal.email");
      }

      // Verify transporter
      await this.transporter.verify();
      this.initialized = true;
      console.log("✅ Email service ready");
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
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
    if (!this.initialized || !this.transporter) {
      console.warn("⚠️  Email service not initialized. Skipping email.");
      return { success: false, message: "Email service unavailable" };
    }

    try {
      const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;

      const mailOptions = {
        from: `"VoteBooth" <${process.env.EMAIL_USER || "noreply@votebooth.com"}>`,
        to,
        subject: "Verify Your Email - VoteBooth",
        html: this.getVerificationEmailTemplate(name, verificationUrl),
        text: `Hello ${name},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // In development, log preview URL (only works with Ethereal test accounts)
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (process.env.NODE_ENV !== "production" && previewUrl) {
        console.log("📨 Preview email at:", previewUrl);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
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
    if (!this.initialized || !this.transporter) {
      console.warn("⚠️  Email service not initialized. Skipping email.");
      return { success: false, message: "Email service unavailable" };
    }

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: `"VoteBooth" <${process.env.EMAIL_USER || "noreply@votebooth.com"}>`,
        to,
        subject: "Password Reset Request - VoteBooth",
        html: this.getPasswordResetTemplate(name, resetUrl),
        text: `Hello ${name},\n\nYou requested a password reset. Click this link to reset:\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("📨 Password reset email preview:", previewUrl);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl:
          process.env.NODE_ENV !== "production"
            ? nodemailer.getTestMessageUrl(info)
            : null,
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
    if (!this.initialized || !this.transporter) {
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

      const mailOptions = {
        from: `"VoteBooth Contact Form" <${process.env.EMAIL_USER || "noreply@votebooth.com"}>`,
        replyTo: email, // Keep original email for reply-to
        to: supportEmail,
        subject: `Contact Form: ${sanitizedSubject}`,
        html: this.getContactFormTemplate(
          sanitizedName,
          sanitizedEmail,
          sanitizedSubject,
          sanitizedMessage,
        ),
        text: `New contact form message from ${name} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV !== "production") {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("📨 Contact form email preview:", previewUrl);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl:
          process.env.NODE_ENV !== "production"
            ? nodemailer.getTestMessageUrl(info)
            : null,
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
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
                        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
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
                        <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-row { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #667eea; }
                    .label { font-weight: bold; color: #667eea; }
                    .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
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
                            <p style="white-space: pre-wrap;">${message}</p>
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
