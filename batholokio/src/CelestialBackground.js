import React from 'react';

const CelestialBackground = () => {
  return (
    <div className="celestial-container">
      <div className="stars"></div>
      <div className="nebula"></div>
      <div className="planets">
        <div className="planet planet-1"></div>
        <div className="planet planet-2"></div>
        <div className="planet planet-3"></div>
        <div className="planet planet-4"></div>
      </div>
    </div>
  );
};

export default CelestialBackground;