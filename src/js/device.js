(() => {
  'use strict';

  class Device {

    constructor(options) {
      this.options = options || {};

      if (this.isFreqFeedActive()) {
        this.freqSocketClient = new WebSocketClient("freq-feed");
        this.freqSocketClient.on("binary-message", this.onFreqSocketBinaryMessage.bind(this));
      }
    }

    async start() {    
      if (this.isFreqFeedActive()) {
        await this.freqSocketClient.connect();
      }
    }

    isFreqFeedActive() {
      return !!this.options.freqFeedActive; 
    }

    getFreqAvg(from, to) {
      const freqData = this.freqData;
      if (!freqData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result += freqData[x];
      }

      return result / (to - from);
    }

    getFreqMax(from, to) {
      const freqData = this.freqData;
      if (!freqData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result = Math.max(freqData[x], result);
      }

      return result;
    }

    getFreqHigh() {
      const freqData = this.freqData;
      if (!freqData) {
        return 0;
      }

      return this.getFreqMax(this.options.freqHighCut + 1, freqData.length);
    }

    getFreqLow() {
      return this.getFreqMax(0, this.options.freqHighCut);
    }

    onFreqSocketBinaryMessage(binaryData) {
      this.freqData = new Uint8Array(binaryData);
    }

  }

  window.Device = Device;

})();