(() => {
  "use strict";

  const _ = require("lodash");
  const webSocketServer = require(`${__dirname}/../../websocketserver`);
  const devices = require(`${__dirname}/../../devices`);

  class ManualSourceFeedHandler {

    constructor() {
      setInterval(this.sendUpdates.bind(this), 200);
    }

    async sendUpdates() {
      const manualDevices = await devices.listDevicesWithSettingsBySource("manual");
      if (manualDevices.length) {
        manualDevices.forEach((manualDevice) => {
          _.forEach(manualDevice.settings, (settings, channel) => {
            const value = ((settings.options || {}).value) || 0;
            this.sendManualData(manualDevice, channel, Buffer.from([value]));
          });
        });
      }
    }

    sendManualData(device, channel, data) {
      const connections = webSocketServer.getOutputConnectionsByDeviceAndChannel(device.name, channel);
      connections.forEach((connection) => {
        connection.sendBinary(data);
      });
    }
    
  }

  module.exports = new ManualSourceFeedHandler();

})();