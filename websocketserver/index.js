(() => {
  "use strict";

  const _ = require("lodash");
  const WebSocket = require("websocket");
  const uuidv4 = require("uuid/v4");
  const EventEmitter = require("events");
  const devices = require(`${__dirname}/../devices`);

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

  class SourceWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
    }

  }

  class MicSourceWebSocketConnection extends SourceWebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
      this.freqHighCut = 5;
    }

    async onBinaryMessage(sourceData) {
      const micDevices = await devices.listDevicesWithSettingsBySource("mic");
      if (micDevices.length) {
        const bass = this.getFreqLow(sourceData);
        const treble = this.getFreqHigh(sourceData);
        const loudness = this.getFreqAvg(sourceData, 0, sourceData.length);

        micDevices.forEach((micDevice) => {
          _.forEach(micDevice.settings, (settings, channel) => {
            if (settings.source === "mic") {
              const micChannel = ((settings.options || {}).channel) || 'None';
              const volume = (((settings.options || {}).volume) || 100) / 100;
              
              switch (micChannel) {
                case "bass":
                  this.sendMicData(micDevice, channel, Buffer.from([bass * volume]));
                break;
                case "treble":
                  this.sendMicData(micDevice, channel, Buffer.from([treble * volume]));
                break;
                case "loudness":
                  this.sendMicData(micDevice, channel, Buffer.from([loudness * volume]));
                break;  
              } 
            }
          });
        });
      }
    }

    sendMicData(device, channel, data) {
      const connections = this.server.getOutputConnectionsByDeviceAndChannel(device.name, channel);
      connections.forEach((connection) => {
        connection.sendBinary(data);
      });
    }

    getFreqAvg(sourceData, from, to) {
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result += sourceData[x];
      }

      return result / (to - from);
    }

    getFreqMax(sourceData, from, to) {
      if (!sourceData) {
        return 0;
      }

      let result = 0;
      for (let x = from; x < to; x++) {
        result = Math.max(sourceData[x], result);
      }

      return result;
    }

    getFreqHigh(sourceData) {
      if (!sourceData) {
        return 0;
      }

      return this.getFreqMax(sourceData, this.freqHighCut + 1, sourceData.length);
    }

    getFreqLow(sourceData) {
      return this.getFreqMax(sourceData, 0, this.freqHighCut);
    }
  }

  class ControlWebSocketConnection extends WebSocketConnection {

    constructor(server, connection) {
      super(server, connection);
      /**
      server.on("deviceConnect", this.onServerDeviceConnect.bind(this));

      server.getSourceDevices().forEach((device) => {
        this.sendJson({
          type: "source-device-connect",
          name: device.name
        });
      }); */
    }
/**
    onServerDeviceConnect(event) {
      if (event.type === "source") {
        this.sendJson({
          type: "source-device-connect",
          name: event.name
        });
      }
    } */

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
