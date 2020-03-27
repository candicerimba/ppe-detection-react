// DEMO: https://codesandbox.io/s/z364noozrm
import React from "react";

import "./styles.css";

const tf = require("@tensorflow/tfjs");

const classes = ["gun"];

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  componentDidMount() {
    this.setState({model: null});
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
        this.setState({model: model})
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

  async detectObjects () {
    if (this.state.model === null) return;
    const tfImg = tf.browser.fromPixels(this.videoRef.current);
    const smallImg = tf.image.resizeBilinear(tfImg, [300, 300]); // 600, 450
    const resized = tf.cast(smallImg, 'float32');
    const tf4d = tf.tensor4d(Array.from(resized.dataSync()), [1, 300, 300, 3]); // 600, 450
    let predictions = await this.state.model.executeAsync({ image_tensor: tf4d }, ['detection_boxes', 'num_detections', 'detection_classes', 'detection_scores']);
    
    this.renderPredictions(predictions[0].dataSync(), predictions[1].dataSync(), predictions[2].dataSync(), predictions[3].dataSync())
    
    tfImg.dispose();
    smallImg.dispose();
    resized.dispose();
    tf4d.dispose();

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
     for (let i = 0; i < totalPredictions[0]; i++) {
       const minY = predictionBoxes[i * 4] * 500
       const minX = predictionBoxes[i * 4 + 1] * 600
       const maxY = predictionBoxes[i * 4 + 2] * 500
       const maxX = predictionBoxes[i * 4 + 3] * 600
       const score = predictionScores[i * 3] * 100
       const item = classes[predictionClasses[i] - 1];
       const predictionString = score.toFixed(1)+"-"+item;
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
          width="600"
          height="500"
        />
        <canvas
          className="size"
          ref={this.canvasRef}
          width="600"
          height="500"
        />
      </div>
    );
  }
}

export default App;