// DEMO: https://codesandbox.io/s/z364noozrm
import React from "react";
import Button from '@material-ui/core/Button'

import "./styles.css";

const tf = require("@tensorflow/tfjs");

const classes = ["gun"];

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  constructor(props){
    super(props);
    this.state = {
      model: null,
      run: false,
      width: window.innerWidth,
      height: window.innerHeight,
      camX: null,
    }
    this.stopModel = this.stopModel.bind(this);
    this.startModel = this.startModel.bind(this);
    this.handleResize = this.handleResize.bind(this);
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
          this.setState({
            camX: (this.state.width - stream.getTracks()[0].getSettings().width)/2,
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
      
      this.setButtonPos();
      window.addEventListener('resize', this.handleResize);
   }
  }

  setButtonPos(){
    document.getElementById("stop-button").style.top = (this.state.height / 10 * 8.5).toString()+"px";
    document.getElementById("start-button").style.top =(this.state.height / 10 * 8.5).toString()+"px";
    
    document.getElementById("stop-button").style.left = (window.innerWidth / 20 * 8).toString()+ "px";
    document.getElementById("start-button").style.left = (window.innerWidth / 20 * 10).toString()+ "px";
  }

  handleResize(){
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    
    this.setButtonPos();
  }

  stopModel(){
    this.setState({run: false});
  }

  startModel(){
    this.setState({run: true});
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

  renderPredictions (predictionBoxes, totalPredictions, predictionClasses, predictionScores){
     // get the context of canvas
     const ctx = this.canvasRef.current.getContext('2d')
     // clear the canvas
     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
     // draw results
     if(this.state.run === false) return;
     for (let i = 0; i < totalPredictions[0]; i++) {
       const minY = predictionBoxes[i * 4] * 500;
       const minX = predictionBoxes[i * 4 + 1] * 600 + this.state.camX;
       const maxY = predictionBoxes[i * 4 + 2] * 500;
       const maxX = predictionBoxes[i * 4 + 3] * 600 + this.state.camX;
       const score = predictionScores[i * 3] * 100;
       const item = classes[predictionClasses[i] - 1];
       const predictionString = score.toFixed(1)+"- "+item;
        if (score > 90) {
         ctx.beginPath()
         ctx.rect(minX, minY, maxX - minX, maxY - minY)
         ctx.lineWidth = 4
         ctx.strokeStyle = '#00FFFF'
         ctx.stroke();

         ctx.textBaseline = "top";
         ctx.font = '16px sans-serif'
         ctx.fillStyle = '#00FFFF'
         const textWidth = ctx.measureText(predictionString).width;
         const textHeight = parseInt(ctx.font, 10); // base 10
         ctx.fillRect(minX, minY, textWidth + 4, textHeight + 4);

         ctx.shadowColor = 'white'
         ctx.fillStyle = '#000000'
         ctx.fillText(predictionString, minX, minY);
       }
    }
  };

  render() {
    return (
      <div>
       <video
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width={this.state.width}
          height={this.state.height}
        />
        <canvas
          className="size"
          ref={this.canvasRef}
          width={this.state.width}
          height={this.state.height}
        />
        {this.state.run?
          <div>
            <Button variant="contained" color="primary" disableElevation className="main-button" id="stop-button" onClick={this.stopModel}>Stop</Button> 
            <Button variant="contained" disableElevation className="main-button" id="start-button" onClick={this.startModel} >Start</Button>
          </div>: 
          <div>
            <Button variant="contained" disableElevation className="main-button" id="stop-button" onClick={this.stopModel}>Stop</Button> 
            <Button variant="contained" color="primary" disableElevation className="main-button" id="start-button" onClick={this.startModel}>Start</Button>
          </div>}
        
      </div>
    );
  }
}

export default App;