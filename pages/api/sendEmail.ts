import { NextApiRequest, NextApiResponse } from "next";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Prepare the email content
  const emailBody = `
    <h3>Thank you for contacting us, ${name}!</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong> ${message}</p>
    <p>We will get back to you shortly.</p>
  `;

  // Set up the SES parameters
  const params = {
    Source: process.env.AWS_SES_EMAIL, // Verified sender email
    Destination: {
      ToAddresses: [email], // Send to the submitter's email
    },
    Message: {
      Subject: {
        Data: `Thank you for your submission, ${name}`,
      },
      Body: {
        Html: {
          Data: emailBody,
        },
        Text: {
          Data: `Thank you for contacting us, ${name}.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\n\nWe will get back to you shortly.`,
        },
      },
    },
  };

  try {
    // Send the email using AWS SES
    await ses.send(new SendEmailCommand(params));
    res.status(200).json({ success: "Email sent successfully!" });
  } catch (error) {
    console.error("AWS SES Error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
}
