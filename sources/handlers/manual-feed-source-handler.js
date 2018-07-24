(() => {
  "use strict";

  const _ = require("lodash");
  const AbstractSourceHandler = require(`${__dirname}/abstract-source-handler`);
  const devices = require(`${__dirname}/../../devices`);
  
  class ManualSourceFeedHandler extends AbstractSourceHandler {

    constructor() {
      super();
      setInterval(this.sendUpdates.bind(this), 200);
    }

    async sendUpdates() {
      const manualDevices = await devices.listDevicesWithSettingsBySource("manual");
      if (manualDevices.length) {
        manualDevices.forEach((manualDevice) => {
          _.forEach(manualDevice.settings, (settings, channel) => {
            const value = ((settings.options || {}).value) || 0;
            this.sendData(manualDevice, channel, Buffer.from([value]));
          });
        });
      }
    }

  }

  module.exports = new ManualSourceFeedHandler();

})();