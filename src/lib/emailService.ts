import emailjs from '@emailjs/browser';

// These should be configured in your .env file
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
}

export const sendEmailNotification = async (params: EmailParams) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS credentials are not configured. Emails will not be sent.');
    return;
  }

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        message: params.message,
      },
      PUBLIC_KEY
    );
    console.log('Email sent successfully', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send email', error);
    throw error;
  }
};
