import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
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
import {
  faChevronUp,
  faRightFromBracket,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { app, db } from "../../utils/firebaseConfig";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  where,
  query,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../utils/firebaseConfig";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";
import ProgressBar from "./ProgressBar";
import SummaryComponent from "./SummaryComponent";
import HackedText from "./HackedText";

const Youtube = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [extensionActive, setExtensionActive] = useState(false);
  // const [idToken, setIdToken] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("");
  // const [dark, setDark] = useState(false);
  const [displayNone, setDisplayNone] = useState(true);
  const [globalQuery, setGlobalQuery] = useState("");
  const [upsertProgress, setUpsertProgress] = useState(-1);
  const [summarizedResponse, setSummarizedResponse] = useState("");
  const [moreResultsOpacity, setMoreResultsOpacity] = useState(1);
  const [statusText, setStatusText] = useState("");
  const extensionContainerRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const errorContainer = useRef(null);
  const divRef = useRef(null);

  const { dark, setDark } = useContext(ColorThemeContext);
  const {
    user,
    uid,
    setUser,
    subscribedToPro,
    userData,
    updateUserData,
    getUserData2,
    searchesToday,
    setSearchesToday,
    setLimitReached,
    limitReached,
    lifetimeSearches,
    setLifetimeSearches,
    freeLimit,
    isAdmin,
  } = useContext(AuthenticationContext);

  useEffect(() => {
    if (!errorContainer.current) return;
    setTimeout(() => {
      errorContainer.current.style.opacity = 1;
    }, 0);
  }, [error]);

  useEffect(() => {
    const resultsContainer = resultsContainerRef.current;

    if (showResults && resultsContainer) {
      const handleScroll = () => {
        if (resultsContainer.scrollTop !== 0) {
          setMoreResultsOpacity(0);
        } else {
          setMoreResultsOpacity(1);
        }
      };

      // Add scroll event listener to the results container
      resultsContainer.addEventListener("scroll", handleScroll);

      // Remove the event listener when the component unmounts or when results are no longer visible
      return () => {
        resultsContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [showResults]);

  useEffect(() => {
    const urlParams = new URLSearchParams(new URL(window.location.href).search);

    setTheme(urlParams.get("theme"));
  }, window.location.href);

  const auth = getAuth();

  // useEffect(() => {
  //   (async () => {
  //     const idToken = await auth.currentUser.getIdToken();
  //     // console.log(idToken)
  //     setIdToken(idToken);
  //   })();
  // }, [auth.currentUser]);

  const handleSearch = async (query) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      // console.log(idToken)
      // setIdToken(idToken);
  
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
  
      setDisplayNone(true);
      setError("");
      setGlobalQuery(query);
      setLoading(true);
      setShowResults(false);
  
      const urlParams = new URLSearchParams(
        new URL(window.location.href).search
      );
  
      const vid = urlParams.get("vid");
  
      const url = "https://hypersearch-i7nkqebqsa-uc.a.run.app/";
  
      const normalTestPythonURL =
        "http://127.0.0.1:5001/skm-extension-official/us-central1/hypersearch/normal_hypersearch";
  
      const streamedTestPythonURL =
        "http://127.0.0.1:5001/skm-extension-official/us-central1/hypersearch_api/";
  
      const livePythonURL =
        "https://hypersearch-api-i7nkqebqsa-uc.a.run.app/normal_hypersearch";
  
      const liveStreamedPythonAPIBase =
        "https://hypersearch-api-i7nkqebqsa-uc.a.run.app/";
  
      const testMode = false;
      const apiUrl = testMode
        ? streamedTestPythonURL
        : liveStreamedPythonAPIBase;
  
      let data = {
        indexName: "video-embeddings",
        videoID: vid,
        query: query,
        subscribedToPro: subscribedToPro,
      };
  
      const response = await fetch(`${apiUrl}new_streamed_hypersearch`, {
        method: "POST",
        cache: "no-cache",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const reader = response.body.getReader();
  
      while (true) {
        setLoading(true);
        const { value, done } = await reader.read();
        const decodedValue = new TextDecoder().decode(value);
  
        if (done) {
          setLoading(false);
          break;
        }
        const responseData = JSON.parse(decodedValue);
  
        const { responseCode, data } = responseData;
  
        if (responseCode === "ERROR") {
          setError(data.errorMessage);
          console.error(data.errorMessage);
          alert(data.errorMessage);
          setLoading(false);
          break;
        } else if (responseCode === "SUCCESS") {
          // Process success response
        } else {
          console.log(responseData);
        }
      }
    } catch (error) {
      // Handle general errors
      console.error("An error occurred:", error);
      setError("Oops! An unexpected error occurred. Please try again or contact support.");
      setLoading(false);
    }
  }

  return (
    <div
      id="main-popup-hypersearch"
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
        onSubmit={handleSearch}
      />

      {upsertProgress !== -1 && upsertProgress !== 100 && loading && (
        <ProgressBar color="#e575e8" progress={upsertProgress} />
      )}

      {!error && !loading && results && results.length > 0 && (
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

          <div
            className="results-container"
            style={{ display: displayNone ? "none" : "block" }}
            ref={resultsContainerRef}
          >
            {showSummary && (
              <SummaryComponent
                style={{
                  transitionDelay: `${1 * 0.06}s`,
                  display: displayNone ? "none" : "block",
                }}
                className={`${showResults ? "show" : ""}`}
                content={summarizedResponse}
              />
            )}

            {results.map((item, index) => (
              <ResultComponent
                index={index}
                content={item.metadata.originalText}
                timeStamp={Math.floor(item.metadata.timeStamp)}
                query={globalQuery}
                key={item.id}
                dark={dark}
                style={{
                  transitionDelay: `${(index + 1) * 0.06}s`,
                  display: displayNone ? "none" : "block",
                }}
                className={`${showResults ? "show" : ""}`}
              />
            ))}
            <div
              className={`more-results ${theme}`}
              style={{ opacity: moreResultsOpacity }}
            ></div>
          </div>
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
