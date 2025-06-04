
module.exports = function(io){
const express = require("express");
const pool = require("../db");
require("dotenv").config();
const router = express.Router();
const { Resend } = require("resend");
const resend = new Resend(process.env.Resend_API);
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { error } = require("console");
const cron = require("node-cron");
const authMiddleware = require("../middlewares/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    let uploadDir = "";
    if (file.fieldname === "deposit_slip") {
      uploadDir = "uploads/images/slip/"; // กำหนดโฟลเดอร์สำหรับไฟล์ deposit_slip
    }
     else if (file.fieldname === "total_slip") {
      uploadDir = "uploads/images/slip/"; // โฟลเดอร์สำหรับรูปภาพ
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // สร้างโฟลเดอร์หากไม่มี
    }
    cd(null, uploadDir); // กำหนดโฟลเดอร์ปลายทาง
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname)); // กำหนดชื่อไฟล์ด้วย timestamp
  },
});

const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024,
  },
});


cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(" CRON WORKING", now.toISOString());

  try {
    const result = await pool.query(
      `
      SELECT b.*, u.email, f.field_name
      FROM bookings b
      JOIN users u ON u.user_id = b.user_id
      JOIN field f ON f.field_id = b.field_id
      WHERE b.status = 'pending' AND b.start_date = $1
    `,
      [todayStr]
    );

    console.log(` พบการจองทั้งหมด ${result.rows.length} รายการ`);

    for (const booking of result.rows) {
      try {
        const rawTime = booking.start_time;
        const datetimeStr = `${todayStr}T${rawTime}+07:00`;

        const startTime = new Date(datetimeStr);
        const nowTime = new Date(
          `${todayStr}T${now.toTimeString().split(" ")[0]}+07:00`
        );

        const diffMinutes = (startTime - nowTime) / (1000 * 60);

        console.log(` ตรวจ booking: ${booking.booking_id}`);
        console.log(` startTime: ${startTime.toISOString()}`);
        console.log(` nowTime:   ${nowTime.toISOString()}`);
        console.log(` diff:      ${diffMinutes.toFixed(2)} นาที`);

        if (diffMinutes >= 29 && diffMinutes <= 31) {
          await resend.emails.send({
            from: process.env.Sender_Email,
            to: booking.email,
            subject: "ใกล้ถึงเวลาจองสนามแล้ว!",
            html: `
              <p>คุณมีการจองสนาม <strong>${booking.field_name}</strong></p>
              <p>เริ่มเวลา <strong>${booking.start_time}</strong> วันที่ <strong>${todayStr}</strong></p>
              <p>กรุณามาให้ตรงเวลา</p>
            `,
          });

          console.log(` แจ้งเตือนล่วงหน้าแล้ว: ${booking.email}`);
        } else if (diffMinutes === 0) {
          await resend.emails.send({
            from: process.env.Sender_Email,
            to: booking.email,
            subject: "ถึงเวลาจองสนามแล้ว!",
            html: `
              <p>คุณมีการจองสนาม <strong>${booking.field_name}</strong></p>
              <p>เริ่มเวลา <strong>${booking.start_time}</strong> วันที่ <strong>${booking.start_date}</strong></p>
              <p>กรุณารีบมา</p>
            `,
          });

          console.log(` แจ้งเตือนเริ่มเตะ: ${booking.email}`);
        } else {
          console.log(` ยังไม่ถึงเวลาแจ้งเตือน (${diffMinutes.toFixed(2)} นาที)`);
        }
      } catch (error) {
        console.warn(` ข้าม booking ${booking.booking_id} เพราะ error:`, error.message);
      }
    }

const expired = await pool.query(`
DELETE FROM bookings b
USING users u, field f
WHERE b.user_id = u.user_id
  AND b.field_id = f.field_id
  AND b.status = 'approved'
  AND f.price_deposit > 0
  AND b.booking_id NOT IN (SELECT booking_id FROM payment)
  AND (
    NOW() > b.updated_at + INTERVAL '5 minutes'
    OR (
      b.updated_at > (b.start_date || ' ' || b.start_time)::timestamp - INTERVAL '5 minutes'
      AND NOW() >= (b.start_date || ' ' || b.start_time)::timestamp
    )
  )
RETURNING b.booking_id, u.email, f.field_name, b.start_time, b.start_date;

`);



    if (expired.rows.length > 0) {
      for (const row of expired.rows) {
        await resend.emails.send({
          from: process.env.Sender_Email,
          to: row.email,
          subject: "การจองสนามของคุณถูกยกเลิกอัตโนมัติ",
          html: `
            <p>ระบบได้ยกเลิกการจองสนาม <strong>${row.field_name}</strong></p>
            <p>เวลา: <strong>${row.start_time}</strong> วันที่ <strong>${row.start_date}</strong></p>
            <p>เพราะไม่ได้แนบสลิปภายในเวลาที่กำหนด</p>
          `,
        });
        console.log(` ส่งแจ้งเตือนการลบไปยัง ${row.email}`);
              if (io) {
    io.emit("slot_booked", {
      bookingId: row.booking_id,
    });
  }
       }


      console.log(` ลบ booking หมดอายุทั้งหมด ${expired.rows.length} รายการ`);
    } else {
      console.log(" ไม่มี booking ที่ต้องลบ");
    }

  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาดใน CRON:", err.message);
  }
});

router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "deposit_slip" }]),
  async (req, res) => {
    let depositSlip = null;
    const client = await pool.connect();

    try {
      const {
        fieldId,
        userId,
        subFieldId,
        bookingDate,
        startTime,
        startDate,
        endTime,
        endDate,
        totalHours,
        totalPrice,
        selectedSlots,
        payMethod,
        totalRemaining,
        activity,
        selectedFacilities,
        status,
      } = JSON.parse(req.body.data);

     
      if (req.files["deposit_slip"]?.length > 0) {
        depositSlip = req.files["deposit_slip"][0].path;
      }

      
      if (
        !fieldId ||
        !userId ||
        !subFieldId ||
        !bookingDate ||
        !startTime ||
        !endTime ||
        !totalHours ||
        !totalPrice ||
        !payMethod ||
        !selectedSlots ||
        totalRemaining === undefined ||
        !activity
      ) {
        if (depositSlip && fs.existsSync(depositSlip))
          fs.unlinkSync(depositSlip);
        return res
          .status(400)
          .json({ success: false, message: "กรุณาเลือกข้อมูลให้ครบ" });
      }

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid startDate or endDate" });
      }

      await client.query("BEGIN");
      const overlapResult = await client.query(
        `SELECT * FROM bookings
          WHERE sub_field_id = $1
            AND status NOT IN ('rejected')
            AND (
              (start_date || ' ' || start_time)::timestamp < $3::timestamp
              AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
            )`,
        [subFieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
      );

      if (overlapResult.rows.length > 0) {
        if (depositSlip && fs.existsSync(depositSlip)) {
          fs.unlinkSync(depositSlip); // ลบไฟล์ที่ upload แล้ว
        }
        return res.status(400).json({
          success: false,
          message: "ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกเวลาใหม่",
        });
      }

      // Insert bookings
      const bookingResult = await client.query(
        `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status, start_date, end_date, selected_slots)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING booking_id`,
        [
          fieldId,
          userId,
          subFieldId,
          bookingDate,
          startTime,
          endTime,
          totalHours,
          totalPrice,
          payMethod,
          totalRemaining,
          activity,
          status,
          startDate,
          endDate,
          selectedSlots,
        ]
      );

      const bookingId = bookingResult.rows[0].booking_id;

      // insert facility
      for (const facility of selectedFacilities) {
        await client.query(
          `INSERT INTO booking_fac (booking_id, field_fac_id, fac_name) 
         VALUES ($1, $2, $3) `,
          [bookingId, facility.field_fac_id, facility.fac_name]
        );
      }

      // เชื่อมต่อกับ payment
      if (depositSlip) {
        const paymentResult = await client.query(
          `INSERT INTO payment (booking_id, deposit_slip) VALUES ($1, $2) RETURNING payment_id`,
          [bookingId, depositSlip]
        );
      }

      await client.query("COMMIT");
      console.log(" emitting slot_booked", bookingId);
      if (req.io) {
        req.io.emit("slot_booked", {
          bookingId,
        });
      }

      console.log("Booking saved successfully");
      res
        .status(200)
        .json({ success: true, message: "Booking saved successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      if (depositSlip && fs.existsSync(depositSlip)) {
        fs.unlinkSync(depositSlip);
      }
      console.error("Error saving booking:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Unexpected error" });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/booked-block/:subFieldId/:startDate/:endDate",
  authMiddleware,
  async (req, res) => {
    const { subFieldId, startDate, endDate } = req.params;

    try {
      const client = await pool.connect();
      const result = await client.query(
        `SELECT *
       FROM bookings
       where booking_date = $2   and sub_field_id = $1 
         AND status IN ('pending', 'approved')
      `,
        [subFieldId, startDate]
      );

      client.release();

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Error fetching booked range:", error);
      res.status(500).json({ success: false, error: "Database error" });
    }
  }
);

router.get("/my-bookings/:user_id", authMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { date, status } = req.query;

  let query = `
    SELECT 
      b.booking_id,
      b.user_id,
      b.field_id,
      u.first_name,
      u.last_name,
      u.email,
      f.field_name,
      f.gps_location,
      f.price_deposit,
      f.cancel_hours,
      b.sub_field_id,
      sf.sub_field_name,
      sf.price,
      b.booking_date,
      b.start_date,
      b.start_time,
      b.end_date,
      b.end_time,
      b.total_hours,
      b.total_price,
      b.total_remaining,
      b.pay_method,
      b.status,
      b.activity,
      b.selected_slots,
      bf.fac_name AS facility_name,
      bf.field_fac_id
    FROM bookings b
    LEFT JOIN field f ON b.field_id = f.field_id
    LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
    LEFT JOIN booking_fac bf ON bf.booking_id = b.booking_id
    INNER JOIN users u ON u.user_id = b.user_id
    WHERE b.user_id = $1
  `;

  let values = [user_id];
  let i = 2;

  if (date) {
    query += ` AND b.start_date = $${i}`;
    values.push(date);
    i++;
  }

  if (status) {
    query += ` AND b.status = $${i}`;
    values.push(status);
    i++;
  }

  query += ` ORDER BY b.booking_date DESC`;

  try {
    const result = await pool.query(query, values);
               if (req.io) {
    req.io.emit("slot_booked", {
      bookingId: result.rows.booking_id,
    });
  }

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      error: "Not Found Your booking",
    });
  }
});

router.get("/my-orders/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const { date, status } = req.query;
  const user_id = req.user.user_id;
  const user_role = req.user.role; // เช่น 'user', 'admin'

  try {
    // 1. ถ้าไม่ใช่ admin → ตรวจสอบว่า user นี้เป็นเจ้าของสนาม
    if (user_role !== "admin") {
      const fieldCheck = await pool.query(
        `SELECT user_id FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldCheck.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Field not found" });
      }

      const fieldOwnerId = fieldCheck.rows[0].user_id;

      if (fieldOwnerId !== user_id) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
    }

   
    let query = `
      SELECT 
        b.booking_id, b.user_id, b.field_id,
        u.first_name, u.last_name, u.email,
        f.field_name, f.gps_location, f.price_deposit, f.cancel_hours,
        b.sub_field_id, sf.sub_field_name, sf.price,
        b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
        b.total_hours, b.total_price, b.total_remaining,
        b.pay_method, b.status, b.activity, b.selected_slots
      FROM bookings b
      LEFT JOIN field f ON b.field_id = f.field_id
      LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
      INNER JOIN users u ON u.user_id = b.user_id
      WHERE b.field_id = $1
    `;

    let values = [field_id];
    let i = 2;

    if (date) {
      query += ` AND b.start_date = $${i}`;
      values.push(date);
      i++;
    }

    if (status) {
      query += ` AND b.status = $${i}`;
      values.push(status);
      i++;
    }

    query += ` ORDER BY b.booking_date DESC`;

    const result = await pool.query(query, values);
               if (req.io) {
    req.io.emit("slot_booked", {
      bookingId: result.rows.booking_id,
    });
  }

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, error: "Failed to get bookings" });
  }
});

router.get("/bookings-detail/:booking_id", authMiddleware, async (req, res) => {
  const { booking_id } = req.params;
  const requestingUser = req.user;

  try {
 const result = await pool.query(
  `SELECT 
      b.booking_id,
      b.user_id,
      b.field_id,
      u.first_name,
      u.last_name,
      u.email,
      f.field_name,
      f.user_id AS field_user_id, 
      f.gps_location,
      f.price_deposit,
      f.cancel_hours,
      b.sub_field_id,
      sf.sub_field_name,
      sf.price,
      b.booking_date,
      b.start_date,
      b.start_time,
      b.end_date,
      b.end_time,
      b.total_hours,
      b.total_price,
      b.total_remaining,
      b.pay_method,
      b.status,
      b.activity,
      b.selected_slots,
      bf.fac_name AS facility_name,
      bf.field_fac_id,
      p.payment_id,
      p.deposit_slip,
      p.total_slip
    FROM bookings b
    LEFT JOIN field f ON b.field_id = f.field_id
    LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
    LEFT JOIN booking_fac bf ON bf.booking_id = b.booking_id
    LEFT JOIN users u ON u.user_id = b.user_id
    LEFT JOIN payment p ON p.booking_id = b.booking_id
    WHERE b.booking_id = $1
    LIMIT 1;`,
  [booking_id]
);

    const booking = result.rows[0];

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลการจองนี้",
      });
    }

    const isAdmin = requestingUser.role === "admin";
    const isBookingOwner = requestingUser.user_id === booking.user_id;
    const isFieldOwner = requestingUser.user_id === booking.field_user_id;

    if (!isAdmin && !isBookingOwner && !isFieldOwner) {
      return res.status(403).json({
        success: false,
        error: "คุณไม่มีสิทธิ์ดูข้อมูลการจองนี้",
      });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking detail:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
});

router.put("/booking-status/:booking_id", authMiddleware, async (req, res) => {
  const { booking_id } = req.params;
  const { booking_status } = req.body;

  try {
    let result;

    // ✅ อัปเดตสถานะ และ updated_at ถ้า approved
    if (booking_status === "approved") {
      result = await pool.query(
        "UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2 RETURNING *",
        [booking_status, booking_id]
      );
    } else {
      result = await pool.query(
        "UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING *",
        [booking_status, booking_id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบ booking ที่ต้องการอัปเดต",
      });
    }

    const booking = result.rows[0];

   
    const userInfoRes = await pool.query(
      `SELECT u.email, f.field_name
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN field f ON b.field_id = f.field_id
       WHERE b.booking_id = $1`,
      [booking_id]
    );

    const userInfo = userInfoRes.rows[0];

    if (userInfo) {
      let subject = "";
      let message = "";

      if (booking_status === "approved") {
        subject = "การจองของคุณได้รับการอนุมัติแล้ว ✅";
        message = `
          <p>การจองสนาม <strong>${userInfo.field_name}</strong> ของคุณได้รับการอนุมัติแล้ว</p>
           <a href="http://localhost:3000/bookingDetail/${booking_id}" >
          <p>กรุณาแนบสลิปมัดจำหากจำเป็นภายในเวลาที่กำหนด${booking_id} </p>
        `;
      } else if (booking_status === "rejected") {
        subject = "การจองของคุณไม่ได้รับการอนุมัติ ❌";
   message = `
  <p>การจองสนาม <strong>${userInfo.field_name}</strong> ของคุณได้รับการอนุมัติแล้ว</p>
  <p>
    <a href="http://localhost:3000/bookingDetail/${booking_id}" style="color:blue;" target="_blank">
      🔗 คลิกเพื่อดูรายละเอียดการจอง หรือแนบสลิป
    </a>
  </p>
  <p>กรุณาแนบสลิปมัดจำหากจำเป็นภายในเวลาที่กำหนด</p>
`;

      }

    
      if (subject) {
        await resend.emails.send({
          from: process.env.Sender_Email,
          to: userInfo.email,
          subject,
          html: message,
        });

        console.log(`📧 ส่งอีเมลแจ้งผลการอัปเดตสถานะไปยัง ${userInfo.email}`);
      }
    }

    // ✅ ส่ง socket event แจ้งหน้าเว็บ
    req.io.emit("slot_booked", {
      bookingId: booking_id,
    });

    return res.status(200).json({
      success: true,
      message: "อัปเดตสถานะสำเร็จ",
      data: booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในระบบ",
    });
  }
});



router.delete(
  "/cancel-bookings/:booking_id",
  authMiddleware,
  async (req, res) => {
    const { booking_id } = req.params;
    const { cancel_time } = req.body;

    try {
      // ✅ ตรวจ cancel_time
      if (!cancel_time) {
        return res.status(400).json({
          status: 0,
          message: "Missing cancel_time in request body.",
        });
      }

      const now = new Date(cancel_time);
      if (isNaN(now.getTime())) {
        return res.status(400).json({
          status: 0,
          message: "Invalid cancel_time format. Must be ISO string.",
        });
      }

      console.log(` ยกเลิก booking_id = ${booking_id}`);
      console.log(` เวลาที่กดปุ่ม cancel: ${now.toISOString()}`);

      // ✅ ดึงข้อมูลการจอง
      const fieldDataResult = await pool.query(
        `
        SELECT f.cancel_hours, b.start_date, b.start_time, f.field_name
        FROM bookings b
        JOIN field f ON b.field_id = f.field_id
        WHERE b.booking_id = $1
      `,
        [booking_id]
      );

      if (fieldDataResult.rowCount === 0) {
        return res.status(404).json({
          status: 0,
          message: `Booking ID ${booking_id} not found.`,
          timestamp: now.toISOString(),
        });
      }

      const { cancel_hours, start_date, start_time, field_name } =
        fieldDataResult.rows[0];

      // ✅ ตรวจและแปลง start_date
      let startDateStr;
      try {
        const startDateObj = new Date(start_date);
        if (isNaN(startDateObj.getTime()))
          throw new Error("Invalid start_date");
        const yyyy = startDateObj.getFullYear(); //  ใช้ startDateObj
        const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(startDateObj.getDate()).padStart(2, "0");
        startDateStr = `${yyyy}-${mm}-${dd}`; //  เขียนทับตัวแปรด้านนอก
      } catch (err) {
        console.error(" start_date is invalid:", start_date);
        return res.status(500).json({
          status: 0,
          message: "Invalid start_date format from database.",
          booking_id,
        });
      }

      // ✅ ตรวจและจัดการ start_time (รับ HH:mm หรือ HH:mm:ss)
      if (
        !start_time ||
        typeof start_time !== "string" ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(start_time)
      ) {
        console.error(" Invalid start_time:", start_time);
        return res.status(500).json({
          status: 0,
          message: "Invalid start_time format from database.",
          booking_id,
        });
      }

      const trimmedStartTime = start_time.slice(0, 5); // เหลือแค่ HH:mm

      //  รวมวันเวลา และแปลงเป็นเวลาประเทศไทย
      const startDateTimeRaw = `${startDateStr}T${trimmedStartTime}:00`;
      const startDateTime = new Date(startDateTimeRaw);
      if (isNaN(startDateTime.getTime())) {
        console.error(" Invalid startDateTime:", startDateTimeRaw);
        return res.status(500).json({
          status: 0,
          message: "Cannot parse combined start date/time.",
          booking_id,
        });
      }
      startDateTime.setHours(startDateTime.getHours() + 7); // ปรับเป็นเวลาไทย
      console.log("startDateStr:", startDateStr); // ควรเป็น 2025-06-02
      console.log("start_time:", start_time); // ควรเป็น 19:00:00

      //  ถ้าไม่มีเวลายกเลิก → ยกเลิกได้ทันที
      if (cancel_hours === null) {
        await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
          booking_id,
        ]);
        await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
          booking_id,
        ]);

        

        return res.status(200).json({
          status: 1,
          message: `Booking for ${field_name} at ${trimmedStartTime} on ${startDateStr} canceled successfully.`,
          cancelDeadline: null,
          now: now.toISOString(),
        });
      }

      // ✅ คำนวณเส้นตายการยกเลิก
      const cancelDeadline = new Date(
        startDateTime.getTime() - cancel_hours * 60 * 60 * 1000
      );

      console.log("Frontend ส่งมา (cancel_time):", now.toISOString());
      console.log("เวลาเริ่ม:", startDateTime.toISOString());
      console.log("เส้นตายยกเลิก:", cancelDeadline.toISOString());

      // ✅ เปรียบเทียบเวลา
      if (now < cancelDeadline) {
        await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
          booking_id,
        ]);
        await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
          booking_id,
        ]);

       if (req.io) {
    req.io.emit("slot_booked", {
      bookingId: booking_id,
    });
  }

        return res.status(200).json({
          status: 1,
          message: `การจองสนาม ${field_name} เวลา ${trimmedStartTime} วันที่ ${startDateStr} ถูกยกเลิกเรียบร้อย`,
          cancelDeadline: cancelDeadline.toISOString(),
          now: now.toISOString(),
        });
      } else {
        return res.status(400).json({
          status: 0,
          message: `ไม่สามารถยกเลิกได้ เลยเวลาการยกเลิกภายใน ${cancel_hours} ชม. ก่อนจะเริ่ม`,
          field: field_name,
          startDateTime: startDateTime.toISOString(),
          cancelDeadline: cancelDeadline.toISOString(),
          now: now.toISOString(),
        });
      }
    } catch (error) {
      console.error(" Error while canceling booking:", error);

      return res.status(500).json({
        status: 0,
        message: "Internal Server Error",
        error: error.message,
        booking_id,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

router.post(
  "/upload-slip/:booking_id",
  upload.fields([
    { name: "deposit_slip", maxCount: 1 },
    { name: "total_slip", maxCount: 1 },
  ]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const bookingId = req.params.booking_id;

      let depositSlip = null;
      let totalSlip = null;

      if (req.files["deposit_slip"]?.length > 0) {
        depositSlip = req.files["deposit_slip"][0].path.replace(/\\/g, "/");
      }
      if (req.files["total_slip"]?.length > 0) {
        totalSlip = req.files["total_slip"][0].path.replace(/\\/g, "/");
      }

      if (!depositSlip && !totalSlip) {
        return res.status(400).json({ success: false, message: "ต้องแนบสลิปอย่างน้อยหนึ่งรายการ" });
      }

      //  ตรวจสอบว่า booking นั้นมีมัดจำหรือไม่ และดูเวลา
      const bookingRes = await client.query(
        `SELECT b.status, b.updated_at, b.start_date, b.start_time, f.price_deposit
         FROM bookings b
         JOIN field f ON b.field_id = f.field_id
         WHERE b.booking_id = $1`,
        [bookingId]
      );

      const booking = bookingRes.rows[0];
      if (!booking) {
        return res.status(404).json({ success: false, message: "ไม่พบข้อมูลการจอง" });
      }

      const now = new Date();
      const startTime = new Date(`${booking.start_date}T${booking.start_time}`);
      startTime.setHours(startTime.getHours() + 7); // เวลาไทย

      if (booking.price_deposit === 0 && booking.status === "approved") {
        const approvedAt = new Date(booking.updated_at);
        const deadline = new Date(approvedAt.getTime() + 1 * 60 * 60 * 1000);

        if (now > deadline || now >= startTime) {
          await client.query(`DELETE FROM bookings WHERE booking_id = $1`, [bookingId]);
          return res.status(400).json({
            success: false,
            message: "เลยเวลาแนบสลิป ระบบได้ยกเลิกการจองอัตโนมัติแล้ว",
          });
        }
      }

      //  เพิ่มข้อมูลเข้า payment table
      const result = await client.query(
        `INSERT INTO payment (booking_id, deposit_slip, total_slip)
         VALUES ($1, $2, $3)
         RETURNING payment_id`,
        [bookingId, depositSlip, totalSlip]
      );

      if (req.io) {
        req.io.emit("slot_booked", { bookingId });
      }

      res.json({
        success: true,
        message: "Upload success",
        filePath: { depositSlip, totalSlip },
        payment_id: result.rows[0].payment_id,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    } finally {
      client.release();
    }
  }
);



router.put(
  "/upload-slip/:booking_id",
  upload.fields([
    { name: "total_slip", maxCount: 1 }
  ]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const bookingId = req.params.booking_id;

      
      let totalSlip = null;

      if (req.files["total_slip"]?.length > 0) {
        totalSlip = req.files["total_slip"][0].path.replace(/\\/g, "/");
      }

      if ( !totalSlip) {
        return res.status(400).json({ success: false, message: "ต้องแนบสลิป" });
      }

      const result = await client.query(
        `
         UPDATE payment SET total_slip = $1 WHERE booking_id = $2
         RETURNING payment_id`,
        [ totalSlip,bookingId]
      );
                   if (req.io) {
    req.io.emit("slot_booked", {
      bookingId,
    });
  }

      res.json({
        success: true,
        message: "Upload success",
        filePath: {  totalSlip },
        payment_id: result.rows[0].payment_id,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    } finally {
      client.release();
    }
  }
);

return router;
 
}


