import React from 'react';
import './ResultComponent.css';

const ResultComponent = () => {
  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.05)',
        minHeight: 100,
        borderRadius: 10,
        marginBottom: 20,
      }}
      className="responseComponent"
    >
      <div className="text1"></div>
      <div className="text2"></div>
      <div className="text3"></div>
    </div>
  );
};

export default ResultComponent;
