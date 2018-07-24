(() => {
  "use strict";

  const _ = require("lodash");
  const WebSocketConnection = require(`${__dirname}/websocketconnection`);
  const MicSourceFeedHandler = require(`${__dirname}/../sources/handlers/mic-source-handler`);

  class MicSourceWebSocketConnection extends WebSocketConnection {

    constructor(server, connection, deviceName) {
      super(server, connection);
      this.micSourceHandler = new MicSourceFeedHandler(deviceName);
    }

    async onBinaryMessage(sourceData) {
      this.micSourceHandler.sendMicData(sourceData); 
    }
  }

  module.exports = MicSourceWebSocketConnection;

})();
