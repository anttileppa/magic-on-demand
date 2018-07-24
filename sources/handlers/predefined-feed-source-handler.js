(() => {
  "use strict";

  const _ = require("lodash");
  const AbstractSourceHandler = require(`${__dirname}/abstract-source-handler`);
  const devices = require(`${__dirname}/../../devices`);
  
  class PredefinedSourceFeedHandler extends AbstractSourceHandler {

    constructor() {
      super();
      setInterval(this.sendUpdates.bind(this), 300);
    }

    async sendUpdates() {
      const predefinedDevices = await devices.listDevicesWithSettingsBySource("predefined");
      if (predefinedDevices.length) {
        predefinedDevices.forEach((predefinedDevice) => {
          _.forEach(predefinedDevice.settings, (settings, channel) => {
            const value = ((settings.options || {}).value) || 0;
            this.sendData(predefinedDevice, channel, Buffer.from([value]));
          });
        });
      }
    }

  }

  module.exports = new PredefinedSourceFeedHandler();

})();