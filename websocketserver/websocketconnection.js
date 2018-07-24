(() => {
  "use strict";

  const _ = require("lodash");
  const uuidv4 = require("uuid/v4");
  const EventEmitter = require("events");

  class WebSocketConnection extends EventEmitter {
    
    constructor(server, connection) {
      super();
      this.server = server;
      this.connection = connection;
      this.id = uuidv4();
      this.connection.on("message", this.onMessage.bind(this));
      this.connection.on("close", this.onClose.bind(this));
    }

    sendBinary(binaryData) {
      this.connection.sendBytes(binaryData);
    }

    sendUtf(utf8Data) {
      this.connection.sendUTF(utf8Data);
    }

    sendJson(json) {
      this.sendUtf(JSON.stringify(json));
    }
    
    onMessage(message) {
      if (message.type === "utf8") {
        this.onUtf8Message(message.utf8Data);
      } else if (message.type === "binary") {
        this.onBinaryMessage(message.binaryData);
      }
    }

    onUtf8Message(utf8Data) {
      console.log("utf message", utf8Data);
    }

    onBinaryMessage(binaryData) {
      console.log("binary message", binaryData);
    }

    onClose(reasonCode, description) {
      this.emit("close", { 
        connection: this,
        reasonCode: reasonCode,
        description: description
      });
    }

  }

  module.exports = WebSocketConnection;

})();
