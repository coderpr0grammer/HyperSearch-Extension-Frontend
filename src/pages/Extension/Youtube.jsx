import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
// import logo from '../../assets/img/logo.svg';
// import Greetings from '../../containers/Greetings/Greetings';
import "./Youtube.css";
// import { Button } from 'react-bootstrap';
// import image from '../../assets/img/icon-128.png';
// import ResultComponent from './ResultComponent';
import Searchbar from "./Searchbar";
import ResultComponent from "./ResultComponent";
import "./Searchbar.css";
import LoadingIcon from "./LoadingIcon.js";
import { ColorThemeContext } from "./Extension";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faRightFromBracket, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { app, db } from "../../utils/firebaseConfig";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import { collection, doc, setDoc, addDoc, onSnapshot, where, query, getDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../utils/firebaseConfig";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";


const Youtube = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [extensionActive, setExtensionActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [dark, setDark] = useState(false);
  const [displayNone, setDisplayNone] = useState(true);
  const [globalQuery, setGlobalQuery] = useState("");
  const extensionContainerRef = useRef(null);
  const errorContainer = useRef(null);
  const divRef = useRef(null);

  const { dark, setDark } = useContext(ColorThemeContext);
  const { user, setUser, subscribedToPro, userData, updateUserData, getUserData, searchesToday, setSearchesToday, setLimitReached, limitReached, lifetimeSearches, setLifetimeSearches, freeLimit, isAdmin} = useContext(AuthenticationContext);


  useEffect(() => {
    if (!errorContainer.current) return;
    setTimeout(() => {
      errorContainer.current.style.opacity = 1;
    }, 0);
  }, [error]);


  const auth = getAuth();

  return (
    <div
      id="main-popup-skm"
      style={{
        top: 50,
        right: 50,
        width: "100%",
        color: dark ? "white" : "black",
      }}
      ref={extensionContainerRef}
    >
      <Searchbar
        loading={loading}
        onSubmit={(query) => {
          const isDarkMode =
            document.documentElement.getAttribute("dark") === "true";

          if (isDarkMode) {
            // YouTube is in dark mode
            setDark(true);
            console.log("YouTube is in dark mode");
          } else {
            // YouTube is in light
            setDark(false);
            console.log("YouTube is in light mode");
          }

          setError("");
          setGlobalQuery(query);
          setLoading(true);
          setShowResults(false);

          const urlParams = new URLSearchParams(new URL(window.location.href).search);
          console.log(urlParams)
          const vid = urlParams.get('vid');


          // let parts = url.split("v=");
          // let thepart = parts[1].split("&t=");

          // var videoId = thepart[0].split("&ab_channel")[0];

          console.log(window.location.href)
          console.log('video: ', vid)

          let json = { youtube_url: `https://www.youtube.com/watch?v=${vid}`, query: query };

          fetch(
            "https://pacific-woodland-70260.herokuapp.com/process_youtube_url",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(json),
            }
          )
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  "Network response was not ok. Internal server error!"
                );
              }
              return response.json();
            })
            .then((data) => {
              if (data == "TranscriptError") {
                setError("Subtitles not available or video is restricted");
              } else if (data == "LengthError") {
                setError(
                  "Unfortunately for our Beta release we can't Skm videos cannot be longer than 2 hours"
                );
                console.log(error);
              } else if (data == "ApiError") {
                setError(
                  "We had trouble processing this video. Please try again."
                );
              } else {
                setResults(data.results.matches);
                setDisplayNone(false);

                console.log('userData, ', userData)

                updateUserData({searchesToday: searchesToday + 1, lifetimeSearches: lifetimeSearches + 1})
                setSearchesToday(searchesToday+1);
                
                if (freeLimit - searchesToday < 1 && !isAdmin) {
                  setLimitReached(true)
                }

                getUserData(user)

                setTimeout(() => {
                  setLoading(false);
                  setShowResults(true);
                }, 300);
              }



              setLoading(false);
            })
            .catch(function (error) {
              setLoading(false);
              console.log("error message: " + error);
              setError(error);
              console.log("error: ", error);
              setError(
                "This video took a bit longer to process so please press Enter again to try and get results. If that doesn't work, we're probably experiencing issues with our servers."
              );
            });

          // console.log(windowFind(query));
        }}
      />

      {!error && results.length > 0 && (
        <>
          <button
            className={`drawerButton ${dark ? "dark" : "light"}`}
            style={{
              marginBottom: `${displayNone ? 20 : -20}`,
              display: "inline-block",
              width: "auto",
              color: dark ? "white" : "black",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            }}
            onClick={() => {
              if (showResults) {
                setShowResults(false);
                setTimeout(() => {
                  setDisplayNone(true);
                  console.log("setting display none to ", showResults);
                }, 600);
              } else {
                setDisplayNone(false);
                setTimeout(() => {
                  setShowResults(true);
                }, 300);
              }
            }}
          >
            <FontAwesomeIcon
              icon={showResults ? faChevronUp : faChevronDown}
              style={{ color: `white` }}
            />
            <p
              style={{
                margin: 0,
                color: "white",
                display: "inline-block",
                fontFamily:
                  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
              }}
            >
              &nbsp;{displayNone ? "Show Results" : "Hide results"}&nbsp;
            </p>
          </button>
          {results.map((item, index) => (
            <ResultComponent
              content={item.metadata.text}
              timeStampURL={item.metadata.url}
              query={globalQuery}
              key={index}
              dark={dark}
              style={{
                transitionDelay: `${(index + 1) * 0.06}s`,
                display: displayNone ? "none" : "block",
              }}
              className={`${showResults ? "show" : ""}`}
            />
          ))}
        </>
      )}
      {error && (
        <div
          className="errorContainer"
          style={{ transition: "opacity 2s ease-in-out" }}
          ref={errorContainer}
        >
          <p>{error}</p>
        </div>
      )}

     
    </div>
  );
};

export default Youtube;
