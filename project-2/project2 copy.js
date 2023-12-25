/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 * 		setMesh, draw, setAmbientLight and enableLighting functions
 */

function GetModelViewProjection(
  projectionMatrix,
  translationX,
  translationY,
  translationZ,
  rotationX,
  rotationY
) {
  var trans1 = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translationX,
    translationY,
    translationZ,
    1,
  ];
  var rotatXCos = Math.cos(rotationX);
  var rotatXSin = Math.sin(rotationX);

  var rotatYCos = Math.cos(rotationY);
  var rotatYSin = Math.sin(rotationY);

  var rotatx = [
    1,
    0,
    0,
    0,
    0,
    rotatXCos,
    -rotatXSin,
    0,
    0,
    rotatXSin,
    rotatXCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var rotaty = [
    rotatYCos,
    0,
    -rotatYSin,
    0,
    0,
    1,
    0,
    0,
    rotatYSin,
    0,
    rotatYCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var test1 = MatrixMult(rotaty, rotatx);
  var test2 = MatrixMult(trans1, test1);
  var mvp = MatrixMult(projectionMatrix, test2);

  return mvp;
}

class MeshDrawer {
  // The constructor is a good place for taking care of the necessary initializations.
  constructor() {
    this.prog = InitShaderProgram(meshVS, meshFS);
    this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
    this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");

    this.colorLoc = gl.getUniformLocation(this.prog, "color");

    this.vertPosLoc = gl.getAttribLocation(this.prog, "pos");
    this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");

    this.vertbuffer = gl.createBuffer();
    this.texbuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();

    this.numTriangles = 0;

    /**
     * @Task2 : You should initialize the required variables for lighting here
     */

    //Enable lighting

    this.enableLightingLoc = gl.getUniformLocation(this.prog, "enableLighting");

    //Light position

    this.lightPosLoc = gl.getUniformLocation(this.prog, "lightPos");
    this.ambientLoc = gl.getUniformLocation(this.prog, "ambient");

    this.shininessLoc = gl.getUniformLocation(this.prog, "shininess");

    //Normal
    this.normalLoc = gl.getAttribLocation(this.prog, "normal");
  }

  setMesh(vertPos, texCoords, normalCoords) {
    // Bind and set vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    // Update texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    // Calculate the number of triangles
    this.numTriangles = vertPos.length / 3;

    // Update for lighting: Bind and set normal vectors
    // Create a buffer for normals if it doesn't exist
    if (!this.normalBuffer) {
      this.normalBuffer = gl.createBuffer();
    }

    // Bind and set normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(normalCoords),
      gl.STATIC_DRAW
    );
  }

  // This method is called to draw the triangular mesh.
  // The argument is the transformation matrix, the same matrix returned
  // by the GetModelViewProjection function above.
  draw(trans) {
    gl.useProgram(this.prog);

    // Set the model-view-projection matrix
    gl.uniformMatrix4fv(this.mvpLoc, false, trans);

    // Enable and set the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

    // Enable and set the texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.enableVertexAttribArray(this.texCoordLoc);
    gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Enable and set the normal attribute for lighting
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.enableVertexAttribArray(this.normalLoc);
    gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

    // Update lighting uniform values
    // Update light position (if dynamic)
    updateLightPos();
    gl.uniform3f(this.lightPosLoc, lightX, lightY, 0.0); // Example light position

    // Set additional lighting uniforms as needed (e.g., light color, intensity)
    // These would be set based on your application's requirements
    // Example: gl.uniform3f(this.lightColorLoc, 1.0, 1.0, 1.0); // white light
    // Example: gl.uniform1f(this.ambientIntensityLoc, 0.5); // ambient intensity

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

    // Disable the attribute arrays for cleanup
    gl.disableVertexAttribArray(this.vertPosLoc);
    gl.disableVertexAttribArray(this.texCoordLoc);
    gl.disableVertexAttribArray(this.normalLoc);
  }

  // This method is called to set the texture of the mesh.
  // The argument is an HTML IMG element containing the texture data.
  setTexture(img) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // You can set the texture image data using the following command.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    // Set texture parameters
    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      console.error(
        "Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures"
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Set texture wrapping to REPEAT (or MIRRORED_REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const sampler = gl.getUniformLocation(this.prog, "tex");
    gl.uniform1i(sampler, 0);
  }

  showTexture(show) {
    gl.useProgram(this.prog);
    gl.uniform1i(this.showTexLoc, show);
  }

  enableLighting(show) {
    gl.useProgram(this.prog);

    // Convert the boolean 'show' to an integer because WebGL works with int/float types
    const lightingFlag = show ? 1 : 0;

    // Set the uniform to enable/disable lighting
    gl.uniform1i(this.lightingEnabledLoc, lightingFlag);
  }

  setAmbientLight(ambient) {
    gl.useProgram(this.prog);

    // Set the uniform for ambient light intensity
    gl.uniform1f(this.ambientIntensityLoc, ambient);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
  dst = dst || new Float32Array(3);
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    dst[0] = v[0] / length;
    dst[1] = v[1] / length;
    dst[2] = v[2] / length;
  }
  return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
				precision mediump float;

				uniform bool showTex;
				uniform bool enableLighting;
				uniform sampler2D tex;
				uniform vec3 color; 
				uniform vec3 lightPos;
				uniform float ambient;

				varying vec2 v_texCoord;
				varying vec3 v_normal;

				void main()
				{
					vec4 texColor = texture2D(tex, v_texCoord);
					vec3 norm = normalize(v_normal);
					vec3 lightDir = normalize(lightPos - vec3(gl_FragCoord));

					// Ambient lighting
					vec3 ambientColor = ambient * vec3(texColor);

					// Diffuse lighting
					float diff = max(dot(norm, lightDir), 0.0);
					vec3 diffuseColor = diff * vec3(texColor);

					// Combined lighting effect
					vec3 lightingEffect = ambientColor + diffuseColor;

					if(enableLighting){
						if(showTex){
							// Apply lighting to texture
							gl_FragColor = vec4(lightingEffect, texColor.a);
						}
						else{
							// Apply lighting to solid color
							gl_FragColor = vec4(lightingEffect * vec3(color), 1.0);
						}
					}
					else{
						if(showTex){
							// Show texture without lighting
							gl_FragColor = texColor;
						}
						else{
							// Show solid color without lighting
							gl_FragColor = vec4(color, 1.0);
						}
					}
}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
  const translationSpeed = 1;
  if (keys["ArrowUp"]) lightY -= translationSpeed;
  if (keys["ArrowDown"]) lightY += translationSpeed;
  if (keys["ArrowRight"]) lightX -= translationSpeed;
  if (keys["ArrowLeft"]) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
