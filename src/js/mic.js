(() => {
  'use strict';

  class AudioAnalyser {

    constructor() {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0;
      this.analyser.fftSize = 64;
    }

    getMediaDevices() {
      if (!navigator.mediaDevices.getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      return navigator.mediaDevices.getUserMedia({ audio: true });
    }

    async connectMic() {
      const stream = await this.getMediaDevices();
      
      const source = this.audioCtx.createMediaStreamSource(stream);
      source.connect(this.analyser);
    }

    getAnalyzer() {
      return this.analyser;
    }

    getByteTimeDomainData(dataArray) {
      this.analyser.getByteTimeDomainData(dataArray);
    }

    getByteFrequencyData(dataArray) {
      this.analyser.getByteFrequencyData(dataArray);
    }

  }

  class ChannelController {

    constructor() {
    }

  }

  class AudioChannelController extends ChannelController {

    constructor() {
      super();

      this.socketClient = new WebSocketClient("input", "mic", "source");
      this.audioAnalyser = new AudioAnalyser();
      this.frameCall = this.frame.bind(this);
      this.gain = 1;
      this.frequencyBuffer = new Uint8Array(this.audioAnalyser.getAnalyzer().frequencyBinCount);
    }

    async start() {    
      await Promise.all([
        this.audioAnalyser.connectMic(),
        this.socketClient.connect()
      ]);

      window.requestAnimationFrame(this.frameCall);
    }

    frame() {
      this.audioAnalyser.getByteFrequencyData(this.frequencyBuffer);
      this.socketClient.send(this.frequencyBuffer);
      window.requestAnimationFrame(this.frameCall);
    }

  }

  $(document).ready(async () => {
    const audioChanelController = new AudioChannelController();
    audioChanelController.start();
  });

})();