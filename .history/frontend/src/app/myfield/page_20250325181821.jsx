import React from "react";
import MyFields from "@/app/components/Myfields"; 
import Navbar from "../components/Navbar";

export default function page() {
  return (
    <div>
      <Navbar></Navbar>
        <MyFields />
      </div>
  );
}