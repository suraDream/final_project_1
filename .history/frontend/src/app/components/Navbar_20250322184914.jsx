"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "./LogoutButton";
import "@/app/css/Nav.css";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null); 
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 
  const router = useRouter("")

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const expiresAt = localStorage.getItem("expiresAt");

    if (!storedToken || !storedUser || !expiresAt || Date.now() > parseInt(expiresAt)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      setToken(null);
      setUser(null);
      return;
    }
  
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !userProfileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const scrollToBookingSection = () => {
    document
      .getElementById('.section-title') // เลือก section ที่ต้องการ
      .scrollIntoView({ behavior: 'smooth' }); // เลื่อนอย่างนุ่มนวล
  };

  return (
    <nav>
      <a href="/" className="logo">⚽</a>

      {/* เมนูหลัก */}
      <div className="ullist">
        <ul className={isMenuOpen ? "active" : ""}>
          <li><a href="/">หน้าแรก</a></li>
          <li>
              <a
                href="/.section-title"
                onClick={(e) => {
                  e.preventDefault(); // ป้องกันการเปลี่ยนหน้า
                  router.push("/"); // ใช้ Next.js Router เพื่อเปลี่ยนหน้า
                  setTimeout(scrollToBookingSection, 100); // เลื่อนหลังจากเปลี่ยนหน้า
                }}
              >
                หมวดหมู่
              </a>
          </li>
          <li><a href="/contact">ติดต่อเรา</a></li>
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      {/* ส่วนของ User */}
      <div className="user">
        {/* ปุ่มค้นหาลอย */}
        <div className="search-container" ref={searchRef}>
          <button className="search-button" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            🔍
          </button>
          <input 
            type="text" 
            placeholder="ค้นหา..." 
            className={`search-box ${isSearchOpen ? "active" : ""}`} 
          />
        </div>

        {token && user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown} 
            ref={userProfileRef}  
          >
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown" ref={dropdownRef}>
              <ul>
                <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "customer" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user.role === "field_owner" && <li><a href="/registerField">แก้ไขสนามกีฬา</a></li>}
                {user.role === "field_owner" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user.role === "admin" && <li><a href="/manager">จัดการผู้ใช้</a></li>}
                {user.role === "admin" && <li><a href="/addfac">จัดการสิ่งอำนวยความสะดวก</a></li>}
                {user.role === "admin" && <li><a href="/addtype">จัดการประเภทกีฬา</a></li>}
                <LogoutButton />
              </ul>
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
