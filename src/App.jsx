import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import HomePage from './pages/HomePage/HomePage'
import Detection from './pages/Detection/Detection'

export class App extends Component {
  componentDidMount(){
    document.title = "Show Me Your PPE";
  }

  render() {
    // React-router helps to create links for each page. 
    return (
      <Router>
        <Switch>
            <Route path="/" exact component={HomePage} />
            <Route path="/detection" exact component={Detection} />
        </Switch>
      </Router>
    );
  }
}

export default App;