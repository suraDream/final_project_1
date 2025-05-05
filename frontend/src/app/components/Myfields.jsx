"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/myfield.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function MyFieldPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [myFields, setMyFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด"); // Default filter to show all
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null);
  const { user, isLoading } = useAuth();


  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }

    if (user?.role !== "admin" && user?.role !== "field_owner") {
      router.push("/");
    }
  }, [user, isLoading, , router]);

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        const res = await fetch(`${API_URL}/myfield/myfields`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();
        console.log(data);

        if (!res.ok) {
          throw new Error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลสนาม");
        }

        setMyFields(data);
        setFilteredFields(data); // Initially set the filtered fields to all fields
      } catch (err) {
        console.error("Error loading fields:", err.message);
        setError(err.message);
      }
    };

    fetchMyFields();
  }, []);

  // Filter fields based on the selected status
  useEffect(() => {
    if (statusFilter === "ทั้งหมด") {
      setFilteredFields(myFields); // Show all fields
    } else {
      setFilteredFields(
        myFields.filter((field) => field.status === statusFilter)
      );
    }
  }, [statusFilter, myFields]);

  const handleDeleteField = (field_id) => {
    // Set the field_id to be deleted and show the modal
    setFieldIdToDelete(field_id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    try {
      const res = await fetch(
        `${API_URL}/field/delete/field/${fieldIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete field");
      }

      // Remove the deleted field from the state
      setMyFields(
        myFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setFilteredFields(
        filteredFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setShowDeleteModal(false); // Close the modal after deletion
    } catch (error) {
      console.error("Error deleting field:", error);
    }
  };
  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <div className="container">
      <div className="section-title-container">
        <h2 className="section-title">สนามของฉัน</h2>
        <select
          onChange={(e) => setStatusFilter(e.target.value)}
          value={statusFilter}
          className="sport-select"
        >
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="ผ่านการอนุมัติ">ผ่านการอนุมัติ</option>
          <option value="รอตรวจสอบ">รอตรวจสอบ</option>
          <option value="ไม่ผ่านการอนุมัติ">ไม่ผ่าน</option>
        </select>
      </div>
      <div className="grid">
        {filteredFields.length > 0 ? (
          filteredFields.map((field) => (
            <div key={field.field_id} className="card">
              <img
                onClick={() => router.push(`/profile/${field.field_id}`)}
                src={
                  field.img_field
                    ? `${API_URL}/${field.img_field}`
                    : "https://via.placeholder.com/300x200"
                }
                alt={field.field_name}
                className="card-img"
              />
              <h3 className="custom-field-name">{field.field_name}</h3>
              <p className="custom-owner-info">
                เจ้าของ: {field.first_name} {field.last_name}
              </p>
              <p className="custom-owner-info">: {field.status}</p>
              <div className="custom-button-group">
                <button
                  onClick={() => router.push(`/checkField/${field.field_id}`)}
                  className="custom-button-view"
                >
                  ดูรายละเอียด
                </button>
                {field.status !== "รอตรวจสอบ" && (
                  <button
                    onClick={() => router.push(`/editField/${field.field_id}`)}
                    className="custom-button-edit"
                  >
                    แก้ไข
                  </button>
                )}
                <button
                  onClick={() => handleDeleteField(field.field_id)}
                  className="custom-button-delete"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="custom-no-fields-message">
            ไม่มีสนามที่ตรงกับสถานะที่เลือก
          </p>
        )}
      </div>
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>ยืนยันการลบสนาม</h3>
            <p>คุณต้องการลบสนามหรือไม่</p>
            <div className="modal-actions">
              <button className="savebtn" onClick={confirmDeleteSubField}>
                ยืนยัน
              </button>
              <button
                className="canbtn"
                onClick={() => setShowDeleteModal(false)} // Close the modal
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
