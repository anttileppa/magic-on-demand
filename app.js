(() => {
  'use strict';
  
  const config = require('nconf');
  config.file({ file: `${__dirname}/config.json` });
  const app = require(`${__dirname}/index`);
  
  app.startServer((port) => {
    console.log(`Express server started on localhost:${port}`);
  });
  
})();