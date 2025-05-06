const emailPage = (name, role, verificationLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    table {
      border-spacing: 0;
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #eaeaea;
      border-radius: 6px;
      padding: 20px;
    }
    ul {
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="container" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td>
              <h2>Welcome to <span style="color:#3498db;">Store Watch</span>, ${name}!</h2>
              <p>We're excited to have you on board. You've been added to the system with the role of <strong>${role}</strong>.</p>
              <p>Here’s what you can do next:</p>
              <ul>
                <li>Access the system using your credentials.</li>
                <li>Explore your dashboard and assigned stores.</li>
                <li>Reach out to your coordinator if you have questions.</li>
              </ul>
              <p>Best regards,<br><strong>The Praetorian Team</strong></p>

              <!-- Button using table for better compatibility -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td bgcolor="#3498db" style="border-radius: 4px;">
                    <a href="${verificationLink}" 
                       target="_blank"
                       style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                       Click Me
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <p style="font-size: 12px; color: #888; border-top: 1px solid #eaeaea; padding-top: 10px; margin-top: 30px;">
                This is an automated email. Please do not reply directly to this message.
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { emailPage };
