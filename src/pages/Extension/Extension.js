import React, { useContext, useEffect, useState, createContext } from "react";
import { app } from "../../utils/firebaseConfig";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { useNavigate } from "react-router";
import Youtube from "./Youtube";
import { GoogleLogout } from '@react-oauth/google';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './Extension.css'
import { db } from "../../utils/firebaseConfig";
import { collection, doc, setDoc, addDoc, onSnapshot, where, query, getDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../utils/firebaseConfig";

export const ColorThemeContext = createContext();

const ColorThemeContextProvider = ({ children }) => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDarkMode = document.documentElement.getAttribute("dark") === "true";

    if (isDarkMode) {
      // YouTube is in dark mode
      setDark(true);
      console.log("YouTube is in dark mode");
    } else {
      // YouTube is in light
      setDark(false);
      console.log("YouTube is in light mode");
    }
  }, []);

  return (
    <ColorThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ColorThemeContext.Provider>
  );
};

const Extension = () => {
  const auth = getAuth();
  const { user, setUser, uid, setUid } = useContext(AuthenticationContext);

  const navigate = useNavigate();




  return (
    <ColorThemeContextProvider>
      <Youtube />
      
    </ColorThemeContextProvider>
  );
};

export default Extension;
