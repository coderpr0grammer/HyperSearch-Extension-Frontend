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
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../utils/firebaseConfig";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";
import ProgressBar from "./ProgressBar";

const Youtube = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [extensionActive, setExtensionActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [dark, setDark] = useState(false);
  const [displayNone, setDisplayNone] = useState(true);
  const [globalQuery, setGlobalQuery] = useState("");
  const [upsertProgress, setUpsertProgress] = useState(0);
  const extensionContainerRef = useRef(null);
  const errorContainer = useRef(null);
  const divRef = useRef(null);

  const { dark, setDark } = useContext(ColorThemeContext);
  const {
    user,
    setUser,
    subscribedToPro,
    userData,
    updateUserData,
    getUserData,
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

          const urlParams = new URLSearchParams(
            new URL(window.location.href).search
          );

          const vid = urlParams.get("vid");

          let data = {
            indexName: "video-embeddings",
            videoID: vid,
            query: query,
          };

          const url = "https://streamedembedandupsert-i7nkqebqsa-uc.a.run.app/";

          const urlTest =
            "http://127.0.0.1:5001/skm-extension-official/us-central1/streamedEmbedAndUpsert";

          fetch(url, {
            method: "POST",
            cache: "no-cache",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify(data),
          })
            .then(async (res) => {
              const reader = res.body.getReader();

              while (true) {
                setLoading(true);
                const { value, done } = await reader.read();

                if (done) {
                  setLoading(false);
                  break;
                }

                const response = JSON.parse(new TextDecoder().decode(value));

                const { responseCode, data } = response;

                console.log(response);

                if (responseCode === "ERROR") {
                  setError(response.data.errorMessage);
                  // alert(response.data.errorMessage);
                  setLoading(false);
                  break;
                } else if (responseCode === "SUCCESS") {
                  if (data.percentage) {
                    //still in progress
                    console.log("progress: ", data.percentage);
                    setUpsertProgress(data.percentage);
                  } else if (data.searchResult) {
                    console.log(data.searchResult);
                    setResults(data.searchResult.matches);

                    setDisplayNone(false);

                    setTimeout(() => {
                      setLoading(false);
                      setShowResults(true);
                    }, 300);
                  }
                }
              }
            })
            .catch((err) => {
              console.error("error fetching api: ", err);
              setError(
                "We had trouble processing this video. Please try again later or contact support at danielgorg9@gmail.com. Sorry for the inconvenience!"
              );
              setLoading(false);
            });

          // fetch(
          //   "http://127.0.0.1:5001/skm-extension-official/us-central1/youtubeTranscript/",
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify(json),
          //   }
          // )
          //   .then(async (response) => {
          //     if (!response.ok) {
          //       const errResponse = await response.json()
          //       throw new Error("Network response was not ok." + '\nError code ' + response.status + '\n' +  errResponse.response
          //       );
          //     }
          //     return response.json();
          //   })
          //   .then((data) => {
          //     if (data == "TranscriptError") {
          //       setError("Subtitles not available or video is restricted");
          //     } else if (data == "LengthError") {
          //       setError(
          //         "Unfortunately for our Beta release we can't Skm videos cannot be longer than 2 hours"
          //       );
          //       console.log(error);
          //     } else if (data == "ApiError") {
          //       setError(
          //         "We had trouble processing this video. Please try again."
          //       );
          //     } else {
          //       setResults(data.results.matches);
          //       setDisplayNone(false);

          //       console.log('userData, ', userData)

          //       updateUserData({searchesToday: searchesToday + 1, lifetimeSearches: lifetimeSearches + 1})
          //       setSearchesToday(searchesToday+1);

          //       if (freeLimit - searchesToday < 1 && !isAdmin) {
          //         setLimitReached(true)
          //       }

          //       getUserData(user)

          //       setTimeout(() => {
          //         setLoading(false);
          //         setShowResults(true);
          //       }, 300);
          //     }

          //     setLoading(false);
          //   })
          //   .catch(function (error) {
          //     setLoading(false);
          //     // setError(error);
          //     console.error(error);
          //     setError(
          //       "This video took a bit longer to process so please press Enter again to try and get results. If that doesn't work, we're probably experiencing issues with our servers."
          //     );
          //   });

          // console.log(windowFind(query));
        }}
      />
      {upsertProgress !== 0 && upsertProgress !== 100 && (
        <ProgressBar color="#A5DDD7" progress={upsertProgress} />
      )}

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
              content={item.metadata.originalText}
              timeStamp={Math.floor(item.metadata.timeStamp / 1000)}
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
