// netlify/functions/contact.js
const { Resend } = require('resend');
const Airtable = require('airtable');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Your email address where you want to receive contact form submissions
const a_to_email = 'wimbliapp@gmail.com'; 

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    if (!name || !email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required.' }) };
    }

    // --- Step 1: Save the submission to a new 'Contacts' table in Airtable ---
    await base('Contacts').create([{ fields: { Name: name, Email: email, Message: message } }]);
    console.log('Contact form submission saved to Airtable.');

    // --- Step 2: Send you a notification email ---
    await resend.emails.send({
      from: 'Wimbli Contact Form <hello@wimbli.app>', // Must be from your verified domain
      to: a_to_email, // Sends the email to you
      subject: `New Wimbli Contact Form Submission from ${name}`,
      reply_to: email, // This is a pro-tip! When you hit "Reply" in Gmail, it will reply to the user.
      html: `
        <p>You have a new contact form submission:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <hr>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });
    console.log(`Contact form email sent to ${a_to_email}.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message sent successfully!' }),
    };

  } catch (error) {
    console.error('The function ran into an error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong.' }),
    };
  }
};