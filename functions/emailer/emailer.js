const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key';

const transporter = nodemailer.createTransport({
  host: 'mail.praetorianintel.com', 
  port: 465,
  secure: true,
  auth: {
    user: "info@praetorianintel.com",
    pass: "JYwbR)FRZntt",
  },
  logger: true,
  debug: true,
});

const generateVerificationToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' }); 
};

const sendWelcomeEmail = async (to, name, role, id) => {
  const verificationToken = generateVerificationToken(id);
  const verificationLink = `https://app-m4gsgw27rq-uc.a.run.app/verify?token=${verificationToken}`;

  const mailOptions = {
    from: `"Praetorian" <info@praetorianintel.com>`,
    to,
    subject: 'Welcome to Store Watch',
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f8f8f8;
              margin: 0;
              padding: 0;
            }

            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 32px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }

            .logo {
              text-align: center;
              margin-bottom: 20px;
            }

            .logo img {
              max-width: 100px;
            }

            .title {
              color: #E93204;
              text-align: center;
              font-size: 24px;
              margin: 10px 0;
            }

            .verifyTitle {
              color: #333333;
              font-size: 18px;
              text-align: center;
              margin-top: 30px;
              font-weight: bold;
            }

            .content {
              margin-top: 20px;
              font-size: 16px;
              color: #333333;
            }

            .button-container {
              text-align: center;
              margin: 32px 0;
            }

            .verify-button {
              background-color: #E93204;
              color: white;
              padding: 12px 32px;
              border: none;
              border-radius: 48px;
              font-weight: bold;
              font-size: 16px;
              text-decoration: none;
              display: inline-block;
            }

            .footer {
              font-size: 12px;
              color: #666666;
              text-align: center;
              margin-top: 32px;
              border-top: 1px solid #ccc;
              padding-top: 16px;
            }
            .footer p{
                margin: 2px;
            }
            .endContent p{
                margin: 3px;
            }
            .endContent .thanks{
                margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="./assets/logo.png" alt="StoreWatch Logo" />
              <div class="title">StoreWatch</div>
            </div>

            <div class="verifyTitle">Verify Your Email</div>

            <div class="content">
              <p>Hi <strong>${name}</strong>,</p>
              <p>
                Your account has been created in Store Watch with a role of ${role}.
              </p>
            </div>

            <div class="button-container">
              <a href=${verificationLink} class="verify-button">Verify Email</a>
            </div>

            <div class="endContent">
              <p>If you didn’t expect this email, feel free to ignore it.</p>
              <p class="thanks">Thanks,</p>
              <p>The StoreWatch Team</p>
            </div>

            <div class="footer">
              <p>© 2025 StoreWatch</p>
              <p>A product of Praetorian Intelligence Incorporated</p>
              <p>Subscribed by: Wellmade Manufacturing Corporation</p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // Send the email
  return transporter.sendMail(mailOptions);
};

const successVerify = async(to, name) => {
    const mailOptions = {
      from: `"Praetorian" <info@praetorianintel.com>`,
      to,
      subject: 'Welcome to Store Watch',
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: auto;
              border: 1px solid #eaeaea;
              border-radius: 6px;
              padding: 20px;
              background: #ffffff;
            }
            h2 {
              color: #2c3e50;
            }
            .highlight {
              color: #3498db;
            }
            ul {
              padding-left: 20px;
            }
            footer {
              margin-top: 30px;
              font-size: 12px;
              color: #888;
              border-top: 1px solid #eaeaea;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Successfully Verify Welcome to <span class="highlight">Store Watch Application</span>, ${name}!</h2>
            <p>Best regards,<br><strong>The Praetorian Team</strong></p>
            <footer>
              This is an automated email. Please do not reply directly to this message.
            </footer>
          </div>
        </body>
      </html>
      `,
    };
    return transporter.sendMail(mailOptions);
}

const sendVerificationCode = async(to, code) => {
  const mailOptions = {
    from: `"Praetorian" <info@praetorianintel.com>`,
    to,
    subject: 'Verification Code',
    html: `
    <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: auto;
              border: 1px solid #eaeaea;
              border-radius: 6px;
              padding: 20px;
              background: #ffffff;
            }
            h2 {
              color: #2c3e50;
            }
            .highlight {
              color: #3498db;
            }
            ul {
              padding-left: 20px;
            }
            footer {
              margin-top: 30px;
              font-size: 12px;
              color: #888;
              border-top: 1px solid #eaeaea;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Successfully Verify Welcome to <span class="highlight">Store Watch Application</span>, ${code}!</h2>
            <p>Best regards,<br><strong>The Praetorian Team</strong></p>
            <footer>
              This is an automated email. Please do not reply directly to this message.
            </footer>
          </div>
        </body>
      </html>
    `,
    
  }
  return transporter.sendMail(mailOptions);

}

module.exports = { sendWelcomeEmail, successVerify, sendVerificationCode };
