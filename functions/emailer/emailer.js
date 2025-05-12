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
    from: `"StoreWatch" <info@praetorianintel.com>`,
    to,
    subject: 'Verify Your Email - StoreWatch',
    html: `
      <html>
        <head>
          <style>
            body {
              background-color: #f4f4f5;
              font-family: Arial, sans-serif;
              padding: 40px 0;
              margin: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 6px;
              padding: 32px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
              border: 1px solid #eaeaea;
            }
            .logo {
              margin-bottom: 20px;
              text-align: center;
            }
            .logo img {
              width: 200px;
              height: 50px;
            }
            h1 {
              color: #E93204;
              font-size: 24px;
              margin-bottom: 10px;
              text-align: center;
            }
            h2 {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
              text-align: center;
            }
            p {
              font-size: 14px;
              line-height: 1.6;
              color: #333;
            }
            .footer {
              font-size: 11px;
              color: #888;
              margin-top: 30px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://praetorianintel.com/public/images/pages/alt-logo.png" alt="StoreWatch Logo" />
            </div>
            <h1>StoreWatch</h1>
            <h2>Verify Your Email</h2>
            <p>Hi <strong>${name}</strong>,<br><br>
            An account has been created for you via StoreWatch. To activate it and set up your password, please verify your email address by clicking the button below:</p>

            <!-- INLINE STYLE BUTTON FOR GMAIL COMPATIBILITY -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}"
                style="
                  background-color: #E93204;
                  color: #ffffff;
                  padding: 12px 30px;
                  border-radius: 24px;
                  text-decoration: none;
                  font-weight: bold;
                  font-size: 14px;
                  display: inline-block;
                ">
                Verify Email
              </a>
            </div>

            <p>If you didn’t expect this email, feel free to ignore it.</p>
            <p>Thanks,<br>The StoreWatch Team</p>
            <div class="footer">
              © 2025 StoreWatch<br>
              A product of Praetorian Intelligence Incorporated<br>
              Subscribed by: Wellmade Manufacturing Corporation<br>
              All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

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
              background-color: #f4f4f5;
              font-family: Arial, sans-serif;
              padding: 40px 0;
              margin: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 6px;
              padding: 32px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
              border: 1px solid #eaeaea;
            }
            .logo {
              margin-bottom: 20px;
              text-align: center;
            }
            .logo img {
              width: 200px;
              height: 50px;
            }
            h1 {
              color: #E93204;
              font-size: 24px;
              margin-bottom: 10px;
              text-align: center;
            }
            h2 {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
              text-align: center;
            }
            p {
              font-size: 14px;
              line-height: 1.6;
              color: #333;
            }
            .footer {
              font-size: 11px;
              color: #888;
              margin-top: 30px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://praetorianintel.com/public/images/pages/alt-logo.png" alt="StoreWatch Logo" />
            </div>
            <h1>StoreWatch</h1>
            <h2>Your StoreWatch Account is Ready</h2>
            <p>Hi <strong>${name}</strong>,<br><br>
            Welcome to StoreWatch! Your account has been successfully created. You can now log in and start managing your tasks, submissions, and schedules with ease.</p>

            <p>If you didn’t expect this email, feel free to ignore it.</p>
            <p>Thanks,<br>The StoreWatch Team</p>
            <div class="footer">
              © 2025 StoreWatch<br>
              A product of Praetorian Intelligence Incorporated<br>
              Subscribed by: Wellmade Manufacturing Corporation<br>
              All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
    };
    return transporter.sendMail(mailOptions);
}

const sendVerificationCode = async(to, code, name) => {
  const mailOptions = {
    from: `"Praetorian" <info@praetorianintel.com>`,
    to,
    subject: 'Reset Password',
    html: `
      <html>
        <head>
          <style>
            body {
              background-color: #f4f4f5;
              font-family: Arial, sans-serif;
              padding: 40px 0;
              margin: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 6px;
              padding: 32px;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
              border: 1px solid #eaeaea;
            }
            .logo {
              margin-bottom: 20px;
              text-align: center;
            }
            .logo img {
              width: 200px;
              height: 50px;
            }
            h1 {
              color: #E93204;
              font-size: 24px;
              margin-bottom: 10px;
              text-align: center;
            }
            h2 {
              font-size: 18px;
              margin-bottom: 20px;
              color: #333;
              text-align: center;
            }
            p {
              font-size: 14px;
              line-height: 1.6;
              color: #333;
            }
            .footer {
              font-size: 11px;
              color: #888;
              margin-top: 30px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            .codes{
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://praetorianintel.com/public/images/pages/alt-logo.png" alt="StoreWatch Logo" />
            </div>
            <h1>StoreWatch</h1>
            <h2>Reset Password</h2>
            <p>Hi <strong>${name}</strong>,<br><br>
            We received a request to reset your StoreWatch account password. Please use the one-time password (OTP) below to proceed.</p>

            <p><strong class="codes">${code}</strong>,<br>(This code is valid for the next 3 minutes.)</p>

            <p>If you didn’t expect this email, feel free to ignore it.</p>
            <p>Thanks,<br>The StoreWatch Team</p>
            <div class="footer">
              © 2025 StoreWatch<br>
              A product of Praetorian Intelligence Incorporated<br>
              Subscribed by: Wellmade Manufacturing Corporation<br>
              All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  }
  return transporter.sendMail(mailOptions);

}

module.exports = { sendWelcomeEmail, successVerify, sendVerificationCode };
