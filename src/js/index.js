(() => {
  'use strict';

  class Control {

    constructor() {
      $(document).on("input", ".source-option", this.onSourceOptionInput.bind(this));
      $(document).on("chage", ".source-option", this.onSourceOptionChange.bind(this));
      
      $(".device-channel-source").change(this.onDeviceChannelSourceChange.bind(this));

      $(".save-settings").click(this.onSaveSettingsClick.bind(this));
      $(".load-settings").click(this.onLoadSettingsClick.bind(this));
    }

    async start() {
    }

    handleSourceOptionChange(input) {
      const value = $(input).val();
      const option = $(input).closest(".option").attr("data-option");
      const channel = $(input).closest(".channel").attr("data-channel");
      const source = $(input).closest(".source").attr("data-source");
      const device = $(input).closest(".device").attr("data-device");

      postJSON("/ajax/updateDeviceSource", {
        device: device, 
        channel: channel, 
        option: option, 
        source: source, 
        value: value
      });
    }

    onSocketUtfMessage(utfData) {
      console.log(utfData);
      console.log(JSON.parse(utfData));
    }

    async onSaveSettingsClick(event) {
      await postJSON("/ajax/saveSettings", {
        name: $(".save-settings-name").val()
      });

      window.location.reload(true);
    }

    async onLoadSettingsClick(event) {
      await postJSON("/ajax/loadSettings", {
        name: $(".load-settings-name").val()
      });

      window.location.reload(true);
    }

    onDeviceChannelSourceChange(event) {
      const element = $(event.target);
      const device = element.attr("data-device");
      const channel = element.attr("data-channel");
      const source = element.val();

      postJSON("/ajax/updateDeviceSource", {
        device: device, 
        channel: channel, 
        source: source
      });

      $(`[data-device="${device}"] [data-channel="${channel}"] .source`).hide();
      $(`[data-device="${device}"] [data-channel="${channel}"] [data-source="${source}"]`).show();
    }

    onSourceOptionInput(event) {
      this.handleSourceOptionChange($(event.target));
    }

    onSourceOptionChange(event) {
      this.handleSourceOptionChange($(event.target));
    }

  }

  $(document).ready(async () => {
    const control = new Control();
    control.start();
  });

})();