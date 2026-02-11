import nodemailer from "nodemailer";

/**
 * EMAIL SERVICE CONFIGURATION
 * Powered by Nodemailer. Uses Gmail's SMTP service.
 * Note: For production, consider specialized services like SendGrid, Mailgun or AWS SES.
 */
const transporter = nodemailer.createTransport({
  service: "gmail", // Utilise le service Gmail prédéfini
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Allows local development with self-signed certificates
    rejectUnauthorized: false,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * CORE EMAIL SENDER
 * A robust wrapper for sending emails with comprehensive error handling.
 * It features a "Simulated Mode" if environment variables are missing.
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // 1. Configuration Validation
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER or EMAIL_PASS missing. Falling back to Log Simulation.');
      console.log(`[SIMULATED] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    const mailOptions = {
      from: `"GIA Vehicle Booking" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    // Pour Gmail, afficher le lien de prévisualisation en dev
    if (process.env.NODE_ENV !== "production") {
      console.log(`📎 Preview: https://mail.google.com/mail/u/0/#inbox`);
    }
  } catch (error: any) {
    /**
     * ERROR HANDLING STRATEGY
     * We categorize errors (Auth, Network, Payload) to provide meaningful logs 
     * without crashing the main thread.
     */

    if (error.code === 'EAUTH') {
      console.error('🔐 AUTHENTICATION ERROR: Verify App Passwords and 2FA settings.');
    } else if (error.code === 'ESOCKET') {
      console.error('🔌 CONNECTION ERROR: SMTP server unreachable.');
    }

    // NON-BLOCKING: We warn the system but don't throw, 
    // ensuring the user's booking/registration process can still complete.
    console.warn(`⚠️ Process continued despite email failure to ${options.to}`);
  }
};


/**
 * ONBOARDING: Welcome Email
 * Greets new users and introduces platform features.
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
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
          background: linear-gradient(135deg, #0A1F44 0%, #1e3a8a 100%); 
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
          border-left: 4px solid #00B4D8;
        }
        .feature-icon {
          font-size: 20px;
          margin-right: 15px;
          color: #00B4D8;
        }
        .button { 
          display: inline-block; 
          padding: 16px 36px; 
          background: linear-gradient(135deg, #00B4D8 0%, #0096c7 100%); 
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
          color: #0A1F44;
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
            <p style="font-weight: 600; color: #0A1F44; margin-bottom: 15px;">Ce que vous pouvez faire :</p>
            
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
};

/**
 * SECURITY: Password Reset
 * High-priority email containing sensitive recovery links.
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string,
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
          background-color: #0A1F44; 
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
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
