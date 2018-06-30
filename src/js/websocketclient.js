(() => {
  'use strict';

  class WebSocketClient extends EventEmitter {

    constructor(type) {
      super();

      this.type = type;
    }

    connect() {
      console.log("WebSocket Connecting...");
  
      return new Promise((resolve, reject) => {
        this.url = `ws://${window.location.host}/${this.type}`;
        window.location.href.replace("http", "ws");
        this.webSocket = this.createWebSocket(`${this.url}`);

        if (this.webSocket.readyState === this.webSocket.OPEN) {
          resolve();
        } else if (this.webSocket.readyState === this.webSocket.CONNECTING) {
          this.webSocket.onopen = () => {
            console.log("WebSocket Connected.");
  
            delete this.webSocket.onopen;
            delete this.webSocket.onerror;

            this.webSocket.onmessage = this.onMessage.bind(this);

            resolve();
          };

          this.webSocket.onerror = () => {
            console.log("WebSocket connection failed");
  
            delete this.webSocket.onopen;
            delete this.webSocket.onerror;
            reject();
          };
        } else {
          reject("Failed");
        }
      });
    }

    blobToArrayBuffer(blob) {
      return new Promise((resolve) => {
        const fileReader = new FileReader();

        fileReader.onload = (event) => {
          resolve(event.target.result);
        };

        fileReader.readAsArrayBuffer(blob);
      });
    }
    
    send(data) {
      this.webSocket.send(data);
    }

    async onMessage(message) {
      if (message.data instanceof Blob) {
        this.emit("binary-message", await this.blobToArrayBuffer(message.data));
      } else {
        this.emit("utf8-message", message.data);
      }
    }

    createWebSocket(url) {
      if ((typeof window.WebSocket) !== 'undefined') {
        return new WebSocket(url,"echo-protocol");
      } else if ((typeof window.MozWebSocket) !== 'undefined') {
        return new MozWebSocket(url,"echo-protocol");
      }
    }

  }

  window.WebSocketClient = WebSocketClient; 

})();