(() => {
  "use strict";

  const devices = require(`${__dirname}/../devices`);
  const sources = require(`${__dirname}/../sources`);
  
  class Routes {

    register(app) {
      app.get("/", this.catchAsync(this.indexGet.bind(this)));
      app.get("/mic", this.catchAsync(this.micGet.bind(this)));
      app.get("/plasma", this.catchAsync(this.plasmaGet.bind(this)));
      app.get("/freq", this.catchAsync(this.freqGet.bind(this)));
      app.post("/ajax/updateDeviceSource", this.catchAsync(this.ajaxUpdateDeviceSourcePost.bind(this)));
    }

    /**
    * Handle / get request
    *
    * @param {http.ClientRequest} req client request object
    * @param {http.ServerResponse} res server response object
    **/
    async indexGet(req, res) {
      res.render("index", { 
        "devices": await devices.getDevicesAsJson(),
        "sources": await sources.getSourcesAsJson()
      });
    }

    /**
    * Handle /mic get request
    *
    * @param {http.ClientRequest} req client request object
    * @param {http.ServerResponse} res server response object
    **/
    micGet(req, res) {
      res.render("mic", { });
    }

    /**
    * Handle /plasma get request
    *
    * @param {http.ClientRequest} req client request object
    * @param {http.ServerResponse} res server response object
    **/
    plasmaGet(req, res) {
      res.render("plasma", { });
    }

    /**
    * Handle /mic get request
    *
    * @param {http.ClientRequest} req client request object
    * @param {http.ServerResponse} res server response object
    **/
    freqGet(req, res) {
      res.render("freq", { });
    }

    ajaxUpdateDeviceSourcePost(req, res) {
      const body = req.body;
      devices.updateDeviceSource(body.device, body.channel, body.source, body.option, body.value);
      res.send("ok");
    }

    /**
     * Catch unhandled promise errors
     * 
     * @param {function} handler handler function
     * @return {Function} decorated handler function
     */
    catchAsync(handler) {
      return (req, res) => {
        return Promise.resolve(handler(req, res)).catch((err) => {
          res.status(500).send(err);
        });
      };
    }

  }

  module.exports = (app) => {
    const routes = new Routes();
    routes.register(app);
  };

})();
