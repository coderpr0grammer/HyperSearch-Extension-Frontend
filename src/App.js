import React, { useState, useEffect, useCallback, useRef } from 'react'
import logo from './logo.svg';
import './App.css';
import AuthenticationContextProvider from './infrastructure/authentication/authentication.context';
import RoutesTree from './RoutesTree';

function App() {
  
  const AppRef = useRef(null);
  const [prevHeight, setPrevHeight] = useState(null);

  
  const handleResize = useCallback((entries) => {

    const height = entries[0].target.offsetHeight;

      window.parent.postMessage({"type": "resize", height}, "*");
    
    setPrevHeight(height);
  }, [prevHeight]);

  useEffect(() => {
    const observer = new ResizeObserver(handleResize);
    observer.observe(AppRef.current);
    return () => observer.disconnect();
  }, [handleResize]);
  

  return (
    <AuthenticationContextProvider>
      <div className="App" ref={AppRef}>
        <RoutesTree />
      </div>
    </AuthenticationContextProvider>
  );
}

export default App;
