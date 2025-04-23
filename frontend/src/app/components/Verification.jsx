"use client";
import { useState, useEffect } from "react";
import "@/app/css/Verification.css";
import { useRouter } from "next/navigation";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [timer, setTimer] = useState(60); // เริ่มต้นจาก 60 วินาที
  const [canRequestOTP, setCanRequestOTP] = useState(true); // ใช้สำหรับการอนุญาตให้ผู้ใช้ขอ OTP ใหม่
  const router = useRouter("")

  useEffect(() => {
    const user = localStorage.getItem("user");
    const userData = JSON.parse(user);
    if(userData?.status === "ตรวจสอบแล้ว"){
      router.push("/")
    }
  },[router]);

  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data?.user_id;
  const userEmail = data?.email;

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true); // เมื่อเวลา 0, ให้ผู้ใช้ขอ OTP ใหม่ได้
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval); 
    }
  }, [timer, canRequestOTP]);

  const noSave = async (e) => {
    e.preventDefault();

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
        console.log(result);
        setMessage("ยืนยัน E-mail สำเร็จ กรุณา Login อีกครั้ง");
        setMessageType("success");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          window.location.href = "/login";
        }, 1500);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();

    if (!canRequestOTP) {
      setMessage("กรุณารอสักครู่ก่อนขอ OTP ใหม่");
      setMessageType("success");
      return;
    }
    setCanRequestOTP(false);
    setTimer(60);

    try {
      const res = await fetch(`${API_URL}/register/new-otp/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage("OTP ใหม่ถูกส่งไปยัง " + userEmail);
        setMessageType("success");
      } else {
        const errorMessage = result.message || "เกิดข้อผิดพลาดระหว่างการส่ง OTP";
        setMessage(errorMessage);
        setMessageType("error");
      }
      
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการขอ OTP");
      setMessageType("error");
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="verification-container">
        <div className="head-titel">
          <h1>ยืนยันบัญชี</h1>
        </div>
        <form onSubmit={noSave}>
          <div className="input">
            <input
              required
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="btn-resend">
            <button
              disabled={!canRequestOTP}
              type="button"
              onClick={requestOTP}
            >
              ขอรหัสใหม่
            </button>
            {!canRequestOTP && <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>}
            <p> (OTP มีเวลา 5 นาที ถ้าหมดต้องกดขอใหม่) </p>
          </div>
          <div className="btn">
            <button className="btn" type="submit">
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </>
  );
}