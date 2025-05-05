'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import '@/app/css/myhours.css'; 
import { useAuth } from "@/app/contexts/AuthContext";
export default function MyHours() {
  const { subFieldId } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // array เก็บ index ที่เลือก
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [price, setPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [addOns, setAddOns] = useState([]); 
  const [activity,setActivity] = useState("เล่นกีฬา")
  const [facilities, setFacilities] = useState([]);
  const [selectPrice, setSelectPrice] = useState("");  
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [priceDeposit,setPriceDeposit] = useState(0)
  const [sumFac,setSumFac] = useState(0);
  const [totalPrice,setTotalPrice] = useState(0);
  const [totalRemaining,setTotalRemaining] = useState(0);
  const [payMethod, setPayMethod] = useState('');
  const router = useRouter();
  const field_id = localStorage.getItem("field_id");
  const bookingDate = sessionStorage.getItem("booking_date")
  const bookingDateFormatted = new Date(bookingDate).toLocaleDateString('en-CA'); 
  const { user, isLoading } = useAuth();
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const nameBank = localStorage.getItem("name_bank");
  const numberBank =localStorage.getItem("number_bank");
  const accountHolder = localStorage.getItem("account_holder")
  const [depositSlip, setDepositSlip] = useState(null); // เก็บไฟล์ 
  const [imgPreview, setImgPreview] = useState(""); // เก็บ URL 
  const [message, setMessage] = useState(""); // ข้อความแสดงผลผิดพลาด
  const [messageType, setMessageType] = useState(""); 
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
      if (!bookingDate || !subFieldId) return;
    
      const fetchBookedSlots = async () => {
        try {
          const res = await fetch(`${API_URL}/booking/booked-time/${subFieldId}/${bookingDate}`);
          const data = await res.json();
    
          if (!data.error) {
            setBookedSlots(data.data); // [{start_time, end_time}]
          } else {
            console.error("API returned error:", data.message);
          }
        } catch (error) {
          console.error("Failed to fetch booked slots:", error.message);
        }
      };
    
      fetchBookedSlots();
    }, [bookingDate, subFieldId]);
    

  
    useEffect(() => {
      if (!field_id) {
        console.log("field_id is not defined. Skipping fetch.");
        return; // ถ้าไม่มี field_id ก็ไม่ให้ทำงานต่อ
      }

      
    
      const fetchData = async () => {
        try {
          const res = await fetch(`${API_URL}/field/field-fac/${field_id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
    
          const data = await res.json();
          
          // ตรวจสอบว่าไม่มี error ใน response
          if (!data.error && data.data) {
            const fac = data.data.filter(f => f.fac_price !== 0); // ตรวจสอบว่า fac_price ไม่เป็น 0
            setFacilities(fac);
            console.log(fac); // แสดงข้อมูลที่ได้จาก API
          } else {
            console.error("Error fetching data:", data.message);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      
      fetchData();
    }, [field_id]); // ใช้ field_id เป็น dependency
    

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-data/${subFieldId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!data.error) {
          setOpenHours(data.data[0].open_hours);
          setCloseHours(data.data[0].close_hours);
          setPriceDeposit(data.data[0].price_deposit);
          const calculatedSlots = slotTimes(data.data[0].open_hours, data.data[0].close_hours);
          setSlots(calculatedSlots);

          const subField = data.data[0].sub_fields.find(field => field.sub_field_id == subFieldId);
          if (subField) {
            console.log("subField:", subField); 
            setAddOns(subField.add_ons);
            setPrice(subField.price); // กำหนดราคาเริ่มต้น
            setNewPrice(subField.price);
          } else {
            console.log("ไม่พบ subField ตาม subFieldId");
          }
        } else {
          console.log("ไม่พบข้อมูลวันเปิดสนาม");
        }
      } catch (error) {
        router.push("/");
        console.error("Error fetching open days", error);
      }
    };
    fetchData();
  }, [subFieldId]);

  function slotTimes(openHours, closeHours) {
    const slots = [];
    let [openHour, openMinute] = openHours.split(':').map(Number);
    let [closeHour, closeMinute] = closeHours.split(':').map(Number);

    if (openMinute > 0 && openMinute <= 30) {
      openMinute = 30;
    } else if (openMinute > 30) {
      openMinute = 0;
      openHour += 1;
    }

    if (closeMinute > 0 && closeMinute <= 30) {
      closeMinute = 0;
    } else if (closeMinute > 30) {
      closeMinute = 30;
    }

    const openDate = new Date(1970, 0, 1, openHour, openMinute);
    let closeDate = new Date(1970, 0, 1, closeHour, closeMinute);

    if (closeDate <= openDate) {
      closeDate.setDate(closeDate.getDate() + 1);
    }

    let currentTime = new Date(openDate);

    while (currentTime < closeDate) {
      const nextTime = new Date(currentTime);
      nextTime.setMinutes(currentTime.getMinutes() + 30);

      const slot = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')} - ${nextTime.getHours().toString().padStart(2, '0')}:${nextTime.getMinutes().toString().padStart(2, '0')}`;
      slots.push(slot);

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }

  function isSlotBooked(slot) {
    const [start, end] = slot.split(' - ');
  
    for (let booking of bookedSlots) {
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;
  
      // เทียบเวลาโดยใช้ string ตรง ๆ (format HH:mm)
      const slotStart = start;
      const slotEnd = end;
  
      if (
        (bookingStart < bookingEnd &&
          slotStart < bookingEnd &&
          slotEnd > bookingStart) ||
  
        (bookingStart > bookingEnd && (
          slotStart < bookingEnd || slotEnd > bookingStart
        ))
      ) {
        return true;
      }
    }
  
    return false;
  }
  

  function toggleSelectSlot(index) {
    if (selectedSlots.length === 0) {
      setSelectedSlots([index]);
    } else if (selectedSlots.length === 1) {
      setSelectedSlots(prev => [...prev, index]);
    } else {
      setSelectedSlots([index]); // ถ้าเลือกครบแล้วให้เริ่มใหม่
    }
  }

  function calculateSelectedTimes() {
    if (selectedSlots.length === 0) {
      setTimeStart("");
      setTimeEnd("");
      setTotalHours(0);
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const start = slots[sorted[0]].split('-')[0].trim();
    const end = slots[sorted[sorted.length - 1]].split('-')[1].trim();

    setTimeStart(start);
    setTimeEnd(end);

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;

    let minutes = endInMinutes - startInMinutes;
    if (minutes < 0) minutes += 24 * 60; // เผื่อข้ามวัน

    let hours = minutes / 60;
    if (hours % 1 === 0.5) {
      hours = Math.floor(hours) + 0.30;
    }
    setTotalHours(hours);
  }

  useEffect(() => {
    calculateSelectedTimes();
  }, [selectedSlots]);

  function resetSelection() {
    setSelectedSlots([]);
    setTimeStart("");
    setTimeEnd("");
    setTotalHours(0);
  }



  const handlePriceOnChange = (e) => {
    const selectedValue = e.target.value;
    setSelectPrice(selectedValue);

    console.log("Selected Value:", selectedValue);

    // ถ้าเลือก "เล่นกีฬา"
    if (selectedValue === "subFieldPrice") {
      setNewPrice(price); // ใช้ราคา base ของ subField
      console.log("subField price:", price); // แสดงราคาที่เลือก
      setActivity("เล่นกีฬา")
    } else {
      // หา add-on ที่เลือกจาก add_ons
      const selectedAddOn = addOns.find(addOn => addOn.add_on_id === parseInt(selectedValue));
      console.log("Available AddOns:", addOns);

      if (selectedAddOn) {
        setNewPrice(selectedAddOn.price); // อัปเดตราคา
        console.log("Add-On price:", selectedAddOn.price);
        setActivity(selectedAddOn.content)


      } else {
        console.log("Add-On not found for selected value:", selectedValue);
      }
    }
  };
  

  const handleCheckBox = (facId, facPrice, facName) => {
    console.log('Selected Facilities before:', selectedFacilities);

    setSelectedFacilities((prev) => {
      const updatedFacilities = { ...prev };
      let newSumFac = sumFac;
    
      if (updatedFacilities[facId] !== undefined) {
        delete updatedFacilities[facId];
        newSumFac -= facPrice;
      } else {
        updatedFacilities[facId] = {
          field_fac_id: facId,   // ✅ เปลี่ยนจาก facility_id → field_fac_id
          fac_name: facName,     // ✅ เปลี่ยนจาก name → fac_name
          price: facPrice
        };
        newSumFac += facPrice;
      }
    
      setSumFac(newSumFac);
      return updatedFacilities;
    });
};

  
  
  
  
  const calculatePrice = (newPrice, totalHours,sumFac) => {
    if(sumFac === 0){
      if (totalHours % 1 === 0.3) {
        totalHours = totalHours + 0.2;
      }
    const sum = (newPrice * totalHours) 
    const remaining = (newPrice * totalHours) - priceDeposit;
    setTotalPrice(sum) 
    setTotalRemaining(remaining)
  }
  else{
    const sum = (newPrice * totalHours + sumFac) 
    const remaining = (newPrice * totalHours + sumFac) - priceDeposit;
    setTotalPrice(sum)
    setTotalRemaining(remaining)
  }
    return totalPrice;
  };

  useEffect(() => {
     console.log("คิดเงิน")
     console.log(newPrice)
     console.log(totalHours)
     console.log(sumFac)

    if (newPrice && totalHours) {
      
      calculatePrice(newPrice, totalHours, sumFac);
    }
  }, [newPrice, totalHours, sumFac]); 
  
  
  const handleRadioChange = (e) =>{
    setPayMethod(e.target.value)
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleimgChange = (e) => {
    const file = e.target.files[0];
    
    // ตรวจสอบขนาดไฟล์
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error-message");
      e.target.value = null;
      return;
    }
    
    // ตรวจสอบว่าไฟล์ที่เลือกเป็นรูปภาพหรือไม่
    if (file) {
      if (file.type.startsWith("image/")) {
        // ถ้าเป็นไฟล์รูปภาพ, เก็บข้อมูลลงในสถานะ
        setDepositSlip(file);
        setImgPreview(URL.createObjectURL(file)); // สร้าง URL สำหรับแสดงตัวอย่าง
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error-message");
      }
    }
  };
  
  const handleSubmit = async () => {
    const facilityList = Object.values(selectedFacilities).map(item => ({
      field_fac_id: item.field_fac_id,
      fac_name: item.fac_name
    }));
    
    const bookingData = new FormData();
    
    // เพิ่มไฟล์ deposit_slip
    if (depositSlip) {
      bookingData.append("deposit_slip", depositSlip);
    }
  
    // เพิ่มข้อมูล booking ที่เป็นวัตถุ JSON
    bookingData.append("data", JSON.stringify({
      fieldId: field_id,
      userId: user?.user_id,
      subFieldId: subFieldId,
      bookingDate: bookingDateFormatted,
      startTime: timeStart,
      endTime: timeEnd,
      totalHours: totalHours,
      totalPrice: totalPrice,
      payMethod: payMethod,
      totalRemaining: totalRemaining,
      activity: activity,
      selectedFacilities: facilityList,
      status: "pending"
    }));
  
    console.log('Booking Data being sent:', bookingData);
  
    try {
      const response = await fetch(`${API_URL}/booking`, {
        method: 'POST',
        headers: {
          // ไม่มี Content-Type ที่ต้องระบุ
        },
        body: bookingData, // ส่งข้อมูลแบบ FormData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Unknown error'} - Status Code: ${response.status}`);
      } else {
        const data = await response.json();
        if (data.success) {
          alert('✅ บันทึกการจองสำเร็จ');
        } else {
          alert(`Error: ${data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message || 'Unknown error'}`);
    }
  };
  

  
  
  
  
  
  
  
  
  
  
  
  
  const showPrice = () => {
    // แสดงราคาใน UI
    console.log(price)
    console.log(bookingDateFormatted)
    console.log(`new${newPrice}`)
    console.log(`field_id${field_id}`)
    console.log(facilities)
    console.log(sumFac)
    console.log(`มัดจำ${priceDeposit}`)
    console.log(`${payMethod}`)
    console.log(`${bookingDate}`)
    console.log(`${activity}`)
    console.log(`selectedFacilities${selectedFacilities}`)
    console.log(JSON.stringify(selectedFacilities, null, 2))
    const facilityList = Object.values(selectedFacilities).map(item => ({
      facility_id: item.facility_id,
      name: item.name
    }));
    
    console.log(facilityList);
    
  

    
  };
  

  return (
    <div>
      <div className="container">
        <h1 className="header">เวลาทำการ</h1>
        <p className="time-info">เวลาเปิด: {openHours} - เวลาปิด: {closeHours}</p>
        <div>
          {facilities.map(f=>(
            <div key={f.field_fac_id} >
              {f.fac_name}-{f.fac_price}
            </div>
            
            
          ))}
        </div>
        {/* เลือก Add-Ons */}
        <select onChange={handlePriceOnChange} value={selectPrice}> {/* ควรเป็น scalar value */}
        <option key="subFieldPrice" value="subFieldPrice">
            เล่นกีฬา - {price} บาท
          </option>
          {addOns.map(addOn => (
            <option key={addOn.add_on_id} value={addOn.add_on_id}>
              {addOn.content} - {addOn.price} บาท
            </option>
          ))}
        
        </select>

        <div>
          {facilities.map((fac)=>(
            <div key={fac.facility_id}>
            <input type="checkbox" checked={selectedFacilities[fac.facility_id] != undefined } 
            onChange={()=>handleCheckBox(fac.facility_id,fac.fac_price,fac.fac_name)}  />
            <label>{fac.fac_name}-{fac.fac_price}</label>
            
            </div>
           
            
          ))}
        </div>
        <p>ราคา: {price} บาท</p>
        
          <p>{totalHours}*{newPrice}</p>

        <h2 className="sub-header">เลือกช่วงเวลาจอง:</h2>
        {slots.length === 0 ? (
          <p>กำลังโหลด...</p>
        ) : (
          <div className="slots-grid">
            {slots.map((slot, index) => {
  const minIndex = Math.min(...selectedSlots);
  const maxIndex = Math.max(...selectedSlots);
  const isSelected = selectedSlots.length > 0 && index >= minIndex && index <= maxIndex;
  const isBooked = isSlotBooked(slot);

  return (
    <div
      key={index}
      className={`slot-box ${isSelected ? 'selected-slot' : ''} ${isBooked ? 'booked-slot' : ''}`}
      onClick={() => {
        if (!isBooked) toggleSelectSlot(index);
      }}
      style={{ cursor: isBooked ? 'not-allowed' : 'pointer' }}
    >
      <div className="slot-time">{slot}</div>
      <div className="slot-tag">
        {isBooked ? "❌ ถูกจองแล้ว" : isSelected ? "กำลังเลือก..." : "#ล็อคสนาม"}
      </div>
    </div>
  );
})}

          </div>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>เวลาเริ่ม: {timeStart || "-"}</p>
        <p>เวลาสิ้นสุด: {timeEnd || "-"}</p>
        <p>รวมเวลา: {totalHours ? `${totalHours} ชั่วโมง` : "-"}</p>
      </div>

      <button onClick={resetSelection} style={{ marginTop: "20px" }}>
        รีเซ็ตการเลือก
      </button>
      <p>ราคารวม: {totalPrice} บาท</p>
      <p>{`มัดจำที่ต้องจ่ายก่อน${priceDeposit}`}</p>
      <p>{`คงเหลือ${totalRemaining}`}</p>


<button onClick={showPrice} style={{ marginTop: "20px" }}>
  showprice
</button>
<p><label>
        <input
          type="radio"
          value="โอนจ่าย"
          checked={payMethod === 'โอนจ่าย'}
          onChange={handleRadioChange}
        />
        โอนจ่าย
      </label>

      <label >
        <input type="radio" 
        value="เงินสด"
        checked={payMethod === 'เงินสด'}
        onChange={handleRadioChange}
        />
        เงินสด
      </label>
      </p>
        

        <div>
          <p><label >บัญชีจำสำหรับโอนมัดจำ</label></p>
          <p>ธนาคาร: {nameBank}</p>
          <p><label >บัญชีเจ้าของบัญชี</label> : {accountHolder} </p>
          <p><label >เลขบัญชี</label> : {numberBank} </p>
          <input type="file" onChange={handleimgChange} accept="image/*" />
          {imgPreview && imgPreview !== "" && (
  <div className="preview-container">
    <p>ตัวอย่างรูป:</p>
    <img src={imgPreview} alt="Preview" />
  </div>
)}

        </div>

        <button onClick={handleSubmit}>ยืนยันจอง</button>
    </div>
    

  );
}
