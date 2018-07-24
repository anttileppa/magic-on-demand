(() => {
  "use strict";

  class AbstractSourceHandler {

    constructor() {
    }

    sendData(device, channel, data) {
      const webSocketServer = require(`${__dirname}/../../websocketserver`);
      const connections = webSocketServer.getOutputConnectionsByDeviceAndChannel(device.name, channel);
      connections.forEach((connection) => {
        connection.sendBinary(data);
      });
    }
    
  }

  module.exports = AbstractSourceHandler;

})();