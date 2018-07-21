(() => {
  "use strict";

  const webSocketServer = require(`${__dirname}/../websocketserver`);

  class AbstractSourceHandler {

    constructor() {
    }

    sendData(device, channel, data) {
      const connections = webSocketServer.getOutputConnectionsByDeviceAndChannel(device.name, channel);
      connections.forEach((connection) => {
        connection.sendBinary(data);
      });
    }
    
  }

  module.exports = AbstractSourceHandler;

})();