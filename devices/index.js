(() => {
  "use strict";

  const EventEmitter = require("events");
  const bluebird = require("bluebird");
  const redis = bluebird.promisifyAll(require("redis"));

  class Device extends EventEmitter {
    
    constructor(name, title, channels) {
      super();

      this.title = title;
      this.name = name;
      this.channels = channels;
    }

    getChannels() {
      return this.channels;
    }

    getTitle() {
      return this.title;
    }

    getName() {
      return this.name;
    }

  }

  class PlasmaDevice extends Device {

    constructor() {
      super("plasma", "Plasma", [
        {
          "name": "blobiness",
          "title": "Blobiness"
        },
        {
          "name": "brightness",
          "title": "Brightness"
        }
      ]);
    }

  }

  class LedsDevice extends Device {

    constructor() {
      super("leds", "Leds", [
        {
          "name": "red",
          "title": "Red"
        },
        {
          "name": "green",
          "title": "Green"
        },
        {
          "name": "blue",
          "title": "Blue"
        }
      ]);
    }

  }

  class Devices {

    constructor() {
      this.redisClient = redis.createClient();
      this.devices = [];
      this.addDevice(new LedsDevice());
      this.addDevice(new PlasmaDevice());
    }
    
    async updateDeviceSource(device, channel, source, option, value) {
      const settings = await this.loadDeviceSettings(device);
      const channelSettings = settings[channel] || {};
      const channelOptions = channelSettings.options || {}; 

      if (option) {
        channelOptions[option] = value;
      }

      settings[channel] = Object.assign(channelSettings, {
        source: source,
        options: channelOptions
      });

      await this.saveDeviceSettings(device, settings);
    }

    async saveDeviceSettings(device, settings) {
      await this.redisClient.setAsync(device, JSON.stringify(settings));
    }

    async loadDeviceSettings(device) {
      const value = await this.redisClient.getAsync(device);
      return value ? JSON.parse(value) : {};
    }

    async listDevicesWithSettings() {
      return await Promise.all(this.devices.map(async (device) => {
        const settings = await (this.loadDeviceSettings(device.getName()));
        return Object.assign(device, {
          settings: settings
        });
      }));
    }

    async listDevicesWithSettingsBySource(source) {
      return (await this.listDevicesWithSettings()).filter((device) => {
        const channels = device.getChannels();

        for (let i = 0; i < channels.length; i++) {
          const channelName = channels[i].name;
          const deviceSettings = device.settings || {};
          const channelSettings = deviceSettings[channelName] || {}
          const channelSource = channelSettings.source

          if (channelSource === source) {
            return true;
          }
        }

        return false;
      });
    }

    addDevice(device) {
      this.devices.push(device);
    }

    getDevices() {
      return this.devices;
    }

    async getDevicesAsJson() {
      return await Promise.all(this.devices.map(async (device) => {
        return {
          "title": device.getTitle(),
          "name": device.getName(),
          "channels": device.getChannels(),
          "settings": await (this.loadDeviceSettings(device.getName()))
        };
      }));
    } 

  }

  module.exports = new Devices();

})();

/**
          
    "flash": ["source"],
    "spot-1": ["source"],
    "spot-2": ["source"],
    "spot-3": ["source"]
 */