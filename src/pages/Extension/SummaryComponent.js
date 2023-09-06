import React, { useEffect, useRef, useContext } from 'react';
import './ResultComponent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { ColorThemeContext } from './Extension';

const SummaryComponent = (props) => {
  const { dark } = useContext(ColorThemeContext);
  // console.log(props.dark);

  return (
    <div
      style={{
        width: '100%',
        background: 'transparent',
        minHeight: 100,
        borderRadius: 0,
        boxSizing: 'border-box',
        padding: 15,
        ...props.style,
      }}
      className={`responseComponent ${props.className}`}
    >
        <h4 className="summarized-response-title">Summarized Response</h4>
      <div style={{ display: 'inline' }}>
        <p style={{ color: '#598AEE', display: 'inline', fontFamily: 'CohereText !important'}}>{props.content}</p>
      </div>
    </div>
  );
};

export default SummaryComponent;
