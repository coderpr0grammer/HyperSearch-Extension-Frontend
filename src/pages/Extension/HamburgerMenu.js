import React, { useState, useContext, useEffect, useRef } from "react";
import "./HamburgerMenu.css";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  where,
  query,
  getDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../utils/firebaseConfig";
import { db, app } from "../../utils/firebaseConfig";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faC, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faCrown } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { createSearchParams } from "react-router-dom";
import { navigateWithQueryVars } from "../../utils/navigateWithQueryVars";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import LoadingIcon from "./LoadingIcon";

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [vid, setVid] = useState("");
  const [isOpeningSubCheckout, setIsOpeningSubCheckout] = useState(false);
  const [isOpeningSubPortal, setIsOpeningSubPortal] = useState(false);

  const menuRef = useRef(null);
  const auth = getAuth();
  const navigate = useNavigate();
  const { user, subscribedToPro, userData, isAdmin } = useContext(
    AuthenticationContext
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(new URL(window.location.href).search);
    const vid = urlParams.get("vid");

    setVid(vid);
  }, []);

  const handleMenuClick = () => {
    console.log(!subscribedToPro || !isAdmin);

    const docHeight = document.documentElement.offsetHeight;

    if (isOpen) {
      window.parent.postMessage({ type: "resize", height: docHeight }, "*");
    } else {
      window.parent.postMessage(
        { type: "resize", height: docHeight + menuRef.current.offsetHeight },
        "*"
      );
    }
    setIsOpen(!isOpen);
  };

  const openSubPortal = async () => {
    setIsOpeningSubPortal(true)
    // Call billing portal function

    const functionRef = httpsCallable(
      functions,
      "ext-firestore-stripe-payments-createPortalLink"
    );
    const { data } = await functionRef({
      returnUrl: vid
        ? `https://youtube.com/watch?v=${vid}`
        : "https://youtube.com",
    });
    // window.open(data.url)
    window.parent.postMessage({ type: "open_sub_portal", url: data.url }, "*");
    setIsOpeningSubPortal(false)

  };

  const openSubCheckout = async () => {
    setIsOpeningSubCheckout(true);
    console.log("clicked");
    const customersRef = collection(db, "customers");
    const userDoc = doc(customersRef, user.uid);
    const checkout_sessions_ref = collection(userDoc, "checkout_sessions");

    const urlParams = new URLSearchParams(new URL(window.location.href).search);
    const vid = urlParams.get("vid");

    const hyperSearchProPrice = "price_1NfXm9IA7oe9PnQH8XRNgKtB"

    const docRef = await addDoc(checkout_sessions_ref, {
      price: hyperSearchProPrice,
      success_url: vid
        ? `https://youtube.com/watch?v=${vid}`
        : "https://youtube.com",
    });

    // Wait for the CheckoutSession to get attached by the extension
    onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data();
      if (error) {
        // Show an error to your customer and
        // inspect your Cloud Function logs in the Firebase console.
        alert(`An error occurred: ${error.message}`);
      }
      if (url) {
        // We have a Stripe Checkout URL, let's redirect.
        window.parent.postMessage({ type: "stripe_checkout_skm", url }, "*");
        setIsOpeningSubCheckout(false);
      }
    });
  };

  return (
    <div className="hamburger-menu">
      <div
        className={`hamburger-icon ${isOpen ? "open" : ""}`}
        onClick={handleMenuClick}
      >
        <div
          className="bar"
          style={{ width: 15, transform: "translateX(2px)" }}
        ></div>
        <div className="bar"></div>
        <div
          className="bar"
          style={{ width: 15, transform: "translateX(2px)" }}
        ></div>
      </div>

      <ul className={`menu ${isOpen && "show"}`} ref={menuRef}>
        {user && (
          <li className={isOpen ? "show" : ""}>
            <button className="userProfile">
              <span
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  fontFamily: "90%",
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    width="24"
                    height="24"
                    style={{ borderRadius: 5, marginRight: 5 }}
                    alt="profile"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} />
                )}{" "}
                {user.displayName}
              </span>
              <div
                style={{
                  fontSize: "80%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  marginTop: 5,
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </div>
            </button>
          </li>
        )}

        {subscribedToPro && (
          <li className={isOpen ? "show" : ""}>
            <button
              onClick={openSubPortal}
              style={{
                color: '#688EF9',
                alignItems: "flex-start",
                display: "flex",
              }}
            >
              {isOpeningSubPortal ? (
                <LoadingIcon color="#688EF9" size={15} thickness={20} />
              ) : (
                <FontAwesomeIcon
                  icon={faCrown}
                  color="#688EF9"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #ff7e00 0%,#8903f7 10%,#ee07d3 20%,#0a8ee6 30%,#0d91de 40%,#1092d6 50%,#0033ff 60%,#00cfa4 70%,#cf1261 80%,#d61039 85%,#ff0000 90%,#ee6907 95%,#f59b01 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                />
              )}
              &nbsp;Manage my subscription
            </button>
          </li>
        )}

        {!subscribedToPro && (
          <li className={isOpen ? "show" : ""}>
            <button
              onClick={openSubCheckout}
              style={{
                background:
                  "linear-gradient(to bottom right, #BA63E7 0%,#8903f7 10%,#ee07d3 20%,#0a8ee6 30%,#0d91de 40%,#0033ff 50%,#0033ff 60%,#BA63E7 70%,#cf1261 80%,#d61039 85%,#ff0000 90%,#ee6907 95%,#f59b01 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                alignItems: "center",
                display: "flex",
              }}
            >
              {isOpeningSubCheckout ? (
                <LoadingIcon color="#158CE6" size={15} thickness={20} />
              ) : (
                <FontAwesomeIcon
                  icon={faCrown}
                  color="#158CE6"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #ff7e00 0%,#8903f7 10%,#ee07d3 20%,#0a8ee6 30%,#0d91de 40%,#1092d6 50%,#0033ff 60%,#00cfa4 70%,#cf1261 80%,#d61039 85%,#ff0000 90%,#ee6907 95%,#f59b01 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                />
              )}
              &nbsp;Upgrade to Pro
            </button>
          </li>
        )}
        <li className={isOpen ? "show" : ""}>
          <button
            onClick={() => {
              auth.signOut();
              window.location.reload();
            }}
          >
            <FontAwesomeIcon icon={faRightFromBracket} /> Sign out
          </button>
        </li>
      </ul>
    </div>
  );
};

export default HamburgerMenu;
