/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://rjmontgo.github.io/prog3/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc

var eye = new vec3.fromValues(0.5,0.5,-0.5);
var lookat = new vec3.fromValues(0,0,1);
var fov = Math.PI / 2;
var up = new vec3.fromValues(0,1,0);
var clipnear = 0.1;
var clipfar = 300;
var light = new vec3.fromValues(-3,1,-.5);

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var normalBuffer; // contains vertex normals
var triangleBuffer; // this contains indices into vertexBuffer in triples
var numTriangles;
var ambientBuffer;
var diffuseBuffer;
var specularBuffer;
var xtransformVectBuffer;
var ytransformVectBuffer;
var ztransformVectBuffer;
var ftransformVectBuffer;
var nBuffer;
var triBufferSize; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexAmbientAttrib;
var vertexDiffuseAttrib;
var vertexSpecularAttrib;
var vertexNormalAttrib;
var vertexNAttrib;
var vertexXTransformVectAttrib;
var vertexYTransformVectAttrib;
var vertexZTransformVectAttrib;
var vertexFTransformVectAttrib;
var perspective;
var numTriangles;
var selectedTriangle;
var triangleSets;
var numTriangleSets;
var coordArray;
var triArray;
var xtransformArray;
var ytransformArray;
var ztransformArray;
var ftransformArray;

var blinnphong;
var ambient;
var diffuse;
var specular;
var n;


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response);
        } // end if good params
    } // end try

    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it

    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try

    catch(e) {
      console.log(e);
    } // end catch

} // end setupWebGL

function reset() {
  var frust = mat4.create();
  perspective = mat4.create()
  mat4.perspective(frust, fov, gl.canvas.clientWidth / gl.canvas.clientHeight, clipnear, clipfar);

  var center = vec3.create();
  vec3.add(center, eye, lookat);

  var target = mat4.create();
  mat4.lookAt(target, eye, center, up);
  mat4.multiply(perspective, frust, target);
}

// read triangles in, load them into webgl buffers
function loadTriangles() {
    blinnphong = 1;
    var frust = mat4.create();
    perspective = mat4.create()
    mat4.perspective(frust, fov, gl.canvas.clientWidth / gl.canvas.clientHeight, clipnear, clipfar);

    var center = vec3.create();
    vec3.add(center, eye, lookat);

    var target = mat4.create();
    mat4.lookAt(target, eye, center, up);
    mat4.multiply(perspective, frust, target);

    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var whichSetColor;
        coordArray = []; // 1D array of vertex coords for WebGL
        triArray = []; // 1D array of triangle vertex indices
        var normalArray = [];
        ambient = [];
        diffuse = [];
        specular = [];
        n = [];
        numVerts = 0;
        numTriangles = 0;
        selectedTriangle = -1;

        numTriangleSets = 0;
        triangleSets = [];

        xtransformArray = [];
        ytransformArray = [];
        ztransformArray = [];
        ftransformArray = [];

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            triangleSets[whichSet] = []
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                normalArray = normalArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
                ambient = ambient.concat(inputTriangles[whichSet].material.ambient);
                diffuse = diffuse.concat(inputTriangles[whichSet].material.diffuse);
                specular = specular.concat(inputTriangles[whichSet].material.specular);
                n = n.concat(inputTriangles[whichSet].material.n);

                // console.log(inputTriangles[whichSet].vertices[whichSetVert]);
            }

            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){
                for (var indx=0; indx<inputTriangles[whichSet].triangles[whichSetTri].length; indx++){
                    triArray.push(inputTriangles[whichSet].triangles[whichSetTri][indx] + numVerts);
                    xtransformArray = xtransformArray.concat([1, 0, 0, 0]);
                    ytransformArray = ytransformArray.concat([0, 1, 0, 0]);
                    ztransformArray = ztransformArray.concat([0, 0, 1, 0]);
                    ftransformArray = ftransformArray.concat([0, 0, 0, 1]);
                    triangleSets[whichSet].push(inputTriangles[whichSet].triangles[whichSetTri][indx] + numVerts);
                }
                numTriangles += 1;
            }
            numTriangleSets += 1
            numVerts += inputTriangles[whichSet].vertices.length

        } // end for each triangle set
        // console.log(coordArray.length);
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW);

        // Create element buffer
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triArray), gl.STATIC_DRAW);
        triBufferSize = triArray.length;

        xtransformVectBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, xtransformVectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(xtransformArray), gl.STATIC_DRAW);

        ytransformVectBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ytransformVectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ytransformArray), gl.STATIC_DRAW);

        ztransformVectBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ztransformVectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ztransformArray), gl.STATIC_DRAW);

        ftransformVectBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ftransformVectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ftransformArray), gl.STATIC_DRAW);

        // create color buffer
        ambientBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambient), gl.STATIC_DRAW);

        diffuseBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuse), gl.STATIC_DRAW);

        specularBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specular), gl.STATIC_DRAW);

        nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);

    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {

    // vec3 lpos = vec3(-3, 1, -.5);
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying lowp vec3 aColor;
        varying lowp vec3 dColor;
        varying lowp vec3 sColor;
        varying lowp vec3 eyePos;
        varying lowp float n;

        uniform int blinnphong;

        varying lowp vec3 normal;
        varying lowp vec3 pos;

        vec3 lpos = vec3(-3.0, -1.0, -0.5);

        void main(void) {
            vec3 lVect = normalize(lpos - pos);
            vec3 vVect = normalize(eyePos - pos);

            if (blinnphong == 1) {
                vec3 hVect = (lVect + vVect)/(length(lVect) + length(vVect));
                float specCoef = pow(dot(hVect, normal), n);
                gl_FragColor = vec4(aColor + dColor * dot(normal, lVect) + specCoef*sColor, 1);
            } else {
                vec3 rVect = 2.0 * normal * ( dot(normal, lVect) ) - lVect;
                float specCoef = pow(dot(rVect, vVect), n);
                gl_FragColor = vec4(aColor + dColor * dot(normal, lVect) + specCoef*sColor, 1);
            }
        }
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec4 vertexXTransformVectAttrib;
        attribute vec4 vertexYTransformVectAttrib;
        attribute vec4 vertexZTransformVectAttrib;
        attribute vec4 vertexFTransformVectAttrib;

        attribute vec3 vertexPosition;
        attribute vec3 vertexAmbient;
        attribute vec3 vertexDiffuse;
        attribute vec3 vertexSpecular;
        attribute vec3 vertexNormal;
        attribute lowp float vertexN;

        uniform mat4 perspective;
        uniform vec3 eye;

        varying lowp vec3 aColor;
        varying lowp vec3 dColor;
        varying lowp vec3 sColor;
        varying lowp vec3 normal;
        varying lowp vec3 eyePos;
        varying lowp float n;

        varying lowp vec3 pos;


        void main(void) {
            mat4 transMat = mat4(vertexXTransformVectAttrib,
                                          vertexYTransformVectAttrib,
                                          vertexZTransformVectAttrib,
                                          vertexFTransformVectAttrib);

            gl_Position = perspective * transMat * vec4(vertexPosition, 1.0); // use the untransformed position


            aColor = vertexAmbient;
            dColor = vertexDiffuse;
            sColor = vertexSpecular;
            eyePos = eye;
            n = vertexN;

            normal = vertexNormal;

            pos = vec3(gl_Position) / gl_Position.w;
        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution

        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexAmbientAttrib = gl.getAttribLocation(shaderProgram, "vertexAmbient");
                gl.enableVertexAttribArray(vertexAmbientAttrib);

                vertexDiffuseAttrib = gl.getAttribLocation(shaderProgram, "vertexDiffuse");
                gl.enableVertexAttribArray(vertexDiffuseAttrib);

                vertexSpecularAttrib = gl.getAttribLocation(shaderProgram, "vertexSpecular");
                gl.enableVertexAttribArray(vertexSpecularAttrib);

                vertexNAttrib = gl.getAttribLocation(shaderProgram, "vertexN");
                gl.enableVertexAttribArray(vertexNAttrib);

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib);

                vertexXTransformVectAttrib = gl.getAttribLocation(shaderProgram, "vertexXTransformVectAttrib");
                gl.enableVertexAttribArray(vertexXTransformVectAttrib);

                vertexYTransformVectAttrib = gl.getAttribLocation(shaderProgram, "vertexYTransformVectAttrib");
                gl.enableVertexAttribArray(vertexYTransformVectAttrib);

                vertexZTransformVectAttrib = gl.getAttribLocation(shaderProgram, "vertexZTransformVectAttrib");
                gl.enableVertexAttribArray(vertexZTransformVectAttrib);

                vertexFTransformVectAttrib = gl.getAttribLocation(shaderProgram, "vertexFTransformVectAttrib");
                gl.enableVertexAttribArray(vertexFTransformVectAttrib);

                var perploc = gl.getUniformLocation(shaderProgram, "perspective");
		            gl.uniformMatrix4fv(perploc, false, perspective);

                var eyeLoc = gl.getUniformLocation(shaderProgram, "eye");
                gl.uniform3fv(eyeLoc, eye);

                var blinnphongloc = gl.getUniformLocation(shaderProgram, "blinnphong");
                gl.uniform1i(blinnphongloc, blinnphong);

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try

    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

var xTrans = vec3.fromValues(.01, 0, 0);
var yTrans = vec3.fromValues(0, .01, 0);
var zTrans = vec3.fromValues(0, 0, .01);

var rot = .1;

function highlightTri() {
    if (selectedTriangle == -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW);
    }
    var v1idx = triArray[selectedTriangle*3] * 3
    var v2idx = triArray[selectedTriangle*3 + 1] * 3
    var v3idx = triArray[selectedTriangle*3 + 2] * 3

    //coordArray
    var v1 = vec4.fromValues(coordArray[v1idx], coordArray[v1idx + 1],
                             coordArray[v1idx + 2], 1);

    var v2 = vec4.fromValues(coordArray[v2idx], coordArray[v2idx + 1],
                             coordArray[v2idx + 2], 1);

    var v3 = vec4.fromValues(coordArray[v3idx], coordArray[v3idx + 1],
                             coordArray[v3idx + 2], 1);

    var tv1 = mat4.create();
    var tv2 = mat4.create();
    var tv3 = mat4.create();

    mat4.multiply(tv1, mat4.fromValues(1.2, 0, 0, 0,
                                       0, 1.2, 0, 0,
                                       0, 0, 1.2, 0,
                                       0, 0, 0, 1),

                       mat4.fromValues(v1[0], 0, 0, 0,
                                       0, v1[1], 0, 0,
                                       0, 0, v1[2], 0,
                                       0, 0, 0, 1));

     mat4.multiply(tv2, mat4.fromValues(1.2, 0, 0, 0,
                                        0, 1.2, 0, 0,
                                        0, 0, 1.2, 0,
                                        0, 0, 0, 1),

                        mat4.fromValues(v2[0], 0, 0, 0,
                                        0, v2[1], 0, 0,
                                        0, 0, v2[2], 0,
                                        0, 0, 0, 1));


      mat4.multiply(tv3, mat4.fromValues(1.2, 0, 0, 0,
                                         0, 1.2, 0, 0,
                                         0, 0, 1.2, 0,
                                         0, 0, 0, 1),

                         mat4.fromValues(v3[0], 0, 0, 0,
                                         0, v3[1], 0, 0,
                                         0, 0, v3[2], 0,
                                         0, 0, 0, 1));

    var tmpdata = coordArray.slice();
    tmpdata[v1idx] = tv1[0];
    tmpdata[v1idx + 1] = tv1[5];
    tmpdata[v1idx + 2] = tv1[10];

    tmpdata[v2idx] = tv2[0];
    tmpdata[v2idx + 1] = tv2[5];
    tmpdata[v2idx + 2] = tv2[10];

    tmpdata[v3idx] = tv3[0];
    tmpdata[v3idx + 1] = tv3[5];
    tmpdata[v3idx + 2] = tv3[10];

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tmpdata),gl.STATIC_DRAW);
}

document.addEventListener('keydown', function(event) {
    if (event.key == "a") {
    	vec3.add(eye, eye, xTrans);
      vec3.add(lookat, lookat, xTrans);
    }

    if (event.key == "d") {
      vec3.sub(eye, eye, xTrans);
      vec3.sub(lookat, lookat, xTrans);
    }

    if (event.key == "w") {
      vec3.add(eye, eye, zTrans);
      vec3.add(lookat, lookat, zTrans);
    }

    if (event.key == "s") {
      vec3.sub(eye, eye, zTrans);
      vec3.sub(lookat, lookat, zTrans);
    }

    if (event.key == "q") {
      vec3.add(eye, eye, yTrans);
      vec3.add(lookat, lookat, yTrans);
    }

    if (event.key == "e") {
      vec3.sub(eye, eye, yTrans);
      vec3.sub(lookat, lookat, yTrans);
    }

    if (event.key == "A") {
      vec3.rotateY(lookat, lookat, eye, rot);
    }

    if (event.key == "D") {
      vec3.rotateY(lookat, lookat, eye, -rot);
    }

    if (event.key == "W") {
      console.log("here");
      vec3.rotateX(lookat, lookat, eye, rot);
      vec3.rotateX(up, up, eye, rot);
    }

    if (event.key == "S") {
      console.log("here");
      vec3.rotateX(up, up, eye, -rot);
    }

    if (event.key == "ArrowLeft") {
      if (selectedTriangle <= 0) {
        selectedTriangle = numTriangleSets - 1;
      } else {
        selectedTriangle -= 1;
      }
      highlightTri();

    }

    if (event.key == "ArrowRight") {
      if (selectedTriangle >= numTriangleSets) {
        selectedTriangle = 0;
      } else {
        selectedTriangle += 1;
      }
      highlightTri();

    }

    if (event.key == " ") {
      selectedTriangle = -1;
      highlightTri();
    }


    // uniform variable blinn/phong
    // check if it is set in the shader and apply correct model

    if (event.key == "b" ) {
      if ( blinnphong == 1 ) {
        blinnphong = 0;
      } else {
        blinnphong = 1;
      }
    }

    // ambient
    if (event.key == "1") {
        if (selectedTriangle == -1) {
            return 0;
        }
        var v1idx = triArray[selectedTriangle*3] * 3
        var v2idx = triArray[selectedTriangle*3 + 1] * 3
        var v3idx = triArray[selectedTriangle*3 + 2] * 3

        ambient[v1idx] = (ambient[v1idx] + .1) % 1;
        ambient[v1idx + 1] = (ambient[v1idx + 1] + .1) % 1;
        ambient[v1idx + 2] = (ambient[v1idx + 2] + .1) % 1;

        ambient[v2idx] = (ambient[v2idx] + .1) % 1;
        ambient[v2idx + 1] = (ambient[v2idx + 1] + .1) % 1;
        ambient[v2idx + 2] = (ambient[v2idx + 2] + .1) % 1;

        ambient[v3idx] = (ambient[v3idx] + .1) % 1;
        ambient[v3idx + 1] = (ambient[v3idx + 1] + .1) % 1;
        ambient[v3idx + 2] = (ambient[v3idx + 2] + .1) % 1;

        gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambient), gl.STATIC_DRAW);

    }

    // diffuse
    if (event.key == "2") {
        if (selectedTriangle == -1) {
            return 0;
        }
        var v1idx = triArray[selectedTriangle*3] * 3
        var v2idx = triArray[selectedTriangle*3 + 1] * 3
        var v3idx = triArray[selectedTriangle*3 + 2] * 3

        diffuse[v1idx] = (diffuse[v1idx] + .1) % 1;
        diffuse[v1idx + 1] = (diffuse[v1idx + 1] + .1) % 1;
        diffuse[v1idx + 2] = (diffuse[v1idx + 2] + .1) % 1;

        diffuse[v2idx] = (diffuse[v2idx] + .1) % 1;
        diffuse[v2idx + 1] = (diffuse[v2idx + 1] + .1) % 1;
        diffuse[v2idx + 2] = (diffuse[v2idx + 2] + .1) % 1;

        diffuse[v3idx] = (diffuse[v3idx] + .1) % 1;
        diffuse[v3idx + 1] = (diffuse[v3idx + 1] + .1) % 1;
        diffuse[v3idx + 2] = (diffuse[v3idx + 2] + .1) % 1;

        gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuse), gl.STATIC_DRAW);
    }

    // specular
    if (event.key == "3") {
        if (selectedTriangle == -1) {
            return 0;
        }
        var v1idx = triArray[selectedTriangle*3] * 3
        var v2idx = triArray[selectedTriangle*3 + 1] * 3
        var v3idx = triArray[selectedTriangle*3 + 2] * 3

        specular[v1idx] = (specular[v1idx] + .1) % 1;
        specular[v1idx + 1] = (specular[v1idx + 1] + .1) % 1;
        specular[v1idx + 2] = (specular[v1idx + 2] + .1) % 1;

        specular[v2idx] = (specular[v2idx] + .1) % 1;
        specular[v2idx + 1] = (specular[v2idx + 1] + .1) % 1;
        specular[v2idx + 2] = (specular[v2idx + 2] + .1) % 1;

        specular[v3idx] = (specular[v3idx] + .1) % 1;
        specular[v3idx + 1] = (specular[v3idx + 1] + .1) % 1;
        specular[v3idx + 2] = (specular[v3idx + 2] + .1) % 1;
        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specular), gl.STATIC_DRAW);
    }

    if (event.key == "n") {
        if (selectedTriangle == -1) {
            return 0;
        }
        var v1idx = triArray[selectedTriangle*3] * 3
        var v2idx = triArray[selectedTriangle*3 + 1] * 3
        var v3idx = triArray[selectedTriangle*3 + 2] * 3

        specular[v1idx] = (specular[v1idx] + .1) % 1;
        specular[v1idx + 1] = (specular[v1idx] + .1) % 1;
        specular[v1idx + 2] = (specular[v1idx] + .1) % 1;

        specular[v2idx] = (specular[v2idx] + .1) % 1;
        specular[v2idx + 1] = (specular[v2idx] + .1) % 1;
        specular[v2idx + 2] = (specular[v2idx] + .1) % 1;

        specular[v3idx] = (specular[v3idx] + .1) % 1;
        specular[v3idx + 1] = (specular[v3idx] + .1) % 1;
        specular[v3idx + 2] = (specular[v3idx] + .1) % 1;

        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specular), gl.STATIC_DRAW);
    }



    // break out the colorArray as a set of attributes.
    // update and rebuffer the colorArray (we can store our changes in there)


    reset();
    setupShaders();

});

var bgColor = 0;
// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    gl.clearColor(0, 0, 0, 1.0);
    requestAnimationFrame(renderTriangles);

    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer);
    gl.vertexAttribPointer(vertexAmbientAttrib, 3, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer);
    gl.vertexAttribPointer(vertexDiffuseAttrib, 3, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer);
    gl.vertexAttribPointer(vertexSpecularAttrib, 3, gl.FLOAT, false, 0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer);
    gl.vertexAttribPointer(vertexNAttrib, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
    gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER,xtransformVectBuffer);
    gl.vertexAttribPointer(vertexXTransformVectAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER,ytransformVectBuffer);
    gl.vertexAttribPointer(vertexYTransformVectAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER,ztransformVectBuffer);
    gl.vertexAttribPointer(vertexZTransformVectAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER,ftransformVectBuffer);
    gl.vertexAttribPointer(vertexFTransformVectAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
    gl.drawElements(gl.TRIANGLES, triBufferSize, gl.UNSIGNED_SHORT, 0); // render
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {

  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL

} // end main
