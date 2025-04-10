"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [formData, setFormData] = useState({
    identifier: "", // รองรับทั้ง username และ email
    password: "", // รหัสผ่าน
  });

  const [message, setMessage] = useState(""); // ข้อความแจ้งเตือน
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // ส่ง cookies ไปด้วย
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.message || "เกิดข้อผิดพลาด");
        return;
      }

      const data = await response.json();
      setMessage(`ยินดีต้อนรับ, ${data.user.first_name}`);
      localStorage.setItem("token", data.token); // เก็บ JWT ใน localStorage
      router.push("/landing"); // รีไดเร็กไปหน้า landing
      console.log("User data:", data);
    } catch (error) {
      console.error("Error:", error);
      setMessage("เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ");
    }
  };

  return (
    <div>
      <h2>เข้าสู่ระบบ</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div>
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
    </div>
  );
}
