// DEMO: https://codesandbox.io/s/z364noozrm
import React from "react";
import Loader from 'react-loader';
import ReactTooltip from 'react-tooltip';
import PauseOutlinedIcon from '@material-ui/icons/PauseOutlined';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { ToastContainer, toast } from 'react-toastify';  

import toastType from './toastType';
import 'react-toastify/dist/ReactToastify.css';
import "./styles.css";

const tf = require("@tensorflow/tfjs");

const classes = [
  {item: "helmet", color: "#F8962B", helmet: true}, 
  {item:"no helmet", color:"#FE0000", helmet: false}, 
  {item: "vest", color: "#22EE5B", vest: true},
  {item: "no vest", color: "#51C1B1", vest: false}];

const MAX_HEIGHT = 0.90 * window.innerHeight;
var toastOpen = false;

toast.configure();

class App extends React.Component {
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
    }
    this.stopModel = this.stopModel.bind(this);
    this.startModel = this.startModel.bind(this);
  }

  componentDidMount() {
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
      
      const modelPromise = tf.loadGraphModel('https://cors-anywhere.herokuapp.com/https://tensorflowfyp.s3-ap-southeast-2.amazonaws.com/model.json',
      {
        credentials: 'include',
        mode: 'no-cors', // no-cors, *cors, same-origin
      }).then((model)=>{
        this.setState({
          model: model,
          run: true,
        })
      });
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectObjects();
        })
        .catch(error => {
          console.error(error);
        });
   }
  }

  stopModel(){
    this.setState({run: false});
    document.getElementById("stop-btn").style.display = 'none';
    document.getElementById("start-btn").style.display = 'inline-block';
  }

  startModel(){
    this.setState({run: true});
    document.getElementById("stop-btn").style.display = 'inline-block';
    document.getElementById("start-btn").style.display = 'none';
  }

  async detectObjects () {
    if (this.state.model === null) return;
    if (this.state.run) {
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

    requestAnimationFrame(() => {
      this.detectObjects()
    })
  }

  detectFrame = (video, model) => {
    model.predict(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  toast(type, title, description){
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
      onOpen: () => {
        this.audioRight.play();
        setTimeout(()=>{
        this.audioRight.pause();
          toastOpen = false;
        }, 5000);
      }
    };

    if (!toastOpen){
      toastOpen = true;
      if (type === toastType.SUCCESS) toast.success(text, rightOptions);
    }
  }

  renderPredictions (predictionBoxes, totalPredictions, predictionClasses, predictionScores){
     // get the context of canvas
     const ctx = this.canvasRef.current.getContext('2d')
     // clear the canvas
     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
     // draw results
    if (!this.state.webcamStart) this.setState({webcamStart: true});

    const vest = [];
    const helmet = [];

    if(this.state.run === false) return;
    for (let i = 0; i < totalPredictions[0]; i++) {
      const minY = predictionBoxes[i * 4] * this.state.height;
      const minX = predictionBoxes[i * 4 + 1] * this.state.width;
      const maxY = predictionBoxes[i * 4 + 2] * this.state.height;
      const maxX = predictionBoxes[i * 4 + 3] * this.state.width;
      const score = predictionScores[i * 3] * 100;
      const item = classes[predictionClasses[i] - 1];
      const predictionString = score.toFixed(1)+" - "+item.item;

      if (score > 5) {        
        if (item.hasOwnProperty('helmet')) {helmet.push(item.helmet)};
        if (item.hasOwnProperty('vest')) {vest.push(item.vest)};

        const color = item.color;
        this.drawBox(minX, minY, maxX, maxY, color, predictionString);
      }
    }
    
    if (helmetExistence === true && vestExistence === true) this.toast(toastType.SUCCESS, "ACCESS GRANTED!", "Welcome in!");
  };

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
        <Loader loaded={this.state.webcamStart && this.state.model} options={{color: this.state.model ? 'white' : 'black'}}>
          <div id="main-button-bar">
              
              <PauseOutlinedIcon id="stop-btn" className="main-btn" onClick={this.stopModel} data-tip data-for="stop" />
              <PlayArrowIcon style={{display: 'none'}} id="start-btn" className="main-btn" onClick={this.startModel} data-tip data-for="start" />
              
              <ReactTooltip id="start" place="top" type="light" effect="float">
                <span>Click on this button to start detection.</span>  
              </ReactTooltip>
              <ReactTooltip id="stop" place="top" type="light" effect="float">
                <span>Click on this button to stop detection.</span>  
              </ReactTooltip>
            </div>
        </Loader>
      </div>
    );
  }
}

export default App;