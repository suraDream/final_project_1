"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล
  const [sports, setSports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [editSport, setEditSport] = useState(null); // สำหรับเก็บข้อมูลสิ่งอำนวยความสะดวกที่กำลังแก้ไข
  const [newSportName, setNewSportName] = useState(""); // สำหรับเก็บชื่อใหม่ของสิ่งอำนวยความสะดวก

  const [SportTypeToDelete, setSportTypeToDelete] = useState(null); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
  const [showNewSportInput, setShowNewSportInput] = useState(false); // ฟอร์มสำหรับเพิ่มประเภทกีฬาใหม่
  const [newSport, setNewSport] = useState(""); // ชื่อประเภทกีฬาที่จะเพิ่ม

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if (user.role !== "admin") {
      router.push("/");
    }

    setIsLoading(false);
  }, []);

  // โหลดประเภทกีฬา
  useEffect(() => {
    fetch(`${API_URL}/sports_types`)
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  const confirmDeleteSportType = (id) => {
    setSportTypeToDelete(id);
    setShowConfirmModal(true);
  };

  // ฟังก์ชันสำหรับเพิ่มประเภทกีฬาใหม่
  const addType = async () => {
    if (!newSport.trim()) return;

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/sports_types/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sport_name: newSport }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      setMessageType("error");
      return;
    }

    setSports([...sports, data]); // เพิ่มประเภทกีฬาใหม่ใน state
    setNewSport(""); // รีเซ็ตชื่อประเภทกีฬา
    setShowNewSportInput(false); // ซ่อนฟอร์มการเพิ่ม
  };
  // ฟังก์ชันลบประเภทกีฬา
  const deleteSportType = async () => {
    if (!SportTypeToDelete) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/sports_types/delete/${SportTypeToDelete}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setSports(sports.filter((sport) => sport.sport_id !== SportTypeToDelete)); // ลบประเภทกีฬาจาก state
    setShowConfirmModal(false); // ซ่อนโมดอล
  };

  // ฟังก์ชันแก้ไขชื่อประเภทกีฬา
  const editSportType = async () => {
    if (!newSportName.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/sports_types/update/${editingSport.sport_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sport_name: newSportName }),
      }
    );

    const data = await res.json();

    if (data.error) {
      setMessage(data.error); // แสดงข้อผิดพลาดหากชื่อซ้ำ
      setMessageType("error");
      return;
    }

    setSports(
      sports.map((sport) =>
        sport.sport_id === editingSport.sport_id
          ? { ...sport, sport_name: newSportName }
          : sport
      )
    );
    setEditingSport(null); // รีเซ็ตการแก้ไข
    setNewSportName(""); // รีเซ็ตชื่อใหม่
  };

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <div>
      <div className="input-group">
        <label>ประเภทกีฬา</label>
      </div>
      <div className="con">
        <div className="typecon">
          {sports.length > 0 ? (
            sports.map((sport) => (
              <div key={sport.sport_id}>
                <div className="sportname">{sport.sport_name}</div>
                <button
                  className="editbtn"
                  type="button"
                  onClick={() => {
                    setEditSport(sport);
                    setNewSportName(sport.sport_name);
                  }}
                >
                  แก้ไข
                </button>
                <button
                  className="deletebtn"
                  type="button"
                  onClick={() => confirmDeleteSportType(sport.sport_id)}
                >
                  ลบ
                </button>
              </div>
            ))
          ) : (
            <p>ไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      {/* ฟอร์มสำหรับเพิ่มประเภทกีฬใหม่ */}
      <div className="addsportcon">
        {!showNewSportInput ? (
          <button
            className="addsport"
            type="button"
            onClick={() => setShowNewSportInput(true)}
          >
            + เพิ่มประเภทกีฬาใหม่
          </button>
        ) : (
          <div className="add-sport-form">
            <input
              type="text"
              placeholder="ชื่อประเภทกีฬา"
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
            />
            <div className="form-actions">
              <button
                className="savebtn"
                type="button"
                onClick={addType} // เรียกใช้ฟังก์ชัน addType
              >
                บันทึก
              </button>
              <button
                className="cancelbtn"
                type="button"
                onClick={() => setShowNewSportInput(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ข้อความแสดงผล */}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
