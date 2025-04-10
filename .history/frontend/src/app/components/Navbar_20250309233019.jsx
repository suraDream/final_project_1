'use client'
import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import "../css/Nav.css";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // เพิ่ม state สำหรับแฮมเบอร์เกอร์
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ดึง token และ user จาก localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <nav>
      <h2 className="logo">⚽</h2>
      {/* Hamburger Menu */}
     
      {/* เมนูหลัก */}
      <ul className={isMenuOpen ? "active" : ""}>
        <li><a href="/">หน้าแรก</a></li>
        <li><a href="/categories">หมวดหมู่</a></li>
        <li><a href="/contact">ติดต่อเรา</a></li>
      </ul>
      {/* ส่วนของ User */}
      <div className="user">
        <input type="text" placeholder="🔍 ค้นหา..." />
        {token && user ? (
          <div 
            className={`user-profile ${isDropdownOpen ? "active" : ""}`} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="profile-icon">👤</span>
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>
            <div className="dropdown">
              <ul>
                <li><a href="/profile">แก้ไขโปรไฟล์</a></li>
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "field_owner" && <li><a href="/register-field">ลงทะเบียนสนาม</a></li>}
                {user.role === "admin" && <li><a href="/manage-users">จัดการผู้ใช้</a></li>}
                <li><LogoutButton /></li>
              </ul>
            </div>
            <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
          </div>
          
        ) : (
          <>
            <a href="/login" className="login">เข้าสู่ระบบ</a>
            <a href="/register" className="register">สมัครสมาชิก</a>
          </>
        )}
      </div>
    </nav>
  );
}
