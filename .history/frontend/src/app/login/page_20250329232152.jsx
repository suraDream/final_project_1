import React from 'react'
import Login from '@/app/components/Login'
import Navbar from '@/app/components/Navbar'
import "@/app/css/login.css"

export default function page() {
  return (
    <>
    <Navbar></Navbar>
    <Login></Login>
    {/* <div>
        <a href="/register">ยังไม่มีบัญชี Register</a>
      </div> */}
    </>
  )
}
