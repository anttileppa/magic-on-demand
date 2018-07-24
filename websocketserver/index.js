(() => {
  "use strict";

  const _ = require("lodash");
  const WebSocket = require("websocket");
  const EventEmitter = require("events");
  const WebSocketConnection = require(`${__dirname}/websocketconnection`);
  const MicSourceWebSocketConnection = require(`${__dirname}/micsourcewebsocketconnection`);

  class ControlWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
    }
    
  }

  class OutputWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
    }

  }

  class WebSocketServer extends EventEmitter {

    constructor() {
      super();
      this.connectionMap = {};
    }

    start(httpServer) {
      this.wsServer = new WebSocket.server({
        httpServer: httpServer
      });
  
      this.wsServer.on("request", this.onRequest.bind(this));

      console.log("WebSocket server waiting connections...");
    }

    getOutputConnectionsByDeviceAndChannel(device, channel) {
      return Object.values(this.connectionMap)
        .filter((connectionEntry) => {
          return connectionEntry.type === "output" && connectionEntry.device === device && connectionEntry.channel === channel;
        })
        .map((connectionEntry) => {
          return connectionEntry.connection;
        });
    }

    addDevice(type, device, channel, connection) {
      this.connectionMap[connection.id] = {
        id: connection.id,
        connection: connection,
        device: device,
        channel: channel,
        type: type
      };

      console.log(`WebSocket ${type} connection ${connection.id} opened`);
      
      this.emit("deviceConnect", this.connectionMap[connection.id]);
      connection.on("close", this.onConnectionClose.bind(this));
    }

    onConnectionClose(event) {
      delete this.connectionMap[event.connection.id];
      console.log(`WebSocket connection ${event.connection.id} closed`);
    }

    onRequest(request) {
      const path = request.resourceURL.path.split("/");
      const type = path[1];
      const device = path[2];
      const channel = path[3];

      if (type === "input") {
        switch (device) {
          case "mic":
            this.addDevice(type, device, channel, new MicSourceWebSocketConnection(this, request.accept("echo-protocol", request.origin)));
          break;
          default:
            console.error(`Unknown input device ${name}`);
          break;
        }  
      } else if (type === "output") {
        this.addDevice(type, device, channel, new OutputWebSocketConnection(this, request.accept("echo-protocol", request.origin)));
      } else if (type === "control") {
        this.addDevice(type, device, channel, new ControlWebSocketConnection(this, request.accept("echo-protocol", request.origin)));
      } else {
        console.error(`Unknown connection type ${type}`);
      }
      
    }

  }

  module.exports = new WebSocketServer();

})();
