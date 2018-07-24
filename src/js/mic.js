(() => {
  'use strict';

  class AudioAnalyser {

    constructor(smoothingTimeConstant) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = smoothingTimeConstant;
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

      this.settings = {
        "mic": {
          smoothingTimeConstant: 0 
        },
        "mic-smooth": {
          smoothingTimeConstant: 0.85 
        }
      };

      this.clients = {};
      this.analyzers = {};

      Object.keys(this.settings).forEach((device) => {
        const settings = this.settings[device];
        this.clients[device] = new WebSocketClient("input", device, "source");
        this.analyzers[device] = new AudioAnalyser(settings.smoothingTimeConstant);
      });

      this.frameCall = this.frame.bind(this);
      this.gain = 1;
      this.frequencyBuffer = new Uint8Array(Object.values(this.analyzers)[0].getAnalyzer().frequencyBinCount);
    }

    async start() {    
      const clientTasks = Object.values(this.clients).map((client) => {
        return client.connect();
      });

      const analyzerTasks = Object.values(this.analyzers).map((analyzer) => {
        return analyzer.connectMic();
      });

      await Promise.all(clientTasks.concat(analyzerTasks));
      window.requestAnimationFrame(this.frameCall);
    }

    frame() {
      Object.keys(this.settings).forEach((device) => {
        this.analyzers[device].getByteFrequencyData(this.frequencyBuffer);
        this.clients[device].send(this.frequencyBuffer);
      });

      window.requestAnimationFrame(this.frameCall);
    }

  }

  $(document).ready(async () => {
    const audioChanelController = new AudioChannelController();
    audioChanelController.start();
  });

})();