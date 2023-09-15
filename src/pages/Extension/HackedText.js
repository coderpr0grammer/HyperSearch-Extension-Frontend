import { useEffect, useState, useRef } from "react";
import "./HackedText.css";

const HackedText = (props) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const [text, setText] = useState(props.text);
  const textRef = useRef(null)
  const originalText = useRef(props.text)

  useEffect(() => {
    let interval = null;

    textRef.current.onmouseover = (event) => {
      let iteration = 0;

      clearInterval(interval);

      interval = setInterval(() => {
        setText(originalText.current
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return originalText.current[index];
            }

            return letters[Math.floor(Math.random() * 26)];
          })
          .join(""))

        if (iteration >= originalText.current.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 10);
    };
  }, [text]);
  

  return (
    <h4 className="hackedText" ref={textRef}>
      {text}
    </h4>
  );
};

export default HackedText;
