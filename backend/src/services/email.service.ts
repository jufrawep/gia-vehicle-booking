 /* @desc  Email service using Nodemailer with Gmail SMTP.
 *
 * Features:
 *   - Sends transactional emails (booking confirmation, welcome, password reset, payment)
 *   - Persists each sent email as a notification in the database
 *   - Fire‑and‑forget design – never blocks the main flow
 *   - Development mode simulates sending when credentials are missing
 *   - Detailed error logging with actionable suggestions
 *
 */

import nodemailer from "nodemailer";
import prisma from "../utils/prisma.util";
import { logger } from "../utils/logger.util";

const SVC = "EmailService";

// ─── Helper: persists each sent email in the notifications table ────────
/**
 * Creates a record in the `notifications` table after an email is sent.
 * userId can be null if the user is not yet known (e.g., reset token).
 * Never blocks execution — errors are logged silently.
 */
async function createNotification(params: {
  userId: string;
  type: string; // ex: 'BOOKING_CONFIRMATION', 'WELCOME', 'PASSWORD_RESET'
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ? JSON.stringify(params.metadata) : "{}",
        is_read: false,
      },
    });
    logger.debug(SVC, "Notification created", {
      userId: params.userId,
      type: params.type,
    });
  } catch (err: any) {
    logger.warn(SVC, "Failed to create notification record", {
      error: err?.message,
    });
  }
}

/*const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});*/

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Core email sending function with enhanced error handling.
 */
/*export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Variables email non configurées. Email simulé.");
      console.log(`Email simulé à ${options.to}: ${options.subject}`);
      console.log(
        `Contenu: ${options.text || options.html?.substring(0, 100)}...`,
      );
      return;
    }

    const mailOptions = {
      from: `"GIA Vehicle Booking" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(SVC, "Email sent successfully", {
      recipient: options.to,
      messageId: info.messageId,
      subject: options.subject,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`📎 Preview: https://mail.google.com/mail/u/0/#inbox`);
    }
  } catch (error: any) {
    logger.error(SVC, "Email sending failed", {
      error: error.message,
      code: error.code,
      recipient: options.to,
    });

    if (error.code === "EAUTH") {
      logger.warn(SVC, "uthentication error details", {
        suggestions: [
          "2-factor authentication must be enabled",
          "Use an app password, not regular password",
          "Verify credentials in .env",
          "Generate new app password at: https://myaccount.google.com/apppasswords",
        ],
      });
    } else if (error.code === "ESOCKET") {
      logger.warn(SVC, "🔌 Connection error details", {
        suggestions: [
          "Check internet connection",
          "Verify SMTP settings",
          "Ensure ports are not blocked by firewall",
        ],
      });
    } else if (error.code === "EENVELOPE") {
      logger.warn(SVC, "Invalid recipient address", {
        recipient: options.to,
        suggestion: "Verify email address is valid",
      });
    }
  }
};*/

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY manquante. Email simulé.');
      console.log(`Email simulé à ${options.to}: ${options.subject}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `GIA Vehicle Booking <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to:      [options.to],
        subject: options.subject,
        html:    options.html,
        text:    options.text,
      }),
    });

    if (!response.ok) {
      const err = await response.json() as any;
      throw new Error(err.message || 'Resend API error');
    }

    logger.info(SVC, 'Email sent successfully', {
      recipient: options.to,
      subject:   options.subject,
    });

  } catch (error: any) {
    logger.error(SVC, 'Email sending failed', {
      error:     error.message,
      recipient: options.to,
    });
  }
};

/**
 * Booking confirmation email
 * Sent immediately after a successful booking
 */
export const sendBookingConfirmation = async (
  email: string,
  bookingDetails: {
    bookingId: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    userId: string; // ← ajouté pour la notification
  },
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
        }
        .header { 
          background: linear-gradient(135deg, #2A3180  0%, #1e3a8a 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content { 
          padding: 30px; 
        }
        .details { 
          background-color: #f8fafc; 
          padding: 25px; 
          border-left: 4px solid #189CD9 ;
          border-radius: 5px;
          margin: 25px 0;
        }
        .detail-item {
          margin-bottom: 10px;
          display: flex;
        }
        .detail-label {
          font-weight: 600;
          width: 140px;
          color: #4a5568;
        }
        .detail-value {
          flex: 1;
          color: #2d3748;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096; 
          font-size: 14px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background: linear-gradient(135deg, #189CD9  0%, #0096c7 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          margin-top: 25px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
        }
        .greeting {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 20px;
        }
        .thank-you {
          margin-top: 30px;
          font-style: italic;
          color: #4a5568;
        }
        @media (max-width: 600px) {
          .content { padding: 20px; }
          .details { padding: 15px; }
          .button { width: 100%; text-align: center; }
          .detail-item { flex-direction: column; }
          .detail-label { width: 100%; margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">GIA VEHICLE BOOKING</div>
          <h1>Réservation Confirmée ✓</h1>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour,<br>
            Votre réservation a été confirmée avec succès !
          </div>
          
          <p>Voici le récapitulatif de votre réservation :</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #2A3180 ;">📋 Détails de la réservation</h3>
            
            <div class="detail-item">
              <div class="detail-label">N° de réservation :</div>
              <div class="detail-value"><strong>${bookingDetails.bookingId}</strong></div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Véhicule :</div>
              <div class="detail-value">${bookingDetails.vehicleName}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Date de début :</div>
              <div class="detail-value">${bookingDetails.startDate}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Date de fin :</div>
              <div class="detail-value">${bookingDetails.endDate}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Prix total :</div>
              <div class="detail-value"><strong>${bookingDetails.totalPrice.toLocaleString()} FCFA</strong></div>
            </div>
          </div>
          
          <p style="margin-bottom: 25px;">
            Vous pouvez suivre l'état de votre réservation à tout moment depuis votre espace client.
            Pour toute question, n'hésitez pas à nous contacter.
          </p>
          
          <center>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings" class="button">
              👁️ Voir mes réservations
            </a>
          </center>
          
          <div class="thank-you">
            <p>Merci de votre confiance,</p>
            <p><strong>L'équipe GIA Vehicle Booking</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>GIA Group - Douala, Cameroun</p>
          <p>Téléphone: +237 672 969 799 | Email: contact@giagroup.net</p>
          <p>© ${new Date().getFullYear()} GIA Group. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Réservation Confirmée - GIA Vehicle Booking

Bonjour,

Votre réservation a été confirmée avec succès !

Détails de la réservation :
- N° de réservation : ${bookingDetails.bookingId}
- Véhicule : ${bookingDetails.vehicleName}
- Date de début : ${bookingDetails.startDate}
- Date de fin : ${bookingDetails.endDate}
- Prix total : ${bookingDetails.totalPrice.toLocaleString()} FCFA

Vous pouvez suivre l'état de votre réservation depuis votre espace client :
${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings

Merci de votre confiance,

L'équipe GIA Vehicle Booking
GIA Group - Douala, Cameroun
Téléphone: +237 672 969 799
Email: contact@giagroup.net

© ${new Date().getFullYear()} GIA Group. Tous droits réservés.
  `;

  await sendEmail({
    to: email,
    subject: `✅ Confirmation de réservation - ${bookingDetails.vehicleName}`,
    html,
    text,
  });

  // ── Persist notification ──────────────────────────────────────────────────
  await createNotification({
    userId: bookingDetails.userId,
    type: "BOOKING_CONFIRMATION",
    title: `Réservation confirmée — ${bookingDetails.vehicleName}`,
    message: `Votre réservation du ${bookingDetails.startDate} au ${bookingDetails.endDate} a été enregistrée. Total : ${bookingDetails.totalPrice.toLocaleString()} FCFA.`,
    metadata: {
      bookingId: bookingDetails.bookingId,
      vehicleName: bookingDetails.vehicleName,
      startDate: bookingDetails.startDate,
      endDate: bookingDetails.endDate,
      totalPrice: bookingDetails.totalPrice,
    },
  });
};

/**
 * User welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  userId: string,
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #2A3180  0%, #1e3a8a 100%); 
          color: white; 
          padding: 40px 20px; 
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }
        .tagline {
          font-size: 18px;
          opacity: 0.9;
          margin-top: 10px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-text {
          font-size: 18px;
          line-height: 1.8;
          color: #4a5568;
          margin-bottom: 30px;
        }
        .features {
          margin: 30px 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          padding: 12px 15px;
          background-color: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #189CD9 ;
        }
        .feature-icon {
          font-size: 20px;
          margin-right: 15px;
          color: #189CD9 ;
        }
        .button { 
          display: inline-block; 
          padding: 16px 36px; 
          background: linear-gradient(135deg, #189CD9  0%, #0096c7 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          margin-top: 30px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 180, 216, 0.2);
        }
        .footer { 
          text-align: center; 
          padding: 25px; 
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #718096; 
          font-size: 14px;
        }
        .contact-info {
          margin-top: 15px;
          font-size: 13px;
        }
        .highlight {
          color: #2A3180 ;
          font-weight: 600;
        }
        @media (max-width: 600px) {
          .content { padding: 25px 20px; }
          .header { padding: 30px 15px; }
          .button { width: 100%; text-align: center; }
          .feature-item { flex-direction: column; text-align: center; }
          .feature-icon { margin-right: 0; margin-bottom: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">GIA VEHICLE BOOKING</div>
          <h1>Bienvenue ${name} !</h1>
          <div class="tagline">Votre liberté de déplacement commence ici</div>
        </div>
        
        <div class="content">
          <div class="welcome-text">
            Nous sommes ravis de vous accueillir sur notre plateforme de location de véhicules.<br>
            Votre compte a été créé avec succès et vous êtes maintenant prêt à découvrir notre flotte.
          </div>
          
          <div class="features">
            <p style="font-weight: 600; color: #2A3180 ; margin-bottom: 15px;">Ce que vous pouvez faire :</p>
            
            <div class="feature-item">
              <div class="feature-icon">🚗</div>
              <div>Parcourir notre large sélection de véhicules</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">📅</div>
              <div>Réserver en ligne en quelques clics</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">💰</div>
              <div>Bénéficier des meilleurs tarifs</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <div>Gérer vos réservations depuis votre espace personnel</div>
            </div>
          </div>
          
          <center>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/vehicles" class="button">
              🚀 Découvrir nos véhicules
            </a>
            
            <p style="margin-top: 25px; font-size: 14px; color: #718096;">
              Besoin d'aide ? Consultez notre <span class="highlight">FAQ</span> ou <span class="highlight">contactez-nous</span>.
            </p>
          </center>
        </div>
        
        <div class="footer">
          <p>GIA Vehicle Booking - La location de véhicules simplifiée</p>
          <div class="contact-info">
            <p>📍 Douala, Cameroun | 📞 +237 672 969 799 | ✉️ contact@giagroup.net</p>
          </div>
          <p style="margin-top: 15px;">
            © ${new Date().getFullYear()} GIA Group. Tous droits réservés.<br>
            <small>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</small>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bienvenue sur GIA Vehicle Booking !

Bonjour ${name},

Nous sommes ravis de vous accueillir sur notre plateforme de location de véhicules.

Votre compte a été créé avec succès et vous pouvez dès maintenant :
- Parcourir notre large sélection de véhicules
- Réserver en ligne en quelques clics
- Bénéficier des meilleurs tarifs
- Gérer vos réservations depuis votre espace personnel

Commencez dès maintenant : ${process.env.FRONTEND_URL || "http://localhost:3000"}/vehicles

Besoin d'aide ? Consultez notre FAQ ou contactez-nous.

Merci de votre confiance,

L'équipe GIA Vehicle Booking
📍 Douala, Cameroun
📞 +237 672 969 799
✉️ contact@giagroup.net

© ${new Date().getFullYear()} GIA Group. Tous droits réservés.
  `;

  await sendEmail({
    to: email,
    subject: "🎉 Bienvenue sur GIA Vehicle Booking !",
    html,
    text,
  });

  // ── Persist notification ──────────────────────────────────────────────────
  await createNotification({
    userId: userId,
    type: "WELCOME",
    title: "Bienvenue sur GIA Vehicle Booking !",
    message: `Bonjour ${name}, votre compte a été créé avec succès. Découvrez notre flotte dès maintenant.`,
    metadata: { email },
  });
};

/**
 * Welcome email for new users
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string,
  userId: string,
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background-color: #2A3180 ; 
          color: white; 
          padding: 30px 20px; 
          text-align: center;
        }
        .content { 
          padding: 40px; 
        }
        .reset-button { 
          display: inline-block; 
          padding: 15px 30px; 
          background-color: #dc2626; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 25px 0;
          font-weight: 600;
          font-size: 16px;
        }
        .warning {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #718096; 
          font-size: 13px;
        }
        .token {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          font-family: monospace;
          word-break: break-all;
          margin: 20px 0;
          font-size: 14px;
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Réinitialisation de mot de passe</h2>
        </div>
        
        <div class="content">
          <p>Bonjour ${name},</p>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe GIA Vehicle Booking.</p>
          
          <center>
            <a href="${resetUrl}" class="reset-button">
              Réinitialiser mon mot de passe
            </a>
          </center>
          
          <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
          
          <div class="token">${resetUrl}</div>
          
          <div class="warning">
            ⚠️ <strong>Important :</strong> Ce lien expirera dans 1 heure.
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </div>
          
          <p>Cordialement,<br>L'équipe GIA Vehicle Booking</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} GIA Group. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "🔐 Réinitialisation de votre mot de passe GIA Vehicle Booking",
    html,
  });

  // ── Persist notification ──────────────────────────────────────────────────
  await createNotification({
    userId: userId,
    type: "PASSWORD_RESET",
    title: "Réinitialisation de mot de passe",
    message: `Bonjour ${name}, un lien de réinitialisation de mot de passe a été envoyé à ${email}. Ce lien est valable 1 heure.`,
    metadata: { email, expiresIn: "1h" },
  });
};

/**
 * Payment confirmation email
 * Sent after successful payment processing
 */
export const sendPaymentConfirmation = async (
  email: string,
  paymentDetails: {
    userName: string;
    userId: string;
    transactionId: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    amount: number;
    paymentMethod: string;
    cardMasked: string;
  },
): Promise<void> => {
  const methodLabel =
    paymentDetails.paymentMethod === "CARD"
      ? "Carte bancaire"
      : paymentDetails.paymentMethod;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
        }
        .header { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .content { 
          padding: 30px; 
        }
        .details { 
          background-color: #f8fafc; 
          padding: 25px; 
          border-left: 4px solid #10b981;
          border-radius: 5px;
          margin: 25px 0;
        }
        .detail-item {
          margin-bottom: 10px;
          display: flex;
        }
        .detail-label {
          font-weight: 600;
          width: 140px;
          color: #4a5568;
        }
        .detail-value {
          flex: 1;
          color: #2d3748;
        }
        .amount-box {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
        }
        .amount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .amount-value {
          font-size: 32px;
          font-weight: bold;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096; 
          font-size: 14px;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          margin-top: 25px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
        }
        .greeting {
          font-size: 18px;
          color: #2d3748;
          margin-bottom: 20px;
        }
        .security-note {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #166534;
        }
        @media (max-width: 600px) {
          .content { padding: 20px; }
          .details { padding: 15px; }
          .button { width: 100%; text-align: center; }
          .detail-item { flex-direction: column; }
          .detail-label { width: 100%; margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <div class="logo">GIA VEHICLE BOOKING</div>
          <h1>Paiement Confirmé</h1>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour ${paymentDetails.userName},<br>
            Votre paiement a été traité avec succès !
          </div>
          
          <div class="amount-box">
            <div class="amount-label">MONTANT PAYÉ</div>
            <div class="amount-value">${paymentDetails.amount.toLocaleString()} FCFA</div>
          </div>
          
          <p>Voici le récapitulatif de votre transaction :</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">📋 Détails du paiement</h3>
            
            <div class="detail-item">
              <div class="detail-label">N° de transaction :</div>
              <div class="detail-value"><strong>${paymentDetails.transactionId}</strong></div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Véhicule :</div>
              <div class="detail-value">${paymentDetails.vehicleName}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Période :</div>
              <div class="detail-value">${paymentDetails.startDate} → ${paymentDetails.endDate}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Durée :</div>
              <div class="detail-value">${paymentDetails.totalDays} jour${paymentDetails.totalDays > 1 ? "s" : ""}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Mode de paiement :</div>
              <div class="detail-value">${methodLabel}</div>
            </div>
            
            <div class="detail-item">
              <div class="detail-label">Carte :</div>
              <div class="detail-value">${paymentDetails.cardMasked}</div>
            </div>
          </div>
          
          <div class="security-note">
            🔒 <strong>Paiement sécurisé</strong><br>
            Votre transaction a été traitée de manière sécurisée. Conservez cet email comme justificatif de paiement.
          </div>
          
          <p style="margin-bottom: 25px;">
            Votre ticket de paiement est disponible dans votre espace client. Vous pouvez le télécharger et l'imprimer à tout moment.
          </p>
          
          <center>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" class="button">
              👁️ Voir mon ticket
            </a>
          </center>
          
          <div style="margin-top: 30px; font-style: italic; color: #4a5568;">
            <p>Merci de votre confiance,</p>
            <p><strong>L'équipe GIA Vehicle Booking</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>GIA Group - Douala, Cameroun</p>
          <p>Téléphone: +237 672 969 799 | Email: contact@giagroup.net</p>
          <p>© ${new Date().getFullYear()} GIA Group. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Paiement Confirmé - GIA Vehicle Booking

Bonjour ${paymentDetails.userName},

Votre paiement a été traité avec succès !

MONTANT PAYÉ : ${paymentDetails.amount.toLocaleString()} FCFA

Détails du paiement :
- N° de transaction : ${paymentDetails.transactionId}
- Véhicule : ${paymentDetails.vehicleName}
- Période : ${paymentDetails.startDate} → ${paymentDetails.endDate}
- Durée : ${paymentDetails.totalDays} jour${paymentDetails.totalDays > 1 ? "s" : ""}
- Mode de paiement : ${methodLabel}
- Carte : ${paymentDetails.cardMasked}

🔒 Paiement sécurisé
Votre transaction a été traitée de manière sécurisée. Conservez cet email comme justificatif de paiement.

Votre ticket de paiement est disponible dans votre espace client :
${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard

Merci de votre confiance,

L'équipe GIA Vehicle Booking
GIA Group - Douala, Cameroun
Téléphone: +237 672 969 799
Email: contact@giagroup.net

© ${new Date().getFullYear()} GIA Group. Tous droits réservés.
  `;

  await sendEmail({
    to: email,
    subject: `✅ Paiement confirmé - ${paymentDetails.transactionId}`,
    html,
    text,
  });

  // ── Persistance en base ──────────────────────────────────────────────────
  await createNotification({
    userId: paymentDetails.userId,
    type: "PAYMENT_CONFIRMATION",
    title: `Paiement confirmé — ${paymentDetails.vehicleName}`,
    message: `Votre paiement de ${paymentDetails.amount.toLocaleString()} FCFA a été traité avec succès. Transaction : ${paymentDetails.transactionId}`,
    metadata: {
      transactionId: paymentDetails.transactionId,
      vehicleName: paymentDetails.vehicleName,
      amount: paymentDetails.amount,
      paymentMethod: paymentDetails.paymentMethod,
    },
  });
};

// Export par défaut
export default {
  sendEmail,
  sendBookingConfirmation,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmation,
};
