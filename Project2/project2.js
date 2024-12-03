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
  constructor() {
    this.prog = InitShaderProgram(meshVS, meshFS);

    this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
    this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");

    // Lighting uniforms
    this.enableLightingLoc = gl.getUniformLocation(this.prog, "enableLighting");
    this.lightPosLoc = gl.getUniformLocation(this.prog, "lightPos");
    this.ambientLoc = gl.getUniformLocation(this.prog, "ambient");
    this.diffuseLoc = gl.getUniformLocation(this.prog, "diffuse");
    this.specularLoc = gl.getUniformLocation(this.prog, "specular");
    this.viewPosLoc = gl.getUniformLocation(this.prog, "viewPos");

    // Attribute locations
    this.vertPosLoc = gl.getAttribLocation(this.prog, "pos");
    this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");
    this.normalLoc = gl.getAttribLocation(this.prog, "normal");

    // Buffers
    this.vertbuffer = gl.createBuffer();
    this.texbuffer = gl.createBuffer();
    this.normalbuffer = gl.createBuffer();

    this.numTriangles = 0;

    // Initialize lighting parameters
    this.lightingEnabled = true; // Enabled by default
    this.ambientIntensity = 0.5;
    this.diffuseIntensity = 0.8;
    this.specularIntensity = 0.5;
    this.lightPosition = [1.0, 1.0, 1.0];
    this.viewPosition = [0.0, 0.0, 3.0];
  }

  setMesh(vertPos, texCoords, normals) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    // Update texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    // Update normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    this.numTriangles = vertPos.length / 3;
  }

  draw(mvp) {
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.mvpLoc, false, mvp);

    // Vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

    // Texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.enableVertexAttribArray(this.texCoordLoc);
    gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.enableVertexAttribArray(this.normalLoc);
    gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

    // Set lighting uniforms
    gl.uniform1i(this.enableLightingLoc, this.lightingEnabled);
    gl.uniform3fv(this.lightPosLoc, this.lightPosition);
    gl.uniform1f(this.ambientLoc, this.ambientIntensity);
    gl.uniform1f(this.diffuseLoc, this.diffuseIntensity);
    gl.uniform1f(this.specularLoc, this.specularIntensity);
    gl.uniform3fv(this.viewPosLoc, this.viewPosition);

    gl.uniform1i(this.showTexLoc, true);

    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
  }

  setTexture(img) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
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

  enableLighting(enable) {
    this.lightingEnabled = enable;
  }

  setLightPosition(x, y, z) {
    this.lightPosition = [x, y, z];
  }

  setAmbientLight(intensity) {
    this.ambientIntensity = intensity;
  }

  setDiffuseLight(intensity) {
    this.diffuseIntensity = intensity;
  }

  setSpecularLight(intensity) {
    this.specularIntensity = intensity;
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

const meshVS = `
  attribute vec3 pos; 
  attribute vec2 texCoord; 
  attribute vec3 normal;

  uniform mat4 mvp; 

  varying vec2 v_texCoord; 
  varying vec3 v_normal; 
  varying vec3 v_fragPos;

  void main()
  {
    v_texCoord = texCoord;
    v_normal = normal;
    v_fragPos = pos;

    gl_Position = mvp * vec4(pos,1);
  }`;

const meshFS = `
  precision mediump float;

  uniform bool showTex;
  uniform bool enableLighting;
  uniform sampler2D tex;
  uniform vec3 lightPos;
  uniform vec3 viewPos;
  uniform float ambient;
  uniform float diffuse;
  uniform float specular;

  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_fragPos;

  void main()
  {
    vec4 texColor = showTex ? texture2D(tex, v_texCoord) : vec4(1.0);

    if(enableLighting){
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(lightPos - v_fragPos);

        float diff = max(dot(normal, lightDir), 0.0);

        vec3 ambientColor = ambient * texColor.rgb;
        vec3 diffuseColor = diffuse * diff * texColor.rgb;

        vec3 viewDir = normalize(viewPos - v_fragPos);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0); // Shininess factor
        vec3 specularColor = specular * spec * texColor.rgb;

        vec3 finalColor = ambientColor + diffuseColor + specularColor;
        gl_FragColor = vec4(finalColor, texColor.a);
    } else {
        gl_FragColor = texColor;
    }
  }`;

document.addEventListener("DOMContentLoaded", () => {
  const ambientSlider = document.getElementById("ambient-light-setter");
  const diffuseSlider = document.getElementById("diffuse-light-setter");
  const specularSlider = document.getElementById("specular-light-setter");

  ambientSlider.value = 50;
  diffuseSlider.value = 80;
  specularSlider.value = 50;

  ambientSlider.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value) / 100;
    meshDrawer.setAmbientLight(value);
    DrawScene();
  });

  diffuseSlider.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value) / 100;
    meshDrawer.setDiffuseLight(value);
    DrawScene();
  });

  specularSlider.addEventListener("input", (event) => {
    const value = parseFloat(event.target.value) / 100;
    meshDrawer.setSpecularLight(value);
    DrawScene();
  });
});

window.addEventListener("load", () => {
  gl = canvas.getContext("webgl");
  initMeshDrawer();
});
