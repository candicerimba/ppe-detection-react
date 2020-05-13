import React from "react";

import construction from '../../image/construction.svg'
import "./HomePage.css";

class HomePage extends React.Component {
  render() {
    return (
        <div className="content"> 
            <div className="header-bar">
                <div className="header-text">
                    <div className="header-title">Show Me Your PPE</div>
                    <div className="header-subtitle">Improving workplace safety through machine learning</div>
                    <div className="start-btn-bar"><a className="start-btn" href="/detection">Start Detection</a></div>
                </div>
                <img src={construction} className="header-image"/>
            </div>
        </div>
    );
  }
}

export default HomePage;