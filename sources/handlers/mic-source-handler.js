(() => {
  "use strict";

  const _ = require("lodash");
  const AbstractSourceHandler = require(`${__dirname}/abstract-source-handler`);
  const devices = require(`${__dirname}/../../devices`);
  
  class MicSourceFeedHandler extends AbstractSourceHandler {

    constructor(deviceName) {
      super();
      this.deviceName = deviceName;
      this.freqHighCut = 5;
    }

    async sendMicData(sourceData) {
      const micDevices = await devices.listDevicesWithSettingsBySource(this.deviceName);
      if (micDevices.length) {
        const bass = this.getFreqLow(sourceData);
        const treble = this.getFreqHigh(sourceData);
        const loudness = this.getFreqAvg(sourceData, 0, sourceData.length);

        micDevices.forEach((micDevice) => {
          _.forEach(micDevice.settings, (settings, channel) => {
            const micChannel = ((settings.options || {}).channel) || 'None';
            const volume = (((settings.options || {}).volume) || 100) / 100;
            
            switch (micChannel) {
              case "bass":
                this.sendData(micDevice, channel, Buffer.from([bass * volume]));
              break;
              case "treble":
                this.sendData(micDevice, channel, Buffer.from([treble * volume]));
              break;
              case "loudness":
                this.sendData(micDevice, channel, Buffer.from([loudness * volume]));
              break;  
            } 
          });
        });
      }
    }

    getFreqAvg(sourceData, from, to) {
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result += sourceData[x];
      }

      return result / (to - from);
    }

    getFreqMax(sourceData, from, to) {
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result = Math.max(sourceData[x], result);
      }

      return result;
    }

    getFreqHigh(sourceData) {
      if (!sourceData) {
        return 0;
      }

      return this.getFreqMax(sourceData, this.freqHighCut + 1, sourceData.length);
    }

    getFreqLow(sourceData) {
      return this.getFreqMax(sourceData, 0, this.freqHighCut);
    }

  }

  module.exports = MicSourceFeedHandler;

})();