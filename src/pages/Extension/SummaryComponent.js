import React, { useEffect, useRef, useContext } from "react";
import "./ResultComponent.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { ColorThemeContext } from "./Extension";
import './SummaryComponent.css'

const SummaryComponent = (props) => {
  const { dark } = useContext(ColorThemeContext);
  // console.log(props.dark);

  return (
    <div
      style={{
        width: "100%",
        background: "transparent",
        // minHeight: 100,
        borderRadius: 0,
        boxSizing: "border-box",
        padding: 15,
        ...props.style,
      }}
      className={`summaryComponent ${props.className}`}
    >
      <h3 className="summarized-response-title">Summarized Response</h3>
      <div style={{ display: "inline" }}>
        <p
          style={{
            color: "#598AEE",
            display: "inline",
            fontFamily: "CohereText !important",
          }}
        >
          {props.content}
        </p>
      </div>
    </div>
  );
};

export default SummaryComponent;
