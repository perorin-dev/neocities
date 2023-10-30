main()

function createShader( gl, type, source ) {
  var shader = gl.createShader( type );
  gl.shaderSource( shader, source );
  gl.compileShader( shader );
  var success = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
 
  // Check if the canvas is not the same size.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;
 
  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }
 
  return needResize;
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const vs = `
    // an attribute will receive data from a buffer
    attribute vec4 a_position;
    //attribute vec2 a_texcoord;
    
    //varying vec2 v_texcoord;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
      //v_texcoord = a_texcoord;
    }
  `;

  const fs = `
    precision highp float;
    
    //varying vec2 v_texcoord;

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    //uniform sampler2D u_texture;      

    vec3 to_rgba(float c) {
      c = clamp(c, 0.0, 1.0);
      float hue = c * 360.0;
      float chroma = 1.0;
      float saturation = 1.0;
      vec3 rgb;
      rgb.x = abs(mod(hue / 60.0 + 3.0, 6.0 ) - 3.0 ) - 1.0;
      rgb.y = 2.0 - abs(mod(hue / 60.0 + 2.0, 6.0) -2.0 );
      rgb.z = 2.0 - abs(mod(hue / 60.0 + 4.0, 6.0) - 2.0 );
      rgb = clamp(rgb, 0.0, 1.0);
      rgb = mix(vec3(chroma),rgb,saturation);
      return rgb;
    }
    void main() {
      //gl_FragColor = vec4(fract((gl_FragCoord.xy ) / u_resolution), fract(u_time), 1);
      
      const int max_iterations = 255;
      int ii = 0;
      float zoom = 0.1 / u_time;
      vec4 initial_space = vec4( -2.5, -1.0, 3.5, 2.0 );
      vec2 mouse_translate = vec2( 1.0, 1.0 ) / u_resolution * u_mouse;
      vec2 pix_translate = vec2( 1.0, 1.0) / u_resolution * gl_FragCoord.xy;
      vec2 a = initial_space.xy + mouse_translate * initial_space.zw + pix_translate * initial_space.zw * vec2(zoom, zoom);
      vec2 b = vec2(0.0,0.0);
      vec2 c = vec2(0.0,0.0);
            
      for ( int i = 0; i < max_iterations; i++ ) {
        if ( b.x * b.x + b.y * b.y > 4.0 ) { break; }
        c.x = b.x*b.x - b.y*b.y + a.x;
        b.y = 2.0*b.x*b.y + a.y;
        b.x = c.x;
        ii++;
      }
      float g = float(ii);
      float h = float(max_iterations);
      if ( g == h ) {
        gl_FragColor = vec4(0.0,0.0,0.0,1.0);
      } else {
        gl_FragColor = vec4( mod(to_rgba( g / h )*2.0,1.0), 1.0);
      }
    }
  `;
  
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  
  var program = createProgram(gl, vertexShader, fragmentShader);
  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const mouseLocation = gl.getUniformLocation(program, "u_mouse");
  const timeLocation = gl.getUniformLocation(program, "u_time");

  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // fill it with a 2 triangles that cover clipspace
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
     1, -1,
    -1,  1,
    -1,  1,  // second triangle
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  let mouseX = 0;
  let mouseY = 0;

  function setMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
  }

  canvas.addEventListener('mousemove', setMousePosition);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, {passive: false});
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    setMousePosition(e.touches[0]);
  }, {passive: false});

  function render(time) {
    time *= 0.001;  // convert to seconds

    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(
        positionAttributeLocation,
        2,          // 2 components per iteration
        gl.FLOAT,   // the data is 32bit floats
        false,      // don't normalize the data
        0,          // 0 = move forward size * sizeof(type) each iteration to get the next position
        0,          // start at the beginning of the buffer
    );

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform1f(timeLocation, time);

    gl.drawArrays(
        gl.TRIANGLES,
        0,     // offset
        6,     // num vertices to process
    );

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}