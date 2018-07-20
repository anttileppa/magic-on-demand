(() => {
  "use strict";

  const express = require("express");
  const path = require("path");
  const bodyParser = require("body-parser");
  const config = require("nconf");
  const port = config.port||3000;
  const app = express();
  const http = require("http");
  const httpServer = http.Server(app);
  const webSocketServer = require("./websocketserver");
  
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  
  app.set("port", port);
  app.set("trust proxy", true);
  app.use(express.static(path.join(__dirname, "public")));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended : true
  }));
  
  require("./routes")(app);

  exports.startServer = (callback) => {
    const port = app.get("port");
    
    httpServer.listen(port, () => {
      callback(port);
    });

    webSocketServer.start(httpServer);
  };
  
})();