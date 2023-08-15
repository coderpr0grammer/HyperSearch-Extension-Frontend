import React, { useState, useContext, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { GoogleLogin } from "@react-oauth/google";
import { collection, setDoc, getDoc, doc } from "firebase/firestore";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";
// import { useNavigate } from "react-router";
import './Login.css';
import { app, db } from "../../utils/firebaseConfig";
import banner from '../../assets/login-banner.png';
import Logo from '../../assets/icon-128.png';
import { useNavigate } from "react-router";
import { createSearchParams } from "react-router-dom";


const auth = getAuth();

const Login = () => {
  const { user, setUser, uid, setUid, getUserData } = useContext(AuthenticationContext);
  const navigate = useNavigate()

  //   const navigate = useNavigate()

  const responseMessage = (response) => {
    // response.preventDefault()
    // Build Firebase credential with the Google ID token.
    const idToken = response.credential;
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in with credential from the Google user.
    signInWithCredential(auth, credential)
      .then((u) => {
        async function checkIfUserExists() {
          const docRef = doc(db, "users", u.user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            getUserData(u.user)

          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
            console.log("u.user", u.user);

            const d = new Date();
            const day = d.getDate();
            const month = d.getMonth() + 1; // Months are zero-based, so add 1
            const year = d.getFullYear();

            // Create the string in the desired format
            const dateString = `${day}/${month}/${year}`;

            await setDoc(doc(db, "users", u.user.uid), {
              name: u.user.displayName,
              email: u.user.email,
              lastSearchesReset: dateString,
              searchesToday: 0,
              lifetimeSearches: 0,
            });
          }
        }
        checkIfUserExists();
        getUserData(u.user)
        console.log("u", u);
        navigate({
          pathname: '/', search: createSearchParams({
            vid: new URLSearchParams(new URL(window.location.href).search).get('vid')
          }).toString()
        });
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The credential that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        console.log(errorCode, errorMessage);
        alert(errorCode, errorMessage);
      });
  };
  const errorMessage = (error) => {
    console.log(error);
    alert(error);
  };

  return (
    <div id="login-main">
      <img src={Logo} height="50" alt="Sign in to Search through videos" />

      <div style={{ display: 'block', marginLeft: 5 }}>
        <h4 style={{ margin: 0 }}>Search through meaning, not keywords.</h4>
        <h4 style={{ margin: 0 }}><span style={{fontWeight: 800}}>HyperSearch</span> this video using AI!</h4>
      </div>


      <div id="google-login">

        <GoogleLogin onSuccess={responseMessage} onError={errorMessage}/>
      </div>
    </div>
  );
};

export default Login;
