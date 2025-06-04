"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";

import "@/app/css/orderDetail.css";
import { io } from "socket.io-client";
export default function BookingDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const router = useRouter();
  const { booking_id } = useParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [message, setMessage] = useState(""); //
  const [messageType, setMessageType] = useState("");
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");
  const [depositSlip, setDepositSlip] = useState(null);
  const [totalSlip, setTotalSlip] = useState(null);
  const [imgPreviewTotal, setImgPreviewTotal] = useState("");
  const [imgPreviewDeposit, setImgPreviewDeposit] = useState("");

useEffect(() => {
  if (isLoading || !booking_id) return;

  console.log("BookingDetail Debug → booking_id:", booking_id);
  console.log("BookingDetail Debug → user:", user);
  console.log("BookingDetail Debug → isLoading:", isLoading);

  if (!user) {
    const encoded = encodeURIComponent(`/bookingDetail/${booking_id}`);
    router.push(`/login?redirectTo=${encoded}`);
  } else if (user?.status !== "ตรวจสอบแล้ว") {
    router.replace("/verification");
  }
}, [user, isLoading, booking_id]);

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
      console.log(" booking_id:", data.bookingId);
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
  if (!user || isLoading) return;

  const fetchData = async () => {
    try {
      if (!booking_id) return;

      const res = await fetch(
        `${API_URL}/booking/bookings-detail/${booking_id}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success) {
        setMybooking(data.data);
        console.log(" Booking Data:", data.data);
      } else {
        console.log(" Booking fetch error:", data.error);
      }
    } catch (error) {
      console.error(" Fetch error:", error);
    }
  };

  fetchData();
}, [booking_id, API_URL, bookingId, user, isLoading]);

useEffect(() => {
  console.log("BookingDetail Debug - user:", user);
  console.log("BookingDetail Debug - isLoading:", isLoading);
}, [user, isLoading]);




  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (
      !start_date ||
      !start_time ||
      cancel_hours === undefined ||
      cancel_hours === null
    ) {
      return "-";
    }

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;

    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);

    if (isNaN(bookingDateTime.getTime())) {
      console.log(" Invalid Date from:", cleanDate, start_time);
      return "-";
    }

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calTotalHours = (total_hours) => {
    const hour = Math.floor(total_hours);
    const minutes = (total_hours % 1) * 100;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${hour}:${formattedMinutes}`;
  };
  const openConfirmModal = (status) => {
    setNewStatus(status); // ตั้งค่าสถานะใหม่ที่ต้องการเปลี่ยน
    setShowConfirmModal(true); // เปิดโมดอล
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false); // ปิดโมดอล
  };

  const updateStatus = async (status, booking_id) => {
    console.log("Booking:", booking);

    if (!booking_id || isNaN(Number(booking_id))) {
      setMessage("booking_id ไม่ถูกต้อง");
      setMessageType("error");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/booking/booking-status/${booking_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_status: status }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`อัพเดทสถานะเป็น: ${status}`);
        setMessageType("success");

        const updatedRes = await fetch(
          `${API_URL}/booking/bookings-detail/${booking_id}`,
          { credentials: "include" }
        );
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setMybooking(updatedData.data);
        }
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถอัปเดตได้"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      setMessageType("error");
    }
  };

  const StatusChangeModal = ({ newStatus, onConfirm, onClose }) => (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>เปลี่ยนสถานะการจอง</h2>
          {/* <div className="status-label-order-detail">{newStatus}</div> */}
        </div>

        <div className="modal-actions-order-detail">
          <button
            className="modal-confirm-btn-order-detail"
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button className="modal-cancel-btn-order-detail" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  const CancelBookingModal = ({ onConfirm, onClose }) => (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>ยกเลิกการจอง</h2>
        </div>
        <div className="modal-actions-order-detail">
          <button
            className="modal-confirm-btn-order-detail"
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button className="modal-cancel-btn-order-detail" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  const confirmCancelBooking = async () => {
    try {
      const res = await fetch(
        `${API_URL}/booking/cancel-bookings/${booking.booking_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancel_time: new Date(
              Date.now() + 7 * 60 * 60 * 1000
            ).toISOString(),
          }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        setTimeout(() => {
          router.back();
        }, 5000);
      } else {
        setMessage(data.message || "ยกเลิกไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Cancel Booking Error:", error);
      setMessage("เกิดข้อผิดพลาดในการยกเลิกการจอง");
      setMessageType("error");
    } finally {
      setShowCancelModal(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleDepositSlip = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    if (file) {
      if (file.type.startsWith("image/")) {
        setDepositSlip(file);
        setImgPreviewDeposit(URL.createObjectURL(file));
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const handleTotalSlip = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    if (file) {
      if (file.type.startsWith("image/")) {
        setTotalSlip(file);
        setImgPreviewTotal(URL.createObjectURL(file));
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const uploadSlip = async () => {
    if (!depositSlip && !totalSlip) {
      setMessage("กรุณาแนบสลิปอย่างน้อย 1 รายการ");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    if (depositSlip) formData.append("deposit_slip", depositSlip);
    if (totalSlip) formData.append("total_slip", totalSlip);

    try {
      const res = await fetch(
        `${API_URL}/booking/upload-slip/${booking.booking_id}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage("อัปโหลดเรียบร้อยแล้ว");
        setMessageType("success");
      } else {
        setMessage(data.message || "อัปโหลดไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
      setMessageType("error");
    }
  };

  const uploadTotalSlip = async () => {
    if (!totalSlip) {
      setMessage("กรุณาแนบสลิปอย่างน้อย 1 รายการ");
      setMessageType("error");
      return;
    }

    const formData = new FormData();

    if (totalSlip) formData.append("total_slip", totalSlip);

    try {
      const res = await fetch(
        `${API_URL}/booking/upload-slip/${booking.booking_id}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage("อัปโหลดเรียบร้อยแล้ว");
        setMessageType("success");
      } else {
        setMessage(data.message || "อัปโหลดไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
      setMessageType("error");
    }
  };

  return (
    <div className="order-detail">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <h1 className="order-detail-title">รายละเอียดการจอง</h1>

      {!booking || Object.keys(booking).length === 0 ? (
        <p className="order-detail-empty">ไม่พบรายละเอียด</p>
      ) : (
        <li className="booking-card-order-detail">
          <p>
            <strong>ชื่อผู้จอง:</strong> {booking.first_name}{" "}
            {booking.last_name}
          </p>
          <p>
            <strong>วันที่:</strong> {formatDate(booking.start_date)}
          </p>
          <p>
            <strong>เวลา:</strong> {booking.start_time} - {booking.end_time} น.
          </p>
          <p>
            <strong>ชั่วโมงรวม:</strong> {calTotalHours(booking.total_hours)} น.
          </p>
          <p>
            <strong>ยกเลิกได้ถึงเวลา:</strong>{" "}
            {getCancelDeadlineTime(
              booking.start_date,
              booking.start_time,
              booking.cancel_hours
            )}{" "}
            น.
          </p>
          <p>
            <strong>สนาม:</strong> {booking.field_name}
          </p>
          <p>
            <strong>สนามย่อย:</strong> {booking.sub_field_name}
          </p>
          <p>
            <strong>กิจกรรม:</strong> {booking.activity}
          </p>

          <p>
            <strong>มัดจำ:</strong> {booking.price_deposit} บาท
          </p>

          <p>
            <strong>มัดจำ:</strong> {booking.price_deposit} บาท
          </p>

         <div className="deposit-slip-container-order-detail">
  {/* ✅ กรณีมี deposit_slip */}
 {booking.deposit_slip ? (
  <div>
    <img
      src={`${API_URL}/${booking.deposit_slip}`}
      alt="สลิปมัดจำ"
      className="deposit-slip-order-detail"
    />
    <p>
      <strong>ยอดค้างชำระ:</strong> {booking.total_remaining} บาท
    </p>

    {booking.total_slip ? (
      <div>
        <p><strong>ยอดที่โอนส่วนที่เหลือ:</strong></p>
        <img
          src={`${API_URL}/${booking.total_slip}`}
          alt="สลิปเต็มยอด"
          className="deposit-slip-order-detail"
        />
      </div>
    ) : (
      booking?.user_id === user?.user_id && (
        <div>
          <p>อัปโหลดสลิปส่วนที่เหลือ:</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleTotalSlip}
          />
          {imgPreviewTotal && (
            <div className="preview-container-order-detail">
              <img
                src={imgPreviewTotal}
                alt="preview"
                className="deposit-slip-order-detail"
              />
            </div>
          )}
          <p>
            <button onClick={uploadTotalSlip}>ยืนยัน</button>
          </p>
        </div>
      )
    )}
  </div>
) : booking?.price_deposit !== 0 ? (
  booking?.user_id === user?.user_id ? (
    <div>
      <p className="no-slip-message">ไม่มีสลิปมัดจำ</p>
      <p>จ่ายมัดจำ</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleDepositSlip}
      />
      {imgPreviewDeposit && (
        <div className="preview-container-order-detail">
          <img
            src={imgPreviewDeposit}
            alt="preview"
            className="deposit-slip-order-detail"
          />
        </div>
      )}

      <p>หรือจ่ายทั้งหมด</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleTotalSlip}
      />
      {imgPreviewTotal && (
        <div className="preview-container-order-detail">
          <img
            src={imgPreviewTotal}
            alt="preview"
            className="deposit-slip-order-detail"
          />
        </div>
      )}

      <p>
        <strong>ยอดทั้งหมด:</strong> {booking.total_price} บาท
      </p>

      <p>
        <button onClick={uploadSlip}>ยืนยัน</button>
      </p>
    </div>
  ) : (
    <p className="no-slip-message">ไม่มีสิทธิ์อัปโหลดสลิป</p>
  )
) : (
  <p className="no-slip-message">ไม่ต้องแนบสลิปไม่มีมัดจำ</p>
)}

</div>

          <p>
            <strong>สถานะการจอง:</strong>{" "}
            <span className={`status-text-order-detail ${booking.status}`}>
              {booking.status === "pending"
                ? "รอตรวจสอบ"
                : booking.status === "approved"
                ? "อนุมัติแล้ว"
                : booking.status === "rejected"
                ? "ไม่อนุมัติ"
                : "ไม่ทราบสถานะ"}
            </span>
          </p>
          {(user?.user_id === booking.field_user_id ) && (
            <div className="status-buttons-order-detail">
              <button
                className="approve-btn-order-detail"
                onClick={() => openConfirmModal("approved")}
              >
                อนุมัติ
              </button>
              <button
                className="reject-btn-order-detail"
                onClick={() => openConfirmModal("rejected")}
              >
                ไม่อนุมัติ
              </button>
            </div>
          )}
          <button
            className="cancel-booking-btn-order-detail"
            onClick={() => setShowCancelModal(true)}
          >
            ยกเลิกการจอง
          </button>

          {showConfirmModal && (
            <StatusChangeModal
              newStatus={newStatus}
              onConfirm={() => {
                updateStatus(newStatus, booking.booking_id);
                closeConfirmModal();
              }}
              onClose={closeConfirmModal}
            />
          )}
          {showCancelModal && (
            <CancelBookingModal
              onConfirm={confirmCancelBooking}
              onClose={() => setShowCancelModal(false)}
            />
          )}
        </li>
      )}
    </div>
  );
}
