// netlify/functions/notify.js
const { Resend } = require('resend');
const Airtable = require('airtable'); // Import the Airtable library

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email address' }) };
    }

    // --- Step 1: Save the email to Airtable ---
    // Note: 'Waitlist' must match the name of your table in Airtable.
    // 'Email' must match the name of your column.
    await base('Waitlist').create([{ fields: { Email: email } }]);
    console.log(`Successfully saved ${email} to Airtable.`);

    // --- Step 2: Send the confirmation email with Resend ---
    await resend.emails.send({
      from: 'Wimbli <noreply@wimbli.app>', // Your verified domain
      to: email,
      subject: "You're on the Wimbli waitlist 🎉",
      html: `<p>Hey there! Thanks for signing up for early access to <strong>Wimbli</strong>. We’ll let you know as soon as it launches 🚀</p>`,
    });
    console.log(`Successfully sent confirmation email to ${email}.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Successfully signed up!' }),
    };

  } catch (error) {
    console.error('The function ran into an error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong.' }),
    };
  }
};