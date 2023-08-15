import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Login from './pages/Login/Login'
import Popup from "./pages/Popup/Popup";
import Extension from "./pages/Extension/Extension";
import { useLocation } from "react-router-dom";

const RoutesTree = () => {
  const location = useLocation();

  useEffect(() => {

    if (location.pathname == '/') {
      document.querySelector('.App').style.padding = "15px 10px 5px 10px"
    } else {
      document.querySelector('.App').style.padding = "0px"
    }
  }, [location])
  
  return (
    <Routes>
      <Route path="/" element={<Extension />} />
      <Route path="/login" element={<Login />} />
      <Route path="/popup" element={<Popup />} />

    </Routes>
  );
};

export default RoutesTree;