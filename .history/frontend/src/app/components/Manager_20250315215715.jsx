"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/manager.css";

export default function AdminManager() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (!token || !storedUser || !expiresAt || Date.now() > parseInt(expiresAt)) {
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

  useEffect(() => {
    if (currentUser?.role === "admin") {
      const token = localStorage.getItem("token");

      fetch(`${API_URL}/users`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
    }
  }, [currentUser]);

  if (isLoading) return <p>กำลังโหลด...</p>;
  

  const isEmailDuplicate = (email) => {
    return users.some(
      (user) => user.email === email && user.user_id !== selectedUser?.user_id
    );
  };
  

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?")) return;
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
      });
  
      if (!response.ok) {
        throw new Error("Unauthorized: คุณไม่มีสิทธิ์ลบผู้ใช้นี้");
      }
  
      setUsers(users.filter((user) => user.user_id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };
  

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
  
    if (isEmailDuplicate(selectedUser.email)) {
      setEmailError("อีเมลนี้มีการใช้งานแล้ว");
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(selectedUser),
      });
  
      if (!response.ok) {
        throw new Error("Unauthorized: กรุณาล็อกอินใหม่");
      }
  
      setUsers(
        users.map((user) =>
          user.user_id === selectedUser.user_id ? selectedUser : user
        )
      );
      setSelectedUser(null);
      setEmailError("");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  

  const closeModal = () => {
    setSelectedUser(null);
    setEmailError("");
  };

  return (
    <>
      <div className="admin-manager-container">
        <h2>รายชื่อผู้ใช้งาน</h2>
        {/* 🔹 ตารางสำหรับแอดมิน */}
        <h3>ผู้ดูแลระบบ</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "admin")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* 🔹 ตารางสำหรับลูกค้า */}
        <h3>ลูกค้า</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>อีเมล</th>
              <th>แก้ไขข้อมูล</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "customer")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.user_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <h3>เจ้าของสนามกีฬา</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>อีเมล</th>
              <th>แก้ไขข้อมูล</th>
              <th>แก้ไขสนามกีฬา</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "field_owner")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => setSelectedUser(user)}
                    >
                      แก้ไข
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.user_id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* 🔹 ตารางสำหรับเจ้าของสนาม */}
        <h3>รอตรววจสอบการลงทะเบียน</h3>
        <table>
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>อีเมล</th>
              <th>จัดการสนามกีฬา</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((user) => user.role === "field_owner")
              .map((user) => (
                <tr key={user.user_id}>
                  <td>
                    {user.first_name} - {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <button className="ProveEdit-btn">ตรวจสอบสนามกีฬา</button>
                    <button className="ProveDelete-btn">ลบการลงทะเบียน</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {/* 📝 Modal สำหรับแก้ไขข้อมูล */}
        {selectedUser && (
          <div className="modal">
            <div className="modal-content">
              <h3>แก้ไขข้อมูลลูกค้า</h3>
              <form onSubmit={handleUpdateUser}>
                <label>ชื่อ:</label>
                <input
                  type="text"
                  value={selectedUser.first_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      first_name: e.target.value,
                    })
                  }
                />
                <label>นามสกุล:</label>
                <input
                  type="text"
                  value={selectedUser.last_name}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      last_name: e.target.value,
                    })
                  }
                />
                <label>อีเมล:</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
                {emailError && <p style={{ color: "red" }}>{emailError}</p>}{" "}
                {/* แสดงข้อความ error */}
                <div className="modal-buttons">
                  <button type="submit" className="save-btn">
                    บันทึก
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeModal}
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
