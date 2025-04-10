"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import "@/app/css/login.css";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  
  // เก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  // ใช้สำหรับจัดการข้อความ
  const [message, setMessage] = useState({ text: "", type: "" });

  // ตรวจสอบสถานะผู้ใช้ก่อนโหลดหน้า
  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    // ตรวจสอบว่า token มีอยู่และยังไม่หมดอายุ
    if (token && Date.now() < expiresAt) {
      router.push("/"); // เปลี่ยนเส้นทางไปหน้าแรก
    }
  }, [router]);

  // การเปลี่ยนแปลงข้อมูลฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // การส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ส่งคำขอ login ไปที่ Backend
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Login response data:", data);

      // หากคำขอไม่สำเร็จ
      if (!response.ok) {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
        return;
      }

      // หากมี token
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("expiresAt", data.expiresAt);

        const storedUser = JSON.parse(localStorage.getItem("user"));
        console.log("Stored user:", storedUser);

        if (storedUser) {
          const userStatus = storedUser.status;

          if (userStatus === "รอยืนยัน") {
            router.push("/verication");
          } else {
            // ถ้าได้รับการยืนยันแล้ว, เปลี่ยนเส้นทางไปหน้าแรก
            router.push("/");
          }
        } else {
          console.error("User data is missing in localStorage");
        }
      } else {
        console.error("Token is missing from response:", data);
        setMessage({
          text: "ไม่สามารถรับ Token ได้ โปรดลองอีกครั้ง",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", type: "error" });
    }
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">รหัสผ่าน:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {/* แสดงข้อความที่ได้จาก setMessage */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
}
