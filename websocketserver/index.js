(() => {
  "use strict";

  const WebSocket = require("websocket");
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

    sendBinaryToOthers(binaryData) {
      this.server.getConnections(this.id).forEach((connection) => {
        connection.sendBinary(binaryData);
      });
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

  class FreqFeedWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
    }

    onBinaryMessage(binaryData) {
      this.sendBinaryToOthers(binaryData);
    }

  }

  class WebSocketServer {

    constructor(httpServer) {
      this.connections = {};

      this.wsServer = new WebSocket.server({
        httpServer: httpServer
      });
  
      this.wsServer.on("request", this.onRequest.bind(this));

      console.log("WebSocket server waiting connections...");
    }

    getConnections(excludingId) {
      return Object.keys(this.connections)
        .filter((id) => {
          return id !== excludingId;
        })
        .map((id) => {
          return this.connections[id];
        });
    }

    addConnection(connection) {
      this.connections[connection.id] = connection; 
      console.log(`WebSocket connection ${connection.id} opened`);
      connection.on("close", this.onConnectionClose.bind(this));
    }

    onConnectionClose(event) {
      delete this.connections[event.connection.id];
      console.log(`WebSocket connection ${event.connection.id} closed`);
    }

    onRequest(request) {
      const path = request.resourceURL.path.split("/");
      const type = path[1];

      if (type === "freq-feed") {
        this.addConnection(new FreqFeedWebSocketConnection(this, request.accept("echo-protocol", request.origin)));
      }
    }

  }

  module.exports = (httpServer) => {
    return new WebSocketServer(httpServer);
  }

})();
