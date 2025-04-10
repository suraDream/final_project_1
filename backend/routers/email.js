const express = require('express');
const { Resend } = require('resend');  // ต้อง destructure `Resend` จาก `resend`
const pool = require('../db');
const router = express();

// Initializing Resend with your API key (ต้องใช้ฟังก์ชัน)
const resend = new Resend('re_X4Jmcahy_GsewrF1fnnmVeJZuojqiBwwU');

// Endpoint สำหรับส่งอีเมล
router.post('/send-email', async (req, res) => {
  const { email, subject, message } = req.body;

  try {
    // ส่งอีเมลโดยใช้ฟังก์ชันส่งของ Resend
    const result = await resend.emails.send({
        from: 'onboarding@resend.dev', // อีเมลทดสอบจาก Resend ที่ส่งได้แน่นอน
        to: email,
        subject:subject,
        text:message,
      });
      

    res.status(200).json({ success: true, message: 'Email sent successfully', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send email', error });
  }
});

// อย่าลืมกำหนดตัวแปร `port`


module.exports = router;
