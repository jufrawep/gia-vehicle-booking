import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware';
import { sendEmail } from '../services/email.service';

/**
 * VALIDATION SCHEMA
 * Ensures the input is strictly a valid email format before processing.
 */
const newsletterSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * SUBSCRIBE NEWSLETTER
 * Handles the opt-in process for marketing communications.
 * * Current Logic:
 * 1. Validates email syntax.
 * 2. Sends an immediate confirmation email via Nodemailer.
 * * @todo Implement database persistence (e.g., 'Subscriber' table) to manage opt-outs and duplicate checks.
 */
export const subscribeNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    // Input Validation
    const { email } = newsletterSchema.parse(req.body);

    // TODO: DB Check
    // Future implementation: Check if email exists in 'Newsletter' or 'User' table.
    // if (exists) return res.status(409).json({ message: 'Already subscribed' });

    // Send Confirmation Email (Transactional)
    await sendEmail({
      to: email,
      subject: 'Bienvenue à notre Newsletter - GIA Vehicle Booking',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0A1F44; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 5px; }
            .footer { font-size: 12px; color: #777; margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue à notre Newsletter !</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Merci de vous être inscrit à la newsletter de GIA Vehicle Booking !</p>
              <p>Vous recevrez désormais nos dernières offres, nouveautés et actualités directement dans votre boîte mail.</p>
              <br/>
              <p>À très bientôt,</p>
              <p><strong>L'équipe GIA Vehicle Booking</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GIA Vehicle Booking. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Subscription successful. Confirmation email sent.'
    });
  }
);