import React, { useEffect, useRef, useContext } from 'react';
import './ResultComponent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { ColorThemeContext } from './Extension';

const ResultComponent = (props) => {
  const { dark } = useContext(ColorThemeContext);
  console.log(props.dark);

  const player = useRef(null);

  function extractTimeFromYoutubeUrl(url) {
    const regex = /[?&]t=(\d+)/;
    const match = url.match(regex);
    if (match) {
      const timeInSeconds = parseInt(match[1]);
      return timeInSeconds;
    }
    return null;
  }

  // const boldenWordInString = (words, paragraph) => {
  //   let output = '';
  //   paragraph.split(' ').map((word) => {
  //     let match = false;
  //     // console.log(word)
  //     words.forEach((wordQuery) => {
  //       // console.log(wordQuery)
  //       if (word.toLowerCase() == wordQuery.toLowerCase()) {
  //         output += `<strong>${word}</strong> `;
  //         match = true;
  //       }
  //     });
  //     if (match == false) {
  //       output += word + ' ';
  //     }
  //   });
  //   return output;
  // };

  // useEffect(() => {
  //   const video = document.querySelector('video');

  //   if (video) {
  //     // do something with the video element
  //     console.log('Video element found:', video);
  //     player.current = video;
  //   } else {
  //     console.error('VIDEO ELEMENT NOT FOUND');
  //   }
  // }, []);

  function convertSecondsToTimestamp(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const remainingSeconds = seconds % 60;
  
    const formatUnit = (unit) => (unit < 10 ? `0${unit}` : unit);
  
    const timestamp = [];
    if (days > 0) {
      timestamp.push(`${formatUnit(days)}:`);
    }
    if (hours > 0 || days > 0) {
      timestamp.push(`${formatUnit(hours)}:`);
    }
    timestamp.push(`${formatUnit(minutes)}:${formatUnit(remainingSeconds)}`);
  
    return timestamp.join('');
  }


  const handleButtonClick = () => {
    const video = document.querySelector('video');

   const seconds = props.timeStamp;

    // console.log(video.currentTime = seconds);

    window.parent.postMessage({"type": "jumpToTime", seconds}, "*");
  };


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
      onClick={handleButtonClick}
    >
      <div style={{ display: 'inline' }}>
        <div className={`playButton ${dark ? 'dark' : 'light'}`}>
          <FontAwesomeIcon
            icon={faPlay}
            style={{
              color: 'inherit',
              width: 8,
              height: 8,
            }}
          />
          &nbsp;
          {convertSecondsToTimestamp(props.timeStamp)}
        </div>
        <p style={{ color: '#598AEE', display: 'inline', fontFamily: 'CohereText !important'}}>{props.content}</p>
      </div>
    </div>
  );
};

export default ResultComponent;
