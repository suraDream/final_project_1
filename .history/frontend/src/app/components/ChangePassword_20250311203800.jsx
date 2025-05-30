// ตรวจสอบรหัสเดิม
router.post("/:id/check-password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;

  try {
    const result = await pool.query("SELECT password FROM users WHERE user_id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const storedPassword = result.rows[0].password;

    // ตรวจสอบว่ารหัสเดิมถูกต้องหรือไม่
    const isPasswordMatch = await bcrypt.compare(currentPassword, storedPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "รหัสเดิมไม่ถูกต้อง" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// อัปเดตรหัสผ่าน
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { password, first_name, last_name, email, role } = req.body;

  try {
    // ตรวจสอบว่า first_name และ last_name ไม่เป็น null หรือ undefined
    if (!first_name || !last_name) {
      return res.status(400).json({ message: "ข้อมูลไม่สมบูรณ์: ชื่อหรือานามสกุลไม่สามารถเป็นค่าว่าง" });
    }

    // เข้ารหัสรหัสใหม่
    const hashedPassword = await bcrypt.hash(password, 10);

    // อัปเดตรหัสผ่านใหม่และข้อมูลผู้ใช้
    const updateResult = await pool.query("UPDATE users SET password = $1, first_name = $2, last_name = $3, email = $4, role = $5 WHERE user_id = $6", [
      hashedPassword,
      first_name,
      last_name,
      email,
      role,
      id,
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});