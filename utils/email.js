import nodemailer from 'nodemailer';

const sendMailTo = async ({ email, subject, message }) => {
    try {
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
      });
  
      const mailOptions = {
        from: 'Second Story <noreply@yourcompany.com>',
        to: email,
        subject,
        text: message
      };
  
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };
  
  export default sendMailTo;
  
