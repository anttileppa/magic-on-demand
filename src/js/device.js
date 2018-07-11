(() => {
  'use strict';

  class Device {

    constructor(options) {
      this.options = options || {};
    }
/**

    async start() {    
      await this.outputSocketClient.connect();
    }
    getFreqAvg(from, to) {
      const sourceData = this.sourceData;
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result += sourceData[x];
      }

      return result / (to - from);
    }

    getFreqMax(from, to) {
      const sourceData = this.sourceData;
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result = Math.max(sourceData[x], result);
      }

      return result;
    }

    getFreqHigh() {
      const sourceData = this.sourceData;
      if (!sourceData) {
        return 0;
      }

      return this.getFreqMax(this.options.freqHighCut + 1, sourceData.length);
    }

    getFreqLow() {
      return this.getFreqMax(0, this.options.freqHighCut);
    }
    onSocketBinaryMessage(binaryData) {
      this.sourceData = new Uint8Array(binaryData);
    }

**/
  }

  window.Device = Device;

})();