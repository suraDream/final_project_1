'use client';

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import '../css/calendarStyles.css';  // นำเข้าคลาสสไตล์สำหรับปฏิทิน

const MyCalendar = () => {
  const [date, setDate] = useState(null);  // ตั้งค่าเริ่มต้นเป็น null

  useEffect(() => {
    setDate(new Date());  // เซ็ตวันที่ใน client-side หลังจากโหลด
  }, []);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  if (!date) return <div>Loading...</div>;  // แสดงข้อความ loading ขณะรอการตั้งค่า

  return (
    <div>
      <h2>ปฏิทินของฉัน</h2>
      <Calendar
        onChange={handleDateChange}
        value={date}
      />
      <p>วันที่ที่เลือก: {date.toDateString()}</p>
    </div>
  );
};

export default MyCalendar;
