import nodemailer from "nodemailer";

export async function sendContactEmail({
  to,
  name,
  email,
  message,
  ip,
  location,
}: {
  to: string;
  name: string;
  email: string;
  message: string;
  ip?: string;
  location?: string;
}) {
  if (!to) {
    console.warn("[mail] No admin contact email configured. Skipping email send.");
    return;
  }

  // Load SMTP config from env, fallback to sandbox Ethereal or logging
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || user || "w3converter@yoursite.com";

  if (!host || !user || !pass) {
    console.log("-----------------------------------------");
    console.log(`[SMTP Mail Mocked] Host/User/Pass not set in env.`);
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: New Contact Message from ${name}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`IP: ${ip || "Unknown"}`);
    console.log(`Location: ${location || "Unknown"}`);
    console.log(`Message:\n${message}`);
    console.log("-----------------------------------------");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to,
    subject: `[w3converter] New Message from ${name}`,
    text: `You have received a new contact message:

Name: ${name}
Email: ${email}
IP Address: ${ip || "Unknown"}
Location: ${location || "Unknown"}

Message:
-----------------------------------------
${message}
-----------------------------------------
    `,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">New Contact Message</h2>
        <p style="color: #64748b; font-size: 14px;">A visitor submitted a message via your contact form.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 100px; color: #475569;">Name:</td>
            <td style="padding: 6px 0; color: #0f172a;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">IP Address:</td>
            <td style="padding: 6px 0; color: #0f172a;">${ip || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #475569;">Location:</td>
            <td style="padding: 6px 0; color: #0f172a;">${location || "Unknown"}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; color: #334155; line-height: 1.6; font-style: italic; white-space: pre-line;">
          ${message}
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Sent automatically by w3converter system.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
