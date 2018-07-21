(() => {
  "use strict";

  const EventEmitter = require("events");
  require(`${__dirname}/handlers`);
  
  class Source extends EventEmitter {
    
    constructor(name, title, options) {
      super();

      this.title = title;
      this.name = name;
      this.options = options;
    }

    getTitle() {
      return this.title;
    }

    getName() {
      return this.name;
    }

    getOptions() {
      return this.options;
    }

  }

  class ManualSource extends Source {

    constructor() {
      super("manual", "Manual", [
        {
          "type": "number",
          "name": "value",
          "title": "Value",
          "min": 0,
          "max": 255
        }
      ]);
    }

  }

  class MicSource extends Source {

    constructor() {
      super("mic", "Mic", [
        {
          "type": "select",
          "name": "channel",
          "title": "Channel",
          "options": [{
            "name": "treble",
            "title": "Treble"
          }, {
            "name": "bass",
            "title": "Bass"
          }, {
            "name": "loudness",
            "title": "Loudness"
          }]
        },
        {
          "type": "number",
          "name": "volume",
          "title": "Volume",
          "min": 0,
          "max": 100
        }
      ]);
    }

  }

  class Sources {

    constructor() {
      this.sources = [];
      this.addSource(new ManualSource());
      this.addSource(new MicSource());
    }

    addSource(source) {
      this.sources.push(source);
    }

    getSources() {
      return this.sources;
    }

    async getSourcesAsJson() {
      return this.sources.map((source) => {
        return {
          "title": source.getTitle(),
          "name": source.getName(),
          "options": source.getOptions()
        };
      });
    } 

  }

  module.exports = new Sources();

})();
/**

[
  {
    "name": "none",
    "title": "Off"
  },
  {
    "name": "manual",
    "title": "Manual"
  },
  {
    "name": "range",
    "title": "Manual range"
  },
  {
    "name": "freq-low",
    "title": "Mic - Bass"
  },
  {
    "name": "freq-high",
    "title": "Mic - Treble"
  },
  {
    "name": "freq-avg",
    "title": "Mic - Loudness"
  }
]**/