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
            <h2>Welcome to <span class="highlight">Store Watch Application</span>, ${name}!</h2>
            <p>We're excited to have you on board. You've been added to the system with the role of <strong>${role}</strong>.</p>
            <div class="button-container">
              <a href="${verificationLink}" class="button">Verify Email</a>
            </div>
            <p>Here’s what you can do next:</p>
            <ul>
              <li>Access the system using your credentials.</li>
              <li>Explore your dashboard and assigned stores.</li>
              <li>Reach out to your coordinator if you have questions.</li>
            </ul>
            <p>Best regards,<br><strong>The Praetorian Team</strong></p>
            <footer>
              This is an automated email. Please do not reply directly to this message.
            </footer>

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
