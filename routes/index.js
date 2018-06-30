(() => {
  "use strict";

  module.exports = (app) => {

    app.get("/", (req, res) => {
      try {
        res.render("index", { 
        });
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });

    app.get("/freq", (req, res) => {
      try {
        res.render("freq", { 
        });
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });

    app.get("/plasma", (req, res) => {
      try {
        res.render("plasma", { 
        });
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    
  };

})();
