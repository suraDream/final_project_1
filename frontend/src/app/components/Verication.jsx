"use client";
import { useState } from "react";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // การตั้งค่า useState เพื่อเก็บค่า otp ที่ผู้ใช้กรอก
  const [otp, setOtp] = useState(""); 
  const [newOTP,setNewOTP ] = useState("");


  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data.user_id;

  const noSave = async (e) => {
    

    try {
      const res = await fetch(`${API_URL}/register/verify/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),  
      });

      const result = await res.json();
      if (res.ok) {
        console.log("Verification successful:", result);
       
      } else {
        console.error("Verification failed:", result.message);
        alert(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      alert("An error occurred during verification");
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();
  
    try {
      const res = await fetch(`${API_URL}/register/new-otp/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      const result = await res.json();  // ตรวจสอบผลลัพธ์จาก API
  
      if (res.ok) {
        console.log("Verification successful:", result);
        alert("OTP ใหม่ถูกส่งแล้ว");
      } else {
        console.error("Verification failed:", result.message);
        alert(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      alert("เกิดข้อผิดพลาดในการขอ OTP");
    }
  };
  
  

  return (
    <div className="verification-container">
      <h1>Verification</h1>
      <form onSubmit={noSave}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)} // อัพเดตค่า otp เมื่อกรอกข้อมูล
        />
        <button type="submit">Verify</button>
        <button type="button" onClick={requestOTP}>Request New OTP</button>
      </form>
    </div>
  );
}
