"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "@/app/css/calendarStyles.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function MyCalendar() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [date, setDate] = useState(null); // ตั้งค่าเริ่มต้นเป็น null
  const router = useRouter();
  const [opendays, setOenDays] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const { subFieldId } = useParams();
  const [isClient, setIsClient] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user, isLoading } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }

  }, [user, isLoading, router]);

  useEffect(() => {
    const storedData = sessionStorage.getItem("booking_date");
    const storedExpiry = sessionStorage.getItem("booking_date_expiry");

    if (storedData && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      // ถ้าวันหมดอายุยังไม่ถึงให้แสดงข้อมูล
      if (currentDate < expiryDate) {
        setDate(new Date(storedData));
      } else {
        // ถ้าวันหมดอายุผ่านไปแล้ว ลบข้อมูลใน `sessionStorage`
        sessionStorage.removeItem("booking_date");
        sessionStorage.removeItem("booking_date_expiry");
        setDate(null);
      }
    }
  }, []);

  useEffect(() => {
    setDate(null);
    if (!subFieldId) {
      return;
    }
    const daysNumbers = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    // เซ็ตวันที่ใน client-side หลังจากโหลด

    const fetchData = async () =>
      await fetch(`${API_URL}/field/open-days/${subFieldId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application",
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.log("ไม่พบข้อมูลวันเปิดสนาม");
          } else {
            if (data[0] && data[0].open_days) {
              const mapDaysToNum = data[0].open_days.map(
                (day) => daysNumbers[day]
              );
              const selectedSubField =
                data[0].sub_fields.find(
                  (subField) => subField.sub_field_id === parseInt(subFieldId)
                ) || "ไม่พบข้อมูล";

              setOenDays(mapDaysToNum);
              setFieldData(selectedSubField);
              console.log("ข้อมูลสนาม", data);
              console.log("ข้อมูลสนามย่อย", selectedSubField);
              console.log("วันที่เปืดสนาม", mapDaysToNum);
            } else {
              setMessage("ไม่สามารถดึงข้อมูลได้");
              setMessageType("error");
            }
          }
        })
        .catch((error) => {
          router.push("/");
          console.error("Error Fetching", error);
        });
    fetchData();
  }, [subFieldId]);

  const handleDateChange = (newDate) => {
    // ถ้าคลิกวันที่เดิม, รีเซ็ตค่า
    if (date && newDate.toDateString() === date.toDateString()) {
      setDate(null);
      sessionStorage.removeItem("booking_date");
      sessionStorage.removeItem("booking_date_expiry");
    } else {
      setDate(newDate);
      sessionStorage.setItem("booking_date", newDate.toDateString());
      // ตั้งวันหมดอายุหลังจาก 10 นาที
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 10); // ตั้งวันหมดอายุหลังจาก 10 นาที
      sessionStorage.setItem("booking_date_expiry", expiryDate.toString()); // เก็บวันหมดอายุ
    }
  };

  const formatDateToThai = (date) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(date);
  };

  const handleDateConfirm = () => {
    if (!date) {
      setMessage("กรุณาเลือกวันที่");
      setMessageType("error");

      return;
    }
    // ตรวจสอบว่ามีวันที่เลือกหรือไม่
    if (date) {
      const storedExpiry = sessionStorage.getItem("booking_date_expiry");
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      // ตรวจสอบวันหมดอายุ
      if (currentDate > expiryDate) {
        setMessage("กรุณาเลือกวันที่ใหม่");
        setMessageType("error");
        return;
      }

      // ตรวจสอบว่าเป็นวันเปิดหรือไม่
      const day = date.getDay();
      if (opendays.includes(day)) {
        // หากเป็นวันเปิดให้ทำการยืนยัน
        
        router.push(`/myhours/${subFieldId}`); // หรือไปที่หน้าอื่น
      } else {
        setMessage("ไม่สามารถเลือกวันนี้ได้");
        setMessageType("error");
      }
    }
   
  };

  const today = new Date();

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  const tileClassName = ({ date, view }) => {
    const day = date.getDay();
    if (
      view === "month" &&
      opendays.includes(day) &&
      date <= maxDate &&
      date >= today
    ) {
      return "allowed-day"; // เพิ่มคลาสสำหรับวันที่อนุญาตให้ hover
    }
    return ""; // วันที่ไม่อนุญาตจะไม่มีคลาส
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

  if (!isClient) return <div>Loading...</div>;
  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="sub-field-detail-container">
        {fieldData !== "ไม่พบข้อมูล" ? (
          <div className="detail">
            <p className="sub-name">
              <strong>สนาม</strong> {fieldData.sub_field_name}
            </p>
            <p className="price">
              <strong>ราคา/ชม.</strong> {fieldData.price} บาท
            </p>
            <p className="type">
              <strong>กีฬา</strong> {fieldData.sport_name}
            </p>
          </div>
        ) : (
          <p>{fieldData}</p>
        )}
      </div>
      <div className="select-day">
        <p>
          เลือกวันที่: {date ? formatDateToThai(date) : "ยังไม่ได้เลือกวันที่"}
        </p>
        <div>**สามารถจองล่วงหน้าได้ไม่เกิน 7 วัน</div>
      </div>
      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange}
          value={date}
          showNeighboringMonth={false}
          minDate={today}
          maxDate={maxDate}
          tileClassName={tileClassName}
          tileDisabled={({ date, view }) => {
            const day = date.getDay();
            return view === "month" && !opendays.includes(day);
          }}
        />
      </div>

      <div className="save-btn">
        <button onClick={handleDateConfirm}>เลือกวันที่</button>
      </div>
    </div>
  );
}
