import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Vercel environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to_email, to_name, subject, message } = req.body;

    if (!to_email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await resend.emails.send({
      from: 'OurMess <siyam@siyamm.pro.bd>',
      to: [to_email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">OurMess Notification</h2>
          <p><strong>Hi ${to_name || 'Member'},</strong></p>
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <p style="font-size: 0.9em; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            This is an automated message from the OurMess System.<br/>
            If you have any queries or questions, please mail to <a href="mailto:siyam.diucse@gmail.com" style="color: #2563eb; text-decoration: none;">siyam.diucse@gmail.com</a>.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
