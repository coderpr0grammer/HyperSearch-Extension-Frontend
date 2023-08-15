import React, { useState, useRef } from 'react';
import './Searchbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const Searchbar = (props) => {
  const onChangeText = (e) => {
    setInputText(e.target.value)
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height =
      (inputRef.current.scrollHeight - 42) % 16 == 0
        ? inputRef.current.scrollHeight - 16 + 'px'
        : inputRef.current.scrollHeight + 'px';
  };

  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);


  return (
    <>
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'row', background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        border: 'none',
      }}
        ref={containerRef}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#ffffff", justifySelf: 'center', marginLeft: 10, marginTop: 13 }} />

        <textarea
          name="text"
          id="text"
          type="text"
          ref={inputRef}
          rows="1"
          autoFocus
          style={{
            width: '100%',
            resize: 'none',
            maxHeight: 200,
            overflowY: 'auto',
            padding: 10,
            fontSize: 16,
            background: 'transparent',
            borderRadius: 20,
            border: 'none',
            outline: 'none',
            transition: '1s'
          }}
          placeholder="Search for anything."
          value={inputText}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              props.onSubmit(inputText)
            }
          }}
          onFocus={() => containerRef.current.style.boxShadow = "rgba(0,0,0,0.5) 0px 0px 20px 0px"}
          onBlur={() => {
            containerRef.current.style.boxShadow = "rgba(0,0,0,0.0) 0px 0px 20px 0px"
          }}
          onChange={onChangeText}
        />

      </div>


    </>
  );
};

export default Searchbar;
