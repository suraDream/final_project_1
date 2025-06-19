"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { io } from "socket.io-client";
import "@/app/css/myOrder.css";

export default function Statistics() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({
    bookingDate:"",
    startDate: "",
    endDate: "",
    status: "",
    
  });
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");
  const router = useRouter();
  const { fieldId } = useParams();
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const [fieldName, setFieldName] = useState(""); // เพิ่ม state สำหรับชื่อสนาม
  const [dataLoading, setDataLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user?.role === "customer") router.replace("/");
    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    console.log("API_URL:", API_URL);
    console.log(" connecting socket...");

    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
    });

    socket.on("slot_booked", (data) => {
      console.log("booking_id:", data.bookingId);
      setBookingId(data.bookingId);
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!fieldId) return;
      try {
        // แก้ไขการส่ง parameters
           const queryParams = new URLSearchParams();
if (filters.bookingDate) queryParams.append("bookingDate", filters.bookingDate);
if (filters.startDate) queryParams.append("startDate", filters.startDate);
if (filters.endDate) queryParams.append("endDate", filters.endDate);
if (filters.status) queryParams.append("status", filters.status);

        await new Promise((resolve) => setTimeout(resolve, 200));
        const res = await fetch(
          `${API_URL}/statistics/${fieldId}?${queryParams.toString()}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.success) {
          setMybooking(data.data);
          setFieldName(data.fieldInfo?.field_name || "");
          console.log("Booking data:", data.data);
          if (data.stats) {
            console.log("Stats:", data.stats);
          }
        } else {
          // ดักกรณีสนามยังไม่ผ่าน
          if (data.fieldInfo) {
            setFieldName(data.fieldInfo.field_name || "");
            setMessage(
              `สนาม ${data.fieldInfo.field_name} ${data.fieldInfo.field_status}`
            );
            setMessageType("error");
            setTimeout(() => {
              router.replace("/myfield");
            }, 2000);
          }
          console.log("Booking fetch error:", data.error);
          setMessage(data.error);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [fieldId, API_URL, filters, bookingId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // เพิ่มฟังก์ชันสำหรับ Clear Filters
  const clearFilters = () => {
    setFilters({ startDate: "", endDate: "", status: "" });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (!start_date || !start_time || cancel_hours == null) return "-";

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;
    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);
    if (isNaN(bookingDateTime.getTime())) return "-";

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // คำนวณสถิติจากข้อมูลที่ได้
  const calculateStats = () => {
    const stats = {
      total: booking.length,
      pending: booking.filter((item) => item.status === "pending").length,
      approved: booking.filter((item) => item.status === "approved").length,
      rejected: booking.filter((item) => item.status === "rejected").length,
      complete: booking.filter((item) => item.status === "complete").length,
      totalRevenue: booking
      
        .filter((item) => item.status === "complete")
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0),
      totalDeposit: booking
        .filter(item => item.status === 'approved')
        .reduce((sum, item) => sum + parseFloat(item.price_deposit || 0), 0)
    };
    return stats;
  };

  const stats = calculateStats();
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

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
      <div className="myorder-container">
        <h1>รายการจองสนาม {fieldName}</h1>
        <div className="filters">
          <div className="date-range-filter">
          
          <button
      type="button"
      onClick={() => {
        setUseDateRange((prev) => !prev);
        // เคลียร์ค่าที่ไม่ได้ใช้
        setFilters((prev) => ({
          ...prev,
          bookingDate: useDateRange ? prev.bookingDate : "",
          startDate: useDateRange ? "" : prev.startDate,
          endDate: useDateRange ? "" : prev.endDate,
        }));
      }}
      style={{ marginBottom: "10px" }}
    >
      {useDateRange ? "กลับไปใช้วันที่จอง" : "ใช้ช่วงวันที่แทน"}
    </button>  
        {!useDateRange && (
      <label>
        วันที่จอง:
        {filters.bookingDate && <>{formatDate(filters.bookingDate)}</>}
        <input
          type="date"
          name="bookingDate"
          value={filters.bookingDate}
          onChange={handleFilterChange}
        />
      </label>
    )}

    {useDateRange && (
      <>
        <label>
          วันที่เริ่ม:
          {filters.startDate && <>{formatDate(filters.startDate)}</>}
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          ถึงวันที่:
          {filters.endDate && <>{formatDate(filters.endDate)}</>}
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            min={filters.startDate}
          />
        </label>
      </>
    )}

          </div>

          

          <label>
            สถานะ:
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
              <option value="complete">เสร็จสมบูรณ์</option>
            </select>
          </label>

          <button onClick={clearFilters} className="clear-filters-btn">
            ล้างตัวกรอง
          </button>
          {stats.totalRevenue >= 0 && (
            <div className="revenue-summary">
              <div className="revenue-card">
                <h3>รายได้รวม (เสร็จสมบูรณ์)</h3>
                <p className="revenue-amount">
                  {stats.totalRevenue.toLocaleString()} บาท
                </p>
              </div>
              {/* <div className="revenue-card">
                <h3>ค่ามัดจำรวม</h3>
                <p className="revenue-amount">{stats.totalDeposit.toLocaleString()} บาท</p>
              </div> */}
            </div>
          )}
        </div>

        {/* แสดงสถิติ */}
        {booking.length > 0 && (
          <div className="stats-summary">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-inline">
                  รายการทั้งหมด:{" "}
                  <span className="stat-number">{stats.total}</span>
                </p>
              </div>
              <div className="stat-card pending">
                <p className="stat-inline">
                  รอตรวจสอบ:{" "}
                  <span className="stat-number">{stats.pending}</span>
                </p>
              </div>
              <div className="stat-card approved">
                <p className="stat-inline">
                  อนุมัติแล้ว:{" "}
                  <span className="stat-number">{stats.approved}</span>
                </p>
              </div>
              <div className="stat-card rejected">
                <p className="stat-inline">
                  ไม่อนุมัติ:{" "}
                  <span className="stat-number">{stats.rejected}</span>
                </p>
              </div>
                <div className="stat-card approved">
                <p className="stat-inline">
                  เสร็จสมบูรณ์:{" "}
                  <span className="stat-number">{stats.complete}</span>
                </p>
              </div>
            </div>
          </div>
        )}
        {dataLoading ? (
          <div className="load-container-order">
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          </div>
        ) : booking.length > 0 ? (
<table className="manager-table-user">
  <thead>
    <tr>
      <th>ชื่อผู้จอง</th>
      <th>วันที่จอง</th>
      <th>สนาม</th>
      <th>สนามย่อย</th>
      <th>เวลา</th>
      <th>กิจกรรม</th>
      <th>มัดจำ</th>
      <th>ราคารวมสุทธิ</th>
      <th>สิ่งอำนวยความสะดวก</th>
      <th>คะแนนรีวิว</th>
      <th>คอมเมนต์</th>
    </tr>
  </thead>
<tbody>
  {booking.map((item, index) => (
    <tr key={index} className="booking-card">
      <td>{item.first_name} {item.last_name}</td>
      <td>{formatDate(item.start_date)}</td>
      <td>{item.field_name}</td>
      <td>{item.sub_field_name}</td>
      <td>{item.start_time} - {item.end_time}</td>
      <td>{item.activity}</td>
      <td>{item.price_deposit}</td>
      <td>{item.total_price}</td>
<td>
  {Array.isArray(item.facilities) && item.facilities.length > 0
    ? item.facilities.map((fac, i) => (
        <span key={i}>
          {fac.fac_name} 
          {i < item.facilities.length - 1 ? ", " : ""}
        </span>
      ))
    : "ไมมี"}
</td>
<td>{item.status !== 'complete'
  ? "ยังไม่มีรีวิว"
  : item.rating != null ? item.rating : "ไม่มีรีวิว"}</td>
<td>{item.status !== 'complete'
  ? "ยังไม่มีคอมเมนต์"
  : item.comment != null ? item.commentg : "ไม่มีรีวิว"}</td>


<td>{item.status}</td>

    </tr>
  ))}
</tbody>

</table>


        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
      </div>
    </>
  );
}
