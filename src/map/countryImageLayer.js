import { buildCountryRenderModel } from './countryRenderModel.js';

export const COUNTRY_IMAGE_LAYER_ID = 'country-image-layer';

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texcoord;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(error);
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program) || 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(error);
  }

  return program;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = 'async';
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load country image: ${src}`));
    image.src = src;
  });
}

function nextPowerOfTwo(value) {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

function drawImageCover(context, image, x, y, width, height) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    cropY = (sourceHeight - cropHeight) / 2;
  }

  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
}

async function createTextureAtlas(gl, countries) {
  if (countries.length === 0) {
    return null;
  }

  const images = await Promise.all(countries.map((country) => loadImage(country.imageSrc)));
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const columns = Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / columns);
  const largestImageSide = Math.max(
    ...images.map((image) => Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)),
    64,
  );
  const cellSize = Math.max(16, Math.min(512, largestImageSide, Math.floor(maxTextureSize / columns)));
  const atlasWidth = nextPowerOfTwo(columns * cellSize);
  const atlasHeight = nextPowerOfTwo(rows * cellSize);
  const canvas = document.createElement('canvas');

  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const context = canvas.getContext('2d');
  const rects = [];

  context.clearRect(0, 0, atlasWidth, atlasHeight);

  for (let index = 0; index < images.length; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * cellSize;
    const y = row * cellSize;

    drawImageCover(context, images[index], x, y, cellSize, cellSize);
    rects.push({
      u0: x / atlasWidth,
      v0: y / atlasHeight,
      u1: (x + cellSize) / atlasWidth,
      v1: (y + cellSize) / atlasHeight,
    });
  }

  return {
    canvas,
    rects,
  };
}

function buildAtlasTexcoords(model, atlasRects) {
  const texcoords = new Float32Array(model.localUvs.length);

  for (let countryIndex = 0; countryIndex < model.countries.length; countryIndex += 1) {
    const country = model.countries[countryIndex];
    const rect = atlasRects[countryIndex];
    const start = country.vertexStart * 2;
    const end = start + country.vertexCount * 2;

    for (let index = start; index < end; index += 2) {
      const localU = model.localUvs[index];
      const localV = model.localUvs[index + 1];

      texcoords[index] = rect.u0 + localU * (rect.u1 - rect.u0);
      texcoords[index + 1] = rect.v0 + localV * (rect.v1 - rect.v0);
    }
  }

  return texcoords;
}

function uploadArrayBuffer(gl, buffer, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
}

export function createCountryImageLayer({ id = COUNTRY_IMAGE_LAYER_ID } = {}) {
  return {
    id,
    type: 'custom',
    renderingMode: '2d',
    map: null,
    gl: null,
    program: null,
    positionBuffer: null,
    texcoordBuffer: null,
    texture: null,
    model: buildCountryRenderModel([]),
    ready: false,
    updateToken: 0,

    onAdd(map, gl) {
      this.map = map;
      this.gl = gl;
      this.program = createProgram(gl);
      this.positionBuffer = gl.createBuffer();
      this.texcoordBuffer = gl.createBuffer();
      this.texture = gl.createTexture();
      this.rebuildGpuResources();
    },

    onRemove(_map, gl) {
      if (this.texture) {
        gl.deleteTexture(this.texture);
      }

      if (this.positionBuffer) {
        gl.deleteBuffer(this.positionBuffer);
      }

      if (this.texcoordBuffer) {
        gl.deleteBuffer(this.texcoordBuffer);
      }

      if (this.program) {
        gl.deleteProgram(this.program);
      }

      this.map = null;
      this.gl = null;
      this.program = null;
      this.positionBuffer = null;
      this.texcoordBuffer = null;
      this.texture = null;
      this.ready = false;
    },

    updateCountries(countries) {
      this.model = buildCountryRenderModel(countries);
      this.ready = false;
      this.updateToken += 1;
      this.rebuildGpuResources();
    },

    async rebuildGpuResources() {
      if (!this.gl || !this.positionBuffer || !this.texcoordBuffer || !this.texture) {
        return;
      }

      const token = this.updateToken;
      const model = this.model;
      const gl = this.gl;

      if (model.vertexCount === 0) {
        this.ready = true;
        this.map?.triggerRepaint();
        return;
      }

      let atlas = null;

      try {
        atlas = await createTextureAtlas(gl, model.countries);
      } catch (error) {
        console.warn(error);
        return;
      }

      if (!atlas || token !== this.updateToken || this.gl !== gl) {
        return;
      }

      const texcoords = buildAtlasTexcoords(model, atlas.rects);

      uploadArrayBuffer(gl, this.positionBuffer, model.positions);
      uploadArrayBuffer(gl, this.texcoordBuffer, texcoords);

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);

      this.ready = true;
      this.map?.triggerRepaint();
    },

    render(gl, { defaultProjectionData }) {
      if (!this.ready || this.model.vertexCount === 0 || !this.program || !this.texture) {
        return;
      }

      const positionLocation = gl.getAttribLocation(this.program, 'a_position');
      const texcoordLocation = gl.getAttribLocation(this.program, 'a_texcoord');
      const matrixLocation = gl.getUniformLocation(this.program, 'u_matrix');
      const textureLocation = gl.getUniformLocation(this.program, 'u_texture');

      gl.useProgram(this.program);
      gl.uniformMatrix4fv(matrixLocation, false, defaultProjectionData.mainMatrix);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(textureLocation, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLocation);
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, this.model.vertexCount);
    },
  };
}
