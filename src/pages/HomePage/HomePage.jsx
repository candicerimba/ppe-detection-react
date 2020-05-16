// Design inspired from Appland Bootstrap: https://bootstrapmade.com/demo/Appland/
import React from "react";
import {Accordion, Card} from 'react-bootstrap';
import AOS from 'aos';

import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import construction from '../../image/construction.png';
import collaboration from '../../image/collaboration.svg';
import logistics from '../../image/logistics.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'aos/dist/aos.css';
import "./HomePage.css";

class HomePage extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      // Used to display FAQs
      cards: [{
        question: 'How do we use the project?',
        answer: <div>To start the project, you can either click on the "Start Detection" button at the top of the page, or the play button on the bottom right section of the screen. <br /><br />Once you're in the program, please make sure to allow camera access to the browser. Test it out by wearing a hard-hat and a high-vis vest and let it start!</div>
      },{
        question: 'Which PPE is being detected by the model?',
        answer: 'We have trained our model to only detect hard-hats and high-vis vests for now. However, you can easily substitute your own machine-learning model if you wish to identify more items!'
      },
      {
        question: 'What technology was used for this project?',
        answer: 'Our model is first trained with Tensorflow. It is then converted into a Tensorflow.JS format and hosted on a website created using React. '
      },
      {
        question: 'What can we do if we\'d like to modify the code for our use?',
        answer: <div>You can obtain the <a href="https://github.com/candicerimba/ppe-detection-react">source code</a> and run it on your local machine.</div>
      },
    ]
   };
  }

  componentDidMount() {
    // When component loaded, initialise AOS (Animate on Scroll)
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
    });
  }

  render() {
    return (
        <div className="content"> 
          <a href="/detection" className="detection-button" data-aos="fade-up"><PlayArrowIcon className="home-play-button"/></a>
          <div className="header-bar">
                <div className="header-text" data-aos="fade-up">
                    <div className="header-title">Show Me Your PPE</div>
                    <div className="header-subtitle">Improving workplace safety through machine learning</div>
                    <div className="start-btn-bar"><a className="start-btn" href="/detection">Start Detection</a></div>
                </div>
                <img src={construction} className="header-image" data-aos="fade-left"/>
            </div>
            <div className="info-bar" data-aos="fade-right">
              <img src={logistics} className="data-image left"/>
              <div className="info-text left">
                <div className="info-title">A Dangerous Problem</div>
                <div className="info-description">
                  In the manufacturing industry, casualties and accidents happen in workplaces every year.  
                  <br /><br /><i>Personal Protective Equipment (PPE)</i> like a helmet (hard-hat), safety-harness, and goggles play a very important role in ensuring the safety of workers. 
                  These equipment are critical to protect people from casualties and accidents.
                  <br /><br />However, due to the negligence of the workers and their supervisors, workplace accidents occuring from a lack of proper equipment still occur. Supervisors often don't monitor workplace safety consistently because such tasks can be seen as cumbersome.</div>
              </div>            
            </div>
            <div className="info-bar" data-aos="fade-left">
              <img src={collaboration} id="collaboration-pic" className="data-image right"/>
              <div className="info-text right">
                <div className="info-title">Our Project</div>
                <div className="info-description">
                  To combat this problem, we created a system backed by a trained machine learning model to automatically detect the use of correct PPE. 
                  <br /><br />This project aims to ensure that workers are wearing proper PPE before they enter the workplace. It can assist supervisors to monitor workers effectively by providing them with real-time alerts, without the need to be on-site all the time.
                  <br /><br />By developing this project, we hope that this eases the supervisors' burden of constant workplace monitoring, and allow them to focus on other aspects of workplace safety.
                </div>
              </div>
            </div>
            <div className="frequently-asked">
                <div className="frequently-asked-title" data-aos="fade-up">Frequently Asked Questions</div> 
                <div className="frequently-asked-description" data-aos="fade-up">You can know more about our project through this list of FAQs.</div>           
                <Accordion defaultActiveKey="0">
                  {this.state.cards.map((card, index)=>{return(
                  <Card className="frequently-asked-container" data-aos="fade-up" data-aos-delay={(index + 1) * 100}>
                    <Accordion.Toggle as={Card} variant="link" eventKey={index} className="frequently-asked-header">
                    <div className="q-icon-container left"><HelpOutlineIcon className="q-icon"/></div>
                    <div className="question-text left">{card.question}</div>
                    <div className="q-icon-container right"><ExpandMoreIcon className="q-icon"/></div>
                    </Accordion.Toggle>
                    <Accordion.Collapse eventKey={index}>
                      <Card.Body className="frequently-asked-answer">{card.answer}</Card.Body>
                    </Accordion.Collapse>
                  </Card>)})}
                </Accordion>
               
              </div>
            </div>
    );
  }
}

export default HomePage;