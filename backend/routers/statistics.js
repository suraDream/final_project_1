const express = require("express")
const router = express.Router();
const pool = require("../db");

router.get("/:field_id", async (req, res) => {
  const { field_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        b.booking_id,
        b.booking_date,
        b.total_hours,
        b.activity,
        b.status,
        b.start_time,
        b.end_time,
        b.user_id,
        b.field_id,
        b.sub_field_id,
        u.first_name,
        u.last_name,
        f.field_name,
        s.sub_field_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.user_id
      INNER JOIN field f ON b.field_id = f.field_id
      INNER JOIN sub_field s ON b.sub_field_id = s.sub_field_id
      WHERE b.field_id = $1
      `,
      [field_id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Query error:", error); 
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

 
module.exports = router