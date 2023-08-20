import React, { useState } from 'react';
// import logo from '../../assets/img/logo.svg';
// import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';
// import { Button } from 'react-bootstrap';
// import image from '../../assets/img/icon-128.png';
// import ResultComponent from './ResultComponent';
// import Searchbar from './Searchbar';
import LoginUI from '../../assets/loginUI.png'
import SearchbarPicture from '../../assets/Searchbar.png'
// import ResultSnapshot1 from '../../assets/img/ResultSnapshot1.png';
import ResultSnapshot from '../../assets/ResultSnapshotHyperSearch.png';


const Popup = () => {
  const [results, setResults] = useState([1, 2, 3, 4, 5, 6]);

  return (
    <div
      className="App2"
      style={{
        border: 'solid 8px',
        borderWidth: 8,
        background: '#282c34',
        overflowY: 'scroll',
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box',
        borderImage:
          'conic-gradient(from 90deg at 40% -25%,#ff7e00,#8903f7,#ee07d3,#0a8ee6,#0d91de,#1092d6,#03f,#00cfa4,#cf1261,#d61039,red,#ee6907,#f59b01,gold,gold,#cf6464) 1',
      }}
    >
      <h4

        className="popup-gradient-title"
        style={{
          fontFamily: "monospace, 'Expletus Sans', Roboto !important",
          background:
            '#10CCA3',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 0
        }}
      >
        Welcome to {/*<strong style={{ textDecoration: 'underline' }}>ai</strong>{' '}/*/}
      </h4>
      <h1
        className="popup-gradient-title"

        style={{
          fontFamily: "monospace, 'Expletus Sans', Roboto !important",
          background:
            'conic-gradient(from 90deg at 40% -25%,#ff7e00,#8903f7,#ee07d3,#0a8ee6,#0d91de,#1092d6,#03f,#00cfa4,#cf1261,#d61039,red,#ee6907,#f59b01,gold,gold,#cf6464)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginTop: 0,
          marginBottom: 0,
          fontWeight: 800,
        }}
      >
        {'HyperSearch'}

      </h1>
      <h4
        className="popup-gradient-title"

        style={{
          marginTop: 5,
          fontWeight: 800,
          fontFamily: "monospace, 'Expletus Sans', Roboto",
          background:
            '#10CCA3',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Get ready to search like never before! {/*<strong style={{ textDecoration: 'underline' }}>ai</strong>{' '}/*/}
      </h4>

      <ol style={{ textAlign: 'left' }}>
        <li>Hop on any video on Youtube</li>
        <li>Continue with your Google Account<img src={LoginUI} style={{ borderRadius: 12, width: '90%', marginTop: 5 }} /></li>
        <li>Search for anything as you would ask a person!
          <br></br>
          <img src={SearchbarPicture} style={{ height: 60, borderRadius: 20, marginLeft: -15 }} />
          <br></br>
          You'll get the top relevant results in the video, even if it never mentions the words in your search!
          <br></br>
          <img src={ResultSnapshot} style={{ width: '90%', marginTop: 10, marginBottom: 10, }} />
          <br></br>
          Just click the result and it will take you to the relevant timestamp!
        </li>

      </ol>

      <hr style={{
        display: 'block',
        height: 1,
        border: 0,
        borderTop: '1px solid rgba(255,255,255,.1)',
        margin: '1em 0',
        padding: 0
      }}></hr>

      <h4
        className="popup-gradient-title"

        style={{
          marginTop: 5,
          fontWeight: 800,
          marginBottom: 5,
          fontFamily: "monospace, 'Expletus Sans', Roboto",
          background:
            '#10CCA3',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Thank you for downloading the HyperSearch Extension! {/*<strong style={{ textDecoration: 'underline' }}>ai</strong>{' '}/*/}
      </h4>
      <small
        className="popup-gradient-title"

        style={{
          marginTop: 5,
          fontSize: '90%',
          fontWeight: 800,
          fontFamily: "monospace, 'Expletus Sans', Roboto",
          background:
          "conic-gradient(from 90deg at 40% -25%,#ff7e00,#8903f7,#ee07d3,#0a8ee6,#0d91de,#1092d6,#03f,#00cfa4,#cf1261,#d61039,red,#ee6907,#f59b01,gold,gold,#cf6464)",
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        made with 🩵 from the SkmAI team {/*<strong style={{ textDecoration: 'underline' }}>ai</strong>{' '}/*/}
      </small>


    </div >
  );
};

export default Popup;
