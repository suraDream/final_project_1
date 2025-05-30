"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";
import Category from "@/app/components/SportType";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [sportsCategories, setSportsCategories] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [approvedFields, setApprovedFields] = useState([]);

  const images = [
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481161556_617689281017883_1575621303415186579_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=urtAfET3SCgQ7kNvgFK6bEM&_nc_oc=AdiUxpNkTTBB2pQ-Q4U6gDPQr-uv13EgZa6Je6-5I_gXrlV9Vh1NOh8xzQuWLPJR0yPZGTQvzIQ4p1zuwA45yTJJ&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=AwjtOpqmAWUuGnm_5Q9NDem&oh=00_AYEkGqL9S-RTYZ-_rePWAPED-YxXyyCNiXcYbHMNGOaE0w&oe=67D89356",
      name: "สนามฟุตบอล A",
      link: "/",
    },
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481975401_627441850042626_2673511310682541741_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=fkGkf3EaaLsQ7kNvgF_oHQt&_nc_oc=AdjWvBMwv3UbpW3E0SNaDximTgZ9Q-FmaB-lMS5JslrrLwCLXMGNZdYJyvgZ38Q4COKr1Fl9X-1oTZhfyaEPxIF7&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=Akzxhs25IP_uJSuOmgtmvta&oh=00_AYF2NnBuB7oeGgyOVCPC41sheyBFaKi5fixzxp8K6ldb4w&oe=67D8A3FA",
      name: "สนามบาสเกตบอล B",
      link: "/",
    },
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481975045_627441870042624_8501074694572073198_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=VioEsPj53igQ7kNvgGeN9fW&_nc_oc=Adgs-E1r1e4CNCwfPWFgGXjaYn3PAA_ErxiRgRpGoqZ2GoINdVcVE1D_pjJTZ7P-Qs0yDnUS7hCpXUfGLUn7_DB0&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=ANHc_4wVm8ckv0TS0x5v9Oe&oh=00_AYFye2hZqYTWraGyv5en6l6WoEkHLSDA9X2iya6oKWpk3w&oe=67D89533",
      name: "สนามเทนนิส C",
      link: "/",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/sports_types/preview/type`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.log("ไม่พบข้อมูลประเภทกีฬา");
        } else {
          setSportsCategories(data); // เซตข้อมูลประเภทกีฬา
        }
      })
      .catch((error) => {
        console.error("Error fetching sports categories:", error);
      });
  }, []);

  // ดึงข้อมูลสนามที่ผ่านการอนุมัติ
  useEffect(() => {
    const token = localStorage.getItem("token");
    const queryParams = selectedSport ? `?sport_id=${selectedSport}` : ""; // เพิ่ม sport_id ใน query หากเลือกแล้ว

    fetch(`${API_URL}/sports_types/preview${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.log("ไม่พบข้อมูลสนามกีฬา");
        } else {
          setApprovedFields(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching approved fields:", error);
      });
  }, [selectedSport]); // เรียกใช้ใหม่เมื่อ selectedSport เปลี่ยน

  const convertToThaiDays = (days) => {
    if (!days) return ""; // ถ้า days เป็น undefined หรือ null ให้คืนค่าเป็นสตริงว่าง

    const dayMapping = {
      Mon: "จันทร์",
      Tue: "อังคาร",
      Wed: "พุธ",
      Thu: "พฤหัสบดี",
      Fri: "ศุกร์",
      Sat: "เสาร์",
      Sun: "อาทิตย์",
    };

    if (Array.isArray(days)) {
      return days.map((day) => dayMapping[day] || day).join(" ");
    }

    return days
      .split(" ")
      .map((day) => dayMapping[day] || day)
      .join(" ");
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="banner-container">
        <video autoPlay loop muted playsInline className="banner-video">
          <source src="/video/bannervideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="btn">
            <button onClick={scrollToBookingSection}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <h2 className="title-notice">ข่าวสาร</h2>
        <div className="banner-images">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].name}
            className="carousel-img"
            onClick={() => router.push(images[currentIndex].link)}
          />
          <div className="dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${currentIndex === index ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
        <div className="container">
          <div className="section-title-container">
            <h2 className="section-title">สนามที่แนะนำ</h2>
            {/* Dropdown เพื่อเลือกประเภทกีฬา */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="sport-select"
            >
              <option value="">ประเภทกีฬาทั้งหมด</option>
              {sportsCategories.map((category) => (
                <option key={category.sport_id} value={category.sport_id}>
                  {" "}
                  {/* ใส่ key สำหรับแต่ละ option */}
                  {category.sport_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid">
            {approvedFields.length > 0 ? (
              approvedFields.map((field) => (
                <div
                  key={field.field_id} // ใช้ key เป็น field_id สำหรับแต่ละการ์ด
                  className="card"
                  onClick={() => router.push(`/profile/${field.field_id}`)}
                >
                  <img
                    src={
                      field.img_field
                        ? `${API_URL}/${field.img_field}`
                        : "https://via.placeholder.com/300x200"
                    }
                    alt={field.field_name}
                    className="card-img"
                  />
                  <div className="card-body">
                    <h3>{field.field_name}</h3>
                    <div className="firstname">
                      <p className="filedname">
                        <span className="first-label-time">เปิดเวลา:</span>
                        {field.open_hours} น. - {field.close_hours} น.
                      </p>
                    </div>
                    <div className="firstopen">
                      <p>
                        <span className="first-label-date">วันทำการ:</span>
                        {convertToThaiDays(field.open_days)}
                      </p>
                      <p>
                        <span className="first-label-date">ประเภทกีฬา:</span>
                        {field.sport_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="load">
                <span className="spinner"></span> กำลังโหลด...{field.sport_name}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
