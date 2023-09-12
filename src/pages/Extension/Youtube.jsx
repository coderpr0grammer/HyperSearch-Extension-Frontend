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

const Youtube = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [extensionActive, setExtensionActive] = useState(false);
  // const [idToken, setIdToken] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("");
  // const [dark, setDark] = useState(false);
  const [displayNone, setDisplayNone] = useState(true);
  const [globalQuery, setGlobalQuery] = useState("");
  const [upsertProgress, setUpsertProgress] = useState(0);
  const [summarizedResponse, setSummarizedResponse] = useState("");
  const [moreResultsOpacity, setMoreResultsOpacity] = useState(1);
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
        onSubmit={async (query) => {
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

          const urlTest =
            "http://127.0.0.1:5001/skm-extension-official/us-central1/hypersearch/normal_hypersearch";

          const testPythonURL =
            "http://127.0.0.1:5001/skm-extension-official/us-central1/hypersearch_api/normal_hypersearch";

          const livePythonURL =
            "https://hypersearch-api-i7nkqebqsa-uc.a.run.app/normal_hypersearch";

          let data = {
            indexName: "video-embeddings",
            videoID: vid,
            query: query,
            subscribedToPro: subscribedToPro,
          };

          fetch(livePythonURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
          })
            .then((res) => res.json())
            .then(async (response) => {
              console.log(response);
              const { responseCode, data } = response;

              if (responseCode == "ERROR") {
                setError(response.data.errorMessage);
                setLoading(false);
                return;
              } else if (responseCode == "SUCCESS") {
                if (data.searchResult) {
                  console.log(response);

                  setSummarizedResponse(data.summarizedResponse);

                  console.log(data.searchResult.matches[0].metadata.timeStamp);
                  setResults(data.searchResult.matches);

                  setDisplayNone(false);

                  setTimeout(() => {
                    setLoading(false);
                    setShowResults(true);
                  }, 300);

                  const userRef = doc(db, "users", user.uid);

                  const update = await updateDoc(userRef, {
                    searchesToday: increment(1),
                    lifetimeSearches: increment(1),
                  });

                  setSearchesToday(searchesToday + 1);

                  if (freeLimit - searchesToday < 1 && !isAdmin) {
                    setLimitReached(true);
                  }

                  // getUserData2()
                }
              }
            })
            .catch((err) => {
              setLoading(false);
              console.error(err);
              setError(err);
              setDisplayNone(false);
            });

          // fetch(pythonURL, {
          //   method: "POST",
          //   // cache: "no-cache",
          //   // keepalive: true,
          //   headers: {
          //     "Content-Type": "application/json",
          //     Accept: "text/event-stream",
          //     Authorization: `Bearer ${idToken}`,
          //   },
          //   body: JSON.stringify(data),
          // })
          //   .then(async (res) => {
          //     const reader = res.body.getReader();

          //     while (true) {
          //       setLoading(true);
          //       const { value, done } = await reader.read();

          //       if (done) {
          //         setLoading(false);
          //         break;
          //       }

          //       const response = JSON.parse(new TextDecoder().decode(value));

          //       const { responseCode, data } = response;

          //       console.log(response);

          //       if (responseCode === "ERROR") {
          //         setError(response.data.errorMessage);
          //         // alert(response.data.errorMessage);
          //         setLoading(false);
          //         break;
          //       } else if (responseCode === "SUCCESS") {
          //         if (data.percentage) {
          //           //still in progress
          //           console.log("progress: ", data.percentage);
          //           setUpsertProgress(data.percentage);
          //         } else if (data.searchResult) {
          //           console.log(data);

          //           setSummarizedResponse(data.summarizedResponse);
          //           setResults(data.searchResult.matches);

          //           setDisplayNone(false);

          //           setTimeout(() => {
          //             setLoading(false);
          //             setShowResults(true);
          //           }, 300);

          //           const userRef = doc(db, "users", user.uid);

          //           const update = await updateDoc(userRef, {
          //             searchesToday: increment(1),
          //             lifetimeSearches: increment(1),
          //           });

          //           setSearchesToday(searchesToday + 1);

          //           if (freeLimit - searchesToday < 1 && !isAdmin) {
          //             setLimitReached(true);
          //           }

          //           // getUserData2()
          //         }
          //       }
          //     }
          //   })
          //   .catch(async (err) => {
          //     console.error("error fetching api: ", err);

          //     const deleteVectors = await fetch(
          //       "http://127.0.0.1:5001/skm-extension-official/us-central1/hypersearch/deleteVectors",
          //       {
          //         method: "POST",
          //         cache: "no-cache",
          //         headers: {
          //           "Content-Type": "application/json",
          //           Authorization: `Bearer ${idToken}`,
          //         },
          //         body: JSON.stringify({
          //           videoID: vid,
          //         }),
          //       }
          //     );

          //     console.log("deletevectors: ", deleteVectors);

          //     setError(
          //       "We had trouble processing this video. Please try again later or contact support at danielgorg9@gmail.com. Sorry for the inconvenience!"
          //     );
          //     setLoading(false);
          //   });
        }}
      />
      {upsertProgress !== 0 && upsertProgress !== 100 && (
        <ProgressBar color="#e575e8" progress={upsertProgress} />
      )}

      {!error && results && results.length > 0 && (
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
            {/* <SummaryComponent
              style={{
                transitionDelay: `${1 * 0.06}s`,
                display: displayNone ? "none" : "block",
              }}
              className={`${showResults ? "show" : ""}`}
              content={summarizedResponse}
            /> */}

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
