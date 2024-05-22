import nodemailer from 'nodemailer';

const sendMail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
    //   host: process.env.EMAIL_HOST,
    //   port: process.env.EMAIL_PORT,
    //   secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'Your Company <noreply@yourcompany.com>',
      to: email,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default sendMail;
