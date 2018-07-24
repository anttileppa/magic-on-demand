(() => {
  "use strict";

  const _ = require("lodash");
  const WebSocketConnection = require(`${__dirname}/websocketconnection`);
  const micSourceHandler = require(`${__dirname}/../sources/handlers/mic-source-handler`);

  class MicSourceWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
    }

    async onBinaryMessage(sourceData) {
      micSourceHandler.sendMicData(sourceData); 
    }
  }

  module.exports = MicSourceWebSocketConnection;

})();
