export interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
}

export const sendEmailNotification = async (params: EmailParams) => {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send email');
    }

    console.log('Email sent successfully via Resend API');
    return data;
  } catch (error) {
    console.error('Email Delivery Error:', error);
    throw error;
  }
};
