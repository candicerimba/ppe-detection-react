// DEMO: https://codesandbox.io/s/z364noozrm
import React from "react";
import Loader from 'react-loader';
import ReactTooltip from 'react-tooltip';
import PauseOutlinedIcon from '@material-ui/icons/PauseOutlined';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { ToastContainer, toast } from 'react-toastify';  
import SweetAlert from 'sweetalert2-react';

import logo from '../../image/ppe.png';
import 'react-toastify/dist/ReactToastify.css';
import "./Detection.css";

const tf = require("@tensorflow/tfjs");

// Detection classes of the model
// item: Name of the item
// color: the color that should be used to draw it
// helmet/vest: true if it is a helmet/vest, false if it is not a helmet/vest 
const classes = [
  {item: "helmet", color: "#F8962B", helmet: true}, 
  {item:"no helmet", color:"#FE0000", helmet: false}, 
  {item: "vest", color: "#22EE5B", vest: true},
  {item: "no vest", color: "#51C1B1", vest: false}];

const MAX_HEIGHT = 0.80 * window.innerHeight;

toast.configure();

class Detection extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  constructor(props){
    super(props);
    this.state = {
      model: null,
      run: false,
      width: 640,
      height: 480,
      webcamStart: false,
      helmetExistence: false,
      vestExistence: false,
      hasDetected: false,
      help: false,
    }
    this.stopModel = this.stopModel.bind(this);
    this.startModel = this.startModel.bind(this);
  }

  componentDidMount() {
    // Obtains the user's camera stream.
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user"
          }
        })
        .then(stream => {
          window.stream = stream;
          // Find ratio to ensure height of camera stream displayed cannot go over MAX_HEIGHT (80% of the full screen height)
          const ratio = MAX_HEIGHT / stream.getTracks()[0].getSettings().height;
          this.setState({
            width: stream.getTracks()[0].getSettings().width * ratio,
            height: stream.getTracks()[0].getSettings().height * ratio,
          });
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });
      
      // Load the model file from the host
      const modelPromise = tf.loadGraphModel('https://cors-anywhere.herokuapp.com/https://tensorflowfyp.s3-ap-southeast-2.amazonaws.com/model.json',
      {
        credentials: 'include',
        mode: 'no-cors', // no-cors, *cors, same-origin
      }).then((model)=>{
        this.setState({
          // Save the loaded model into state
          model: model,
          run: true,
        })
      });

      // Obtain the loaded model and the camera stream, if done, can start detecting objects
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectObjects();
        })
        .catch(error => {
          console.error(error);
        });
   }
  }

  // Run when pause button is clicked
  stopModel(){
    this.setState({run: false});
    const stop = document.getElementById("stop-btn");
    const start =  document.getElementById("start-btn");
    if (stop) stop.style.display = 'none';
    if (start) start.style.display = 'inline-block';
  }

  // Run when play button is clicked
  startModel(){
    this.setState({run: true});
    const stop = document.getElementById("stop-btn");
    const start =  document.getElementById("start-btn");
    if (stop) stop.style.display = 'inline-block';
    if (start) start.style.display = 'none';
  }

  async detectObjects () {
    if (this.state.model === null) return;  // If model isn't even loaded yet, don't try to detect any object
    
    // Only go through with detection when the model is running
    if (this.state.run) {                   
      // Obtain all the predictions, and call a function to draw them
      const tfImg = tf.browser.fromPixels(this.videoRef.current);
      const smallImg = tf.image.resizeBilinear(tfImg, [300, 300]); // 600, 450
      const resized = tf.cast(smallImg, 'float32');
      const tf4d = tf.tensor4d(Array.from(resized.dataSync()), [1, 300, 300, 3], 'int32'); // 600, 450
      let predictions = await this.state.model.executeAsync({ image_tensor: tf4d }, ['detection_boxes', 'num_detections', 'detection_classes', 'detection_scores']);
      
      this.renderPredictions(predictions[0].dataSync(), predictions[1].dataSync(), predictions[2].dataSync(), predictions[3].dataSync())
      tfImg.dispose();
      smallImg.dispose();
      resized.dispose();
      tf4d.dispose();
    }

    // Keep calling itself to continue object detection 
    requestAnimationFrame(() => {
      this.detectObjects()
    })
  }

  // Creates alert with title and description as arguments
  toast(title, description){
    const text = ({closeToast}) => {return (
      <div style={{paddingLeft: '10%'}}>
        <b>{title}</b><br/>
        {description}
      </div>
    )}

    const rightOptions = {
      closeOnClick: false,
      closeButton: false,
      pauseOnFocusLoss: false,
      pauseOnHover: false,

      // When the notification appears, keep playing the audio
      // Notification is set to autoclose in 5 seconds.
      // After 5 seconds have passed and notification is closed, stop playing audio.
      onOpen: () => {
        this.audioRight.play();
        setTimeout(()=>{
        this.audioRight.pause();
          this.setState({
            hasDetected: false,
            vestExistence: false,
            helmetExistence: false,
          });
        }, 5000);
      }
    };

    // We only want one notification max on the screen
    // Only create notification if there's no other notification open
    if ((this.state.helmetExistence === true && this.state.vestExistence === true) && !this.state.hasDetected){
      this.setState({hasDetected: true});
      toast.success(text, rightOptions);
    }
  }

  // Draws predictions 
  renderPredictions (predictionBoxes, totalPredictions, predictionClasses, predictionScores){
     const ctx = this.canvasRef.current.getContext('2d')                // get the context of canvas
     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)           // clear the canvas
    if (!this.state.webcamStart) this.setState({webcamStart: true});    // draw results

    // If the model isn't running, don't bother drawing.
    if(this.state.run === false) return;

    let vest = false;
    let helmet = false;

    // Go through all the predictions, look for a vest/helmet in the frame.
    for (let i = 0; i < totalPredictions[0]; i++) {
      const minY = predictionBoxes[i * 4] * this.state.height;
      const minX = predictionBoxes[i * 4 + 1] * this.state.width;
      const maxY = predictionBoxes[i * 4 + 2] * this.state.height;
      const maxX = predictionBoxes[i * 4 + 3] * this.state.width;
      const score = predictionScores[i * 3] * 100;
      const item = classes[predictionClasses[i] - 1];
      const predictionString = score.toFixed(1)+" - "+item.item;

      // Only accept this prediction if its above our score treshold
      if (score > 30) {        
        if (item.hasOwnProperty('helmet') && item.helmet) {helmet = true};
        if (item.hasOwnProperty('vest') && item.vest) {vest = true};

        const color = item.color;
        this.drawBox(minX, minY, maxX, maxY, color, predictionString);
      }
    }
    
    // If there's a helmet in the current frame
    if (helmet){
      this.setState({helmetExistence: true});
      // Upon detecting a helmet, make it remember theres a helmet for 4 seconds
      setTimeout(() => this.setState({helmetExistence: false}), 4000);
    }

    // If there is a vest in the current frame
    if (vest){
      this.setState({vestExistence: true});
      setTimeout(() => this.setState({vestExistence: false}), 4000);
    }

    if (this.state.helmetExistence === true && this.state.vestExistence === true){
      this.toast("ACCESS GRANTED!", "Welcome in!");
    }
  };

  // Draws a detection box by obtaining its coordinate, its color, and its corresponding text
  drawBox(minX, minY, maxX, maxY, color, text){
    const ctx = this.canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.rect(minX, minY, maxX - minX, maxY - minY)
    ctx.lineWidth = 4
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.textBaseline = "top";
    ctx.font = '16px sans-serif'
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(ctx.font, 10); // base 10
    ctx.fillRect(minX, minY, textWidth + 4, textHeight + 4);

    ctx.shadowColor = 'white'
    ctx.fillStyle = 'white';
    ctx.fillText(text, minX, minY);
  }

  render() {
    return (
      <div> 
        <audio loop ref={r => this.audioRight = r}>
          <source
            src="https://freesound.org/data/previews/131/131660_2398403-lq.mp3"
            type="audio/mpeg"
          />
        </audio>
        <header>
        <a href="/">
          <img src={logo} alt="logo"/>
          <div className="title">S H O W&nbsp;&nbsp;&nbsp;&nbsp;M E&nbsp;&nbsp;&nbsp;&nbsp;Y O U R&nbsp;&nbsp;&nbsp;&nbsp;P P E </div>
          <div className="subtitle">Improving workplace safety through machine learning</div>
        </a>
        </header>
        <ToastContainer />
        <div className="video">
        <video
            autoPlay
            playsInline
            muted
            className="vid-and-canvas"
            ref={this.videoRef}
            width={this.state.width}
            height={this.state.height}
          />
          <canvas
            className="vid-and-canvas"
            ref={this.canvasRef}
            width={this.state.width}
            height={this.state.height}
          />
        </div>
        <div id="main-button-bar">
          {/* Display a loading wheel if model not ready to detect item*/ }
          <Loader className="loader" loaded={this.state.webcamStart && this.state.model} options={{color: this.state.model ? 'white' : 'black'}}>
            <div className="main-btn-container">
              <PauseOutlinedIcon id="stop-btn" className="main-btn" onClick={this.stopModel} data-tip data-for="stop" />
              <PlayArrowIcon style={{display: 'none'}} id="start-btn" className="main-btn" onClick={this.startModel} data-tip data-for="start" />
            </div>
            {/* ReactTooltip creates a small tooltip to buttons when hovered. */}
            <ReactTooltip id="start" place="top" type="light" effect="float">
              <span>Click on this button to start detection.</span>  
            </ReactTooltip>
            <ReactTooltip id="stop" place="top" type="light" effect="float">
              <span>Click on this button to stop detection.</span>  
            </ReactTooltip>
          </Loader>
          <div className="main-btn-container"><HelpOutlineIcon id="help-btn" className="main-btn" data-tip data-for="help" onClick={()=>{this.setState({help: true})}} /></div>
          
          <ReactTooltip id="help" place="top" type="light" effect="float">
              <span>Click on this button if you need any help.</span>  
            </ReactTooltip>

          {/* Alert to be displayed when help button is clicked */}
          <SweetAlert
            id = "alert-container"
            show={this.state.help}
            title="Support"
            confirmButtonColor="#BECF41"
            html="<b>If the system is not running properly,<br />make sure to give the application access to your camera, and allow up to a minute to let the application load.<br/><br/>To test the application, have someone wearing a hard-hat and a vest appear on your camera and watch the model work!<br/><br/>The Pause/Play button can be used to stop/start detection.</b>"
            onConfirm={() => this.setState({ help: false })}
          />
        </div>
      </div>
    );
  }
}

export default Detection;