(() => {
  'use strict';
  
  const config = require('nconf');
  config.file({ file: `${__dirname}/config.json` });
  const app = require(`${__dirname}/index`);
  
  app.startServer(() => {
    console.log('Express server started');
  });
  
})();
