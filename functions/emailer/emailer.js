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
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Box Example</title>
        <style>
          * {
            font-family: sans-serif;
          }
          body {
            background-color: #dedede;
            margin: 0;
            min-height: 100vh;
          }
          .container {
            max-width: 600px;
            width: 100%;
            text-align: center;
            overflow: hidden;
          }
          .box {
            background-color: #fefefe;
            border: 1px solid #cecece;
            width: 100%;
            overflow-wrap: break-word;
            word-wrap: break-word;
            white-space: normal;
            box-sizing: border-box;
          }
          .logo {
            margin: 40px 0 20px;
            text-align: start;
          }
          .logo img {
            width: 200px;
            height: 50px;
          }
          .banner {
            background-color: orange;
            width: 100%;
            height: 130px;
          }
          .content {
            padding: 40px;
            text-align: start;
          }
          .content .message {
            margin-top: 20px;
          }
          .content .information {
            margin-top: 40px;
          }
          .feature-container {
            margin-top: 20px;
          }
          .features {
            margin-top: 20px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px;
          }
          .hr1{
            margin-top: 40px;
          }
          .hr2{
            margin-top: 40px;
          }
          .subscription{
            margin-top: 40px;
            text-align: center;
          }
          .subscription p{
            color: #888888;
            font-size: 14px;
          }
          hr {
            border: none;
            height: 2px;            
            background-color: #F0F0F0;  
          }
          .logos{
            margin-top: 80px;
            text-align: center;
          }
          .logos .img{
            margin-right: 40px;
          }
          .footer {
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
            background-color: #f0f0f0;
            width: 100%;
            box-sizing: border-box;
          }
          .footer a {
            color: #0077cc;
            text-decoration: none;
            margin: 0 5px;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .middleButton{
            margin-top: 40px;
            text-align: center;
          }
          .features h3 {
            color: #333;
            margin-bottom: 10px;
          }
          .features ul {
            padding-left: 20px;
            margin: 0;
          }
          .features li {
            margin-bottom: 10px;
            line-height: 1.5;
          }
          .features li strong {
            display: inline-block;
            margin-bottom: 3px;
            color: #000;
          }
          @media screen and (max-width: 600px) {
            .content {
              padding: 20px 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://praetorianintel.com/public/images/pages/logo.png" alt="Logo" />
          </div>
          <img src="./banner.png" alt="">
          <div class="box">
            <div class="content">
              <div class="message">
                <p>Hi <strong>${name},</strong></p>
                <p>
                  An account has been created for you with a role of ${role}. Please verify your email address by clicking the button below.
                </p>
                <div class="middleButton">
                    <a href="${verificationLink}"
                      style="
                        background-color: #E93204;
                        color: #ffffff;
                        padding: 12px 30px;
                        width: 200px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                      ">
                      Verify Email
                    </a>
                </div>
              </div>
              <hr class="hr1">
              <div class="information">
                <h2>Verify your account to access these features:</h2>
              </div>
              <div class="feature-container">
                  <div class="features">
                      <ul>
                          <li>
                              <strong>Add Store:</strong> Expand your operations by integrating new retail locations into your monitoring system.
                          </li>
                          <li>
                              <strong>Add User:</strong> Strengthen team collaboration by giving access to additional team members.
                          </li>
                          <li>
                              <strong>Add Product:</strong> Maintain control and adaptability by managing user permissions and profiles as your team evolves.
                          </li>
                      </ul>
                  </div>
                  <div class="middleButton">
                    <a href="${verificationLink}"
                      style="
                        background-color: #E93204;
                        color: #ffffff;
                        padding: 12px 30px;
                        width: 200px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                      ">
                      Learn More
                    </a>
                </div>
              </div>
              <hr class="hr2">
              <div class="subscription">
                  <p>
                      Manage your subscription and view insights on how premium features like advanced scheduling, store analytics, and enhanced reporting are helping optimize your operations from your account page.
                  </p>
              </div>
              <div class="logos">
                  <a href="https://www.facebook.com/praetorianintelligence/" target="_blank" rel="noopener noreferrer">
                      <img class="img" src="./facebook.png" alt="Facebook">
                  </a>
              </div>
            </div>
          </div>
          <footer class="footer">
            <p>&copy; 2025 Praetorian Intelligence. All rights reserved.</p>
            <p>
                <a href="#">Privacy Policy</a> | 
                <a href="#">Terms of Service</a> | 
                <a href="#">Contact Us</a>
            </p>
          </footer>
        </div>
      </body>
      </html>

    `
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
              <img src="https://praetorianintel.com/public/images/pages/logo.png" alt="StoreWatch Logo" />
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
