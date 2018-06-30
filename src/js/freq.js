(() => {
  'use strict';

  class FreqVisualizer extends Device {

    constructor() {
      super({
        freqFeedActive: true,
        freqHighCut: 5
      });

      this.sketch = Sketch.create({
        draw: this.draw.bind(this)
      });
    }

    draw() {
      const width = this.sketch.width;
      const height = this.sketch.height;
      const barWidth = 5;
      const bigBarWidth = 20;

      const freqData = this.freqData;
      if (!freqData) {
        console.log("no freqData");
        return;
      }

      const low = this.getFreqLow();
      const high = this.getFreqHigh();

      for (let x = 0; x < freqData.length; x++) {
        let y = freqData[x];

        const r = y;
        const g = x;
        const b = 0;

        this.sketch.fillStyle = `rgb(${r},${g},${b})`;
        this.sketch.fillRect(x * barWidth, height - y, barWidth, height);
      }

      const lr = 0;
      const lg = 0;
      const lb = low;

      this.sketch.fillStyle = `rgb(${lr},${lg},${lb})`;
      this.sketch.fillRect((barWidth * freqData.length) + bigBarWidth, height - low, bigBarWidth, height);

      const hr = 0;
      const hg = 0;
      const hb = high;

      this.sketch.fillStyle = `rgb(${hr},${hg},${hb})`;
      this.sketch.fillRect((barWidth * freqData.length) + (bigBarWidth * 3), height - high, bigBarWidth, height);
    }

  }

  $(document).ready(async () => {
    const freqVisualizer = new FreqVisualizer();
    await freqVisualizer.start();
  });

})();