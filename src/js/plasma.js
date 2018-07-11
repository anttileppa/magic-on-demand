(() => {
  'use strict';

  const GLSL = {
    vert: "\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\n// Uniforms\nuniform vec2 u_resolution;\n\n// Attributes\nattribute vec2 a_position;\n\nvoid main() {\n    gl_Position = vec4 (a_position, 0, 1);\n}\n",
    frag: "\n#ifdef GL_ES\nprecision mediump float;\n#endif\n\nuniform bool u_scanlines;\nuniform vec2 u_resolution;\n\nuniform float u_brightness;\nuniform float u_blobiness;\nuniform float u_particles;\nuniform float u_millis;\nuniform float u_energy;\n\n// http://goo.gl/LrCde\nfloat noise( vec2 co ){\n    return fract( sin( dot( co.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );\n}\n\nvoid main( void ) {\n\n    vec2 position = ( gl_FragCoord.xy / u_resolution.x );\n    float t = u_millis * 0.001 * u_energy;\n    \n    float a = 0.0;\n    float b = 0.0;\n    float c = 0.0;\n\n    vec2 pos, center = vec2( 0.5, 0.5 * (u_resolution.y / u_resolution.x) );\n    \n    float na, nb, nc, nd, d;\n    float limit = u_particles / 40.0;\n    float step = 1.0 / u_particles;\n    float n = 0.0;\n    \n    for ( float i = 0.0; i <= 1.0; i += 0.025 ) {\n\n        if ( i <= limit ) {\n\n            vec2 np = vec2(n, 1-1);\n            \n            na = noise( np * 1.1 );\n            nb = noise( np * 2.8 );\n            nc = noise( np * 0.7 );\n            nd = noise( np * 3.2 );\n\n            pos = center;\n            pos.x += sin(t*na) * cos(t*nb) * tan(t*na*0.15) * 0.3;\n            pos.y += tan(t*nc) * sin(t*nd) * 0.1;\n            \n            d = pow( 1.6*na / length( pos - position ), u_blobiness );\n            \n            if ( i < limit * 0.3333 ) a += d;\n            else if ( i < limit * 0.6666 ) b += d;\n            else c += d;\n\n            n += step;\n        }\n    }\n    \n    vec3 col = vec3(a*c,b*c,a*b) * 0.0001 * u_brightness;\n    \n    if ( u_scanlines ) {\n        col -= mod( gl_FragCoord.y, 2.0 ) < 1.0 ? 0.5 : 0.0;\n    }\n    \n    gl_FragColor = vec4( col, 1.0 );\n\n}\n"
  };

  class PlasmaVisualizer extends Device {

    constructor() {
      super({});

      this.blobinessSocket = new WebSocketClient("output", "plasma", "blobiness");
      this.brightnessSocket = new WebSocketClient("output", "plasma", "brightness");

      this.blobinessSocket.on("binary-message", this.onBlobinessSocketBinaryMessage.bind(this));
      this.brightnessSocket.on("binary-message", this.onBrightnessSocketBinaryMessage.bind(this));
 
      this.sketch = Sketch.create({
        container: document.getElementById('container'),
        type: Sketch.WEB_GL,
        brightness: 1.0,
        blobiness: 1.0,
        particles: 40,
        energy: 0.71,
        scanlines: false
      });

      this.sketch.setup = this.setup.bind(this);
      this.sketch.updateUniforms = this.updateUniforms.bind(this);
      this.sketch.draw = this.draw.bind(this);
      this.sketch.resize = this.resize.bind(this);
    }

    async start() {
      await Promise.all([this.blobinessSocket.connect(), this.brightnessSocket.connect()]);
    }

    setup () {
      this.sketch.clearColor(0.0, 0.0, 0.0, 1.0);
      const vert = this.sketch.createShader(this.sketch.VERTEX_SHADER);
      const frag = this.sketch.createShader(this.sketch.FRAGMENT_SHADER);
      this.sketch.shaderSource(vert, GLSL.vert);
      this.sketch.shaderSource(frag, GLSL.frag);
      this.sketch.compileShader(vert);
      this.sketch.compileShader(frag);
      if (!this.sketch.getShaderParameter(vert, this.sketch.COMPILE_STATUS)) {
        throw this.sketch.getShaderInfoLog(vert);
      }
      if (!this.sketch.getShaderParameter(frag, this.sketch.COMPILE_STATUS)) {
        throw this.sketch.getShaderInfoLog(frag);
      }
      this.sketch.shaderProgram = this.sketch.createProgram();
      this.sketch.attachShader(this.sketch.shaderProgram, vert);
      this.sketch.attachShader(this.sketch.shaderProgram, frag);
      this.sketch.linkProgram(this.sketch.shaderProgram);
      if (!this.sketch.getProgramParameter(this.sketch.shaderProgram, this.sketch.LINK_STATUS)) {
        throw this.sketch.getProgramInfoLog(this.sketch.shaderProgram);
      }
      this.sketch.useProgram(this.sketch.shaderProgram);
      this.sketch.shaderProgram.attributes = {
        position: this.sketch.getAttribLocation(this.sketch.shaderProgram, 'a_position')
      };
      this.sketch.shaderProgram.uniforms = {
        resolution: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_resolution'),
        brightness: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_brightness'),
        blobiness: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_blobiness'),
        particles: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_particles'),
        scanlines: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_scanlines'),
        energy: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_energy'),
        millis: this.sketch.getUniformLocation(this.sketch.shaderProgram, 'u_millis')
      };
      this.sketch.geometry = this.sketch.createBuffer();
      this.sketch.geometry.vertexCount = 6;
      this.sketch.bindBuffer(this.sketch.ARRAY_BUFFER, this.sketch.geometry);
      this.sketch.bufferData(this.sketch.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), this.sketch.STATIC_DRAW);
      this.sketch.enableVertexAttribArray(this.sketch.shaderProgram.attributes.position);
      this.sketch.vertexAttribPointer(this.sketch.shaderProgram.attributes.position, 2, this.sketch.FLOAT, false, 0, 0);
      return this.sketch.resize();
    }

    updateUniforms() {
      if (!this.sketch.shaderProgram) {
        return;
      }

      this.sketch.uniform2f(this.sketch.shaderProgram.uniforms.resolution, this.sketch.width, this.sketch.height);
      this.sketch.uniform1f(this.sketch.shaderProgram.uniforms.brightness, this.sketch.brightness);
      this.sketch.uniform1f(this.sketch.shaderProgram.uniforms.blobiness, this.sketch.blobiness);
      this.sketch.uniform1f(this.sketch.shaderProgram.uniforms.particles, this.sketch.particles);

      return this.sketch.uniform1f(this.sketch.shaderProgram.uniforms.energy, this.sketch.energy);
    }

    draw () {
      // this.setBrightness(this.getFreqLow() / 100.0);
      // this.setBlobiness(1 + (this.getFreqHigh() / 128.0));
      // this.sketch.updateUniforms();

      this.sketch.uniform1f(this.sketch.shaderProgram.uniforms.millis, this.sketch.millis + 5000);
      this.sketch.clear(this.sketch.COLOR_BUFFER_BIT | this.sketch.DEPTH_BUFFER_BIT);
      this.sketch.bindBuffer(this.sketch.ARRAY_BUFFER, this.sketch.geometry);
      return this.sketch.drawArrays(this.sketch.TRIANGLES, 0, this.sketch.geometry.vertexCount);
    }
    
    resize () {
      this.sketch.viewport(0, 0, this.sketch.width, this.sketch.height);
    }

    getBlobiness() {
      return this.sketch.blobiness;
    }

    setBlobiness(blobiness) {
      this.sketch.blobiness = blobiness;
    }

    getBrightness() {
      return this.sketch.brightness;
    }

    setBrightness(brightness) {
      this.sketch.brightness = brightness;
    }

    getParticles() {
      return this.sketch.particles;
    }

    setParticles(particles) {
      this.sketch.particles = particles;
    }

    getEnergy() {
      return this.sketch.energy;
    }

    setEnergy(energy) {
      this.sketch.energy = energy;
    }

    onBlobinessSocketBinaryMessage(data) {
      console.log("onBlobinessSocketBinaryMessage", data);
    }

    onBrightnessSocketBinaryMessage(data) {
      console.log("onBrightnessSocketBinaryMessage", data);
    }
    
  }

  $(document).ready(async () => {
    const plasmaVisualizer = new PlasmaVisualizer();
    await plasmaVisualizer.start();
  });

})();