import React, { useState, useRef, useEffect, useContext } from "react";
import "./Searchbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import LoadingIcon from "./LoadingIcon";
import HamburgerMenu from "./HamburgerMenu";
import { AuthenticationContext } from "../../infrastructure/authentication/authentication.context";

import { faCrown } from "@fortawesome/free-solid-svg-icons";

const Searchbar = (props) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [extensionActive, setExtensionActive] = useState(false);

  const {
    userData,
    setUserData,
    subscribedToPro,
    searchesToday,
    setSearchesToday,
    freeLimit,
    limitReached,
    setLimitReached,
    isAdmin,
  } = useContext(AuthenticationContext);

  const [textareaHeight, setTextareaHeight] = useState("auto");

  const onChangeText = (e) => {
    setInputText(e.target.value);
    // inputRef.current.style.height = 'auto';
    if (e.target.value == "") {
      setTextareaHeight("auto");
    } else {
      setTextareaHeight(inputRef.current.scrollHeight);
    }
  };

  useEffect(() => {
    inputRef.current.style.border = "none";
    inputRef.current.style.borderWidth = "0";
    inputRef.current.style.fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";
  }, []);

  const handle = () => console.log("Enter pressed");
  


  return (
    <>
      {userData && (subscribedToPro) ? (
        <div style={{ width: "100%", marginBottom: 10 }}>
          <h4
            className="countTitle"
            style={{
              margin: 0,
              color: "#0a8ee6",
            }}
          >
            <div
              style={{
                background: "white",
                display: "inline-block",
                borderRadius: 3,
                padding: 3,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background:
                    "linear-gradient(to bottom right, #BA63E7 0%,#8903f7 20%,#ee07d3 40%,#0a8ee6 70%,#0d91de 80%,#0033ff 90%,#0033ff 60%,#BA63E7 100%)",
                  WebkitBackgroundClip: "text",

                  WebkitTextFillColor: "transparent",
                }}
              >
                <FontAwesomeIcon icon={faCrown} color="#C50CE0" /> HyperSearch
                Pro:{" "}
              </div>
            </div>{" "}
            Enjoy unlimited searches!
          </h4>
        </div>
      ) : (
        <div style={{ width: "100%", marginBottom: 10 }}>
          <h4
            className="countTitle"
            style={{
              margin: 0,
              color: "#688EF9",
            }}
          >
            {limitReached ? (
              <div style={{fontSize: '120%', fontWeight: 500}}>
                You've reached your daily search limit.
                
              </div>
            ) : (
              <div style={{fontSize: '120%', fontWeight: 500}}>
              {`You have ${freeLimit - searchesToday} search${
                freeLimit - searchesToday !== 1 ? "es" : ""
              } remaining for today`}
              </div>
            )}
                <div style={{fontSize: '120%', marginTop: 5, fontWeight: 500}}>
                Upgrade to{" "}
                <div
                  style={{
                    display: "inline-block",
                    background:
                      "linear-gradient(to bottom right, #BA63E7 0%,#8903f7 20%,#ee07d3 40%,#0a8ee6 70%,#0d91de 80%,#0033ff 90%,#0033ff 60%,#BA63E7 100%)",
                    WebkitBackgroundClip: "text",

                    WebkitTextFillColor: "transparent",
                    fontWeight: 700
                  }}
                >
                  <FontAwesomeIcon icon={faCrown} color="#C50CE0" /> HyperSearch
                  Pro{" "}
                </div>{" "}
                {limitReached ? 'to continue searching!' : 'for unlimited searches!'}
                </div>
          </h4>
        </div>
      )}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          background: "white",
          borderRadius: 20,
          border: "none",
          position: "relative",
          zIndex: 1,
          // boxShadow: 'rgba(0,0,0,0.5) 0px 0px 8px 0px',
          marginBottom: 10,
        }}
        ref={containerRef}
        className="searchbar"
      >
        <div
          style={{
            background: "rgba(255,255,255,0.3)",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            borderRadius: 20,
            border: "none",
            position: "relative",
            zIndex: 1,
            boxShadow: "rgba(0, 0, 0, 0.5) 0px 0px 10px 0px",
          }}
        >
          <button
            style={{
              background: "transparent",
              padding: 0,
              border: "none",
              display: "flex",
              alignItems: "center",
              // cursor: "pointer",
              outline: "none",
              justifyContent: "center",
              width: props.active ? 35 : 60,
            }}
            onClick={() => {
              // if (!props.active) {
              //   inputRef.current.focus();
              // }
              // props.onToggleActive();
            }}
          >
            {props.loading ? (
              <div style={{ marginLeft: 5, marginTop: 3 }}>
                <LoadingIcon color="#ffffff" size={30} thickness={15} />
              </div>
            ) : (
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                size={props.active ? 20 : 20}
                style={{
                  width: props.active ? 20 : 20,
                  height: props.active ? 20 : 20,
                  color: props.active
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(255, 255, 255, 0.8)",
                  justifySelf: "center",
                  alignSelf: "center",
                  marginLeft: 12,
                  // marginTop: props.active ? 13 : 12,
                  transition: "1s",
                }}
              />
            )}
          </button>
          <textarea
            name="text"
            id="hypersearch-textarea"
            type="text"
            ref={inputRef}
            rows="1"
            autoFocus
            style={{
              width: "100%",
              height: 45,
              // lineHeight: textareaHeight,
              marginRight: 10,
              boxSizing: "border-box",
              resize: "none",
              maxHeight: 200,
              whiteSpace: "nowrap",
              overflowX: "scroll" /* or hidden */,
              overflowY: "hidden",
              padding: 10,
              paddingLeft: 5,
              paddingTop: 12.5,
              fontSize: 16,
              background: "transparent",
              border: "0px none !important",
              outline: "none",
              transition: "0.1s",
              color: "white",
              fontFamily:
                "CohereHeadline, CohereVariable, CircularRegular !important",
              fontWeight: 600,
            }}
            placeholder="HyperSearch this video"
            value={inputText}
            onKeyDown={(e) => {
              console.log(e.key);
              if (e.key == "Enter") {
                e.preventDefault();
                if (!props.loading) {
                  if (inputText) {
                    if (subscribedToPro) {
                      props.onSubmit(inputText);
                    } else {
                      if (isAdmin) {
                        props.onSubmit(inputText);
                      } else {
                        if (searchesToday < freeLimit) {
                          props.onSubmit(inputText);
                        } else {
                          setLimitReached(true);
                        }
                      }
                    }
                  }
                }
              } else if (e.key === "Backspace") {
                setTextareaHeight("auto");
              }
            }}
            onChange={onChangeText}
          />
          <HamburgerMenu />
        </div>
      </div>
    </>
  );
};

export default Searchbar;
