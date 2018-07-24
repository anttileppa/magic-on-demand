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
          "name": "purple-wave",
          "title": "Purple Wave"
        },
        {
          "name": "red-twinkle",
          "title": "Red twinkle"
        },
        {
          "name": "blue-twinkle",
          "title": "Blue twinkle"
        }
      ]);
    }

  }

  class SpotDevice extends Device {

    constructor(index) {
      super(`spot-${index}`, `Spot ${index}`, [
        {
          "name": "master",
          "title": "Master",
        },
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
        },
        {
          "name": "white",
          "title": "White"
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
      this.addDevice(new SpotDevice(1));
      this.addDevice(new SpotDevice(2));
      this.addDevice(new SpotDevice(3));
      this.addDevice(new SpotDevice(4));
    }

    async loadSettingSavedNames() {
      const value = await this.redisClient.getAsync("settings");
      const settings = value ? JSON.parse(value) : {};
      return Object.keys(settings);
    }

    async loadSettings(name) {
      const value = await this.redisClient.getAsync("settings");
      const settings = (value ? JSON.parse(value) : {})[name] || {};

      const settingDevices = Object.keys(settings);
      for (let i = 0; i < settingDevices.length; i++) {
        const settingDevice = settingDevices[i];
        await this.saveDeviceSettings(settingDevice, settings[settingDevice]);
      }
    }

    async saveSettings(name) {
      const value = await this.redisClient.getAsync("settings");
      const settings = value ? JSON.parse(value) : {};
      settings[name] = {};

      for (let i = 0; i < this.devices.length; i++) {
        const deviceName = this.devices[i].getName();
        settings[name][deviceName] = await this.loadDeviceSettings(deviceName); 
      }

      await this.redisClient.setAsync("settings", JSON.stringify(settings));
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