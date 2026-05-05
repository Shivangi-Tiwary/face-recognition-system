const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  },
  tls: { rejectUnauthorized: false }
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ Transporter verify failed:", err.message);
    console.error("❌ Full error:", JSON.stringify(err));
  } else {
    console.log("✅ Transporter ready");
  }
});

exports.sendOtp = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: '"Auth Service" <your@brevo-verified-email.com>',
      to,
      subject: "Your Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="margin-bottom:8px">Verification Code</h2>
          <p style="color:#555">Use the code below to complete your login. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:12px;margin:24px 0;color:#111">${otp}</div>
          <p style="color:#999;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}: ${err.message}`);
    console.log(`🔑 [FALLBACK] OTP for ${to}: ${otp}`);
  }
};