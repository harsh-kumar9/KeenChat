// React component with 4 buttons to navigate to different routes

import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navigation.css";

function Navigation() {
  return (
    <div className="navigation">
      <Link to="/KeenChat/all-voice" className="routeButton">
        All Voice
      </Link>
      <Link to="/KeenChat/all-text" className="routeButton">
        All Text
      </Link>
      <Link to="/KeenChat/all-voice-develop" className="routeButton">
        All Voice (Develop)
      </Link>
      <Link to="/KeenChat/all-text-develop" className="routeButton">
        All Text (Develop)
      </Link>
    </div>
  );
}

export default Navigation;
