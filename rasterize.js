/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc

var eye;
var lookat;
var up;

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
var view;
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

// read triangles in, load them into webgl buffers
function loadTriangles() {
    blinnphong = 1;
    eye = new vec3.fromValues(0.5,0.5,-0.5)
    up = new vec3.fromValues(0,1,0);
    lookat = new vec3.fromValues(0,0,1);

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

        }
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

    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    /**
      Project description said to use the glMatrix to create my perspective and viewing transforms
      In this block I create the view and perspective matrix then multiply them together in the
      correct order.

      Using this method I can just keep global variables for the eye, lookat, and up vectors and recreate
      the perspective and viewing transforms each time.
     */
    var tmp = mat4.create();
    view = mat4.create();
    mat4.perspective(tmp, Math.PI/2, gl.canvas.clientWidth / gl.canvas.clientHeight, .1, 100);

    var focus = vec3.fromValues(eye[0] + lookat[0], eye[1] + lookat[1], eye[2] + lookat[2]);
    var target = mat4.create();
    mat4.lookAt(target, eye, focus, up);
    mat4.multiply(view, tmp, mat4.lookAt(target, eye, focus, up));

    var fShaderCode = `
        precision mediump float;
        varying lowp vec3 ambColor;
        varying lowp vec3 difColor;
        varying lowp vec3 speColor;
        varying lowp vec3 eyePos;
        varying lowp float n;

        uniform int blinnphong;

        varying lowp vec3 normal;
        varying lowp vec3 fragPos;

        void main(void) {
            // All ambient, diffuse, and specular are 1.
            // So these are all multiplied by 1, so I left
            // them out.
            vec3 lightpos = vec3(-3.0, -1.0, -0.5);
            vec3 lVect = normalize(lightpos - fragPos);
            vec3 vVect = normalize(eyePos - fragPos);

            if (blinnphong == 1) {
                // L <- (N*H)^n
                // H = (L+V)/(||L||+||V||)
                vec3 hVect = (lVect + vVect)/(length(lVect) + length(vVect));
                // (Normal * HVect) ^ (n)
                float specCoef = pow(abs(dot(hVect, normal)), n);

                gl_FragColor = vec4(ambColor + difColor * abs(dot(normal, lVect)) + specCoef*speColor, 1);
            } else {
                // L <- (R*V)^n
                // R = 2N(N*L) – L
                vec3 rVect = 2.0 * normal * ( abs(dot(normal, lVect)) ) - lVect;
                // (R * V) ^ (n)
                float specCoef = pow(dot(rVect, vVect), n);

                gl_FragColor = vec4(ambColor + difColor * abs(dot(normal, lVect)) + specCoef*speColor, 1);
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

        uniform mat4 view;
        uniform vec3 eye;

        varying lowp vec3 ambColor;
        varying lowp vec3 difColor;
        varying lowp vec3 speColor;
        varying lowp vec3 normal;
        varying lowp vec3 eyePos;
        varying lowp float n;

        varying lowp vec3 fragPos;


        void main(void) {
            mat4 transMat = mat4(vertexXTransformVectAttrib,
                                          vertexYTransformVectAttrib,
                                          vertexZTransformVectAttrib,
                                          vertexFTransformVectAttrib);

            gl_Position = view * transMat * vec4(vertexPosition, 1.0);


            ambColor = vertexAmbient;
            difColor = vertexDiffuse;
            speColor = vertexSpecular;
            eyePos = eye;
            n = vertexN;

            // Approximating M^-1 = M^t
            // Giving the equation N = M * Nm
            normal = normalize(vec3(transMat * vec4(vertexNormal, 0)));


            // divide to get homogenous coordinates
            fragPos = vec3(gl_Position) / gl_Position.w;
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

                var viewLoc = gl.getUniformLocation(shaderProgram, "view");
		            gl.uniformMatrix4fv(viewLoc, false, view);

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

function highlightTri() {
    if (selectedTriangle == -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW);
      return;
    }
    var tmpdata = coordArray.slice();

    var sumX = 0;
    var sumY = 0;
    var sumZ = 0;
    for (var start = 0; start < triangleSets[selectedTriangle].length; start += 1) {
        var idx = triangleSets[selectedTriangle][start];
        sumX += coordArray[idx * 3];
        sumY += coordArray[idx * 3 + 1];
        sumZ += coordArray[idx * 3 + 2];
    }
    var centerX = sumX / triangleSets[selectedTriangle].length;
    var centerY = sumY / triangleSets[selectedTriangle].length;
    var centerZ = sumZ / triangleSets[selectedTriangle].length;
    for (var setidx = 0; setidx < triangleSets[selectedTriangle].length; setidx += 1) {

      var toCenter = mat4.fromValues(1, 0, 0, 0,
                                 0, 1, 0, 0,
                                 0, 0, 1, 0,
                                 -centerX, -centerY, -centerZ, 1);

      var toLoc = mat4.fromValues(1, 0, 0, 0,
                                0, 1, 0, 0,
                                0, 0, 1, 0,
                                centerX, centerY, centerZ, 1);

      var scaleM = mat4.fromValues(1.2, 0, 0, 0,
                                   0, 1.2, 0, 0,
                                   0, 0, 1.2, 0,
                                   0, 0, 0, 1);

      var vidx = triangleSets[selectedTriangle][setidx];

      var v = vec4.fromValues(coordArray[vidx * 3], coordArray[vidx * 3 + 1],
                              coordArray[vidx * 3 + 2], 1);

      vec4.transformMat4(v, v, toCenter);

      vec4.transformMat4(v, v, scaleM);

      vec4.transformMat4(v, v, toLoc);

      tmpdata[vidx * 3] = v[0];
      tmpdata[vidx * 3 + 1] = v[1];
      tmpdata[vidx * 3 + 2] = v[2];
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tmpdata),gl.STATIC_DRAW);
}


var xTrans = vec3.fromValues(.01, 0, 0);
var yTrans = vec3.fromValues(0, .01, 0);
var zTrans = vec3.fromValues(0, 0, .01);

var rot = .1;

document.addEventListener('keydown', function(keypress) {
    if (keypress.key == "a") {
      // get the xaxis direction
      var dir = vec3.create();
      vec3.cross(dir, up, lookat);
      vec3.normalize(dir, dir);
      vec3.scale(dir, dir, .01);
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "d") {
      var dir = vec3.create();
      vec3.cross(dir, up, lookat);
      vec3.normalize(dir, dir);
      vec3.scale(dir, dir, -.01);
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "w") {
      // in this case our axis would just be in the direction of the lookat vector
      var dir = vec3.create();
      vec3.normalize(dir, lookat);
      vec3.scale(dir, dir, .01)
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "s") {
      var dir = vec3.create();
      vec3.normalize(dir, lookat);
      vec3.scale(dir, dir, -.01)
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "q") {
      // in this case our axis would be in the direction of the up vector
      var dir = vec3.create();
      vec3.normalize(dir, up);
      vec3.scale(dir, dir, .01)
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "e") {
      var dir = vec3.create();
      vec3.normalize(dir, up);
      vec3.scale(dir, dir, -.01)
      vec3.add(eye, eye, dir);
      vec3.add(lookat, lookat, dir);
    }

    if (keypress.key == "A") {
      // I create this temp value for all rotations so they are about the origin
      // and not the x axis. I then leave 'eye' alone, which will produce the
      // expected rotation effect.
      var temp = vec3.fromValues(0, 0, 0);
      vec3.rotateY(up, up, temp, rot);
      vec3.rotateY(lookat, lookat, temp, rot);
    }

    if (keypress.key == "D") {
      var temp = vec3.fromValues(0, 0, 0);
      vec3.rotateY(up, up, temp, -rot);
      vec3.rotateY(lookat, lookat, temp, -rot);
    }

    if (keypress.key == "W") {
      var temp = vec3.fromValues(0, 0, 0);
      vec3.rotateX(up, up, temp, -rot);
      vec3.rotateX(lookat, lookat, temp, -rot);
    }

    if (keypress.key == "S") {
      var temp = vec3.fromValues(0, 0, 0);
      vec3.rotateX(up, up, temp, rot);
      vec3.rotateX(lookat, lookat, temp, rot);
    }


    if (keypress.key == "ArrowLeft") {
      if (selectedTriangle <= 0) {
        selectedTriangle = numTriangleSets - 1;
      } else {
        selectedTriangle -= 1;
      }
      highlightTri();

    }

    if (keypress.key == "ArrowRight") {
      if (selectedTriangle >= numTriangleSets - 1) {
        selectedTriangle = 0;
      } else {
        selectedTriangle += 1;
      }
      highlightTri();

    }

    if (keypress.key == " ") {
      selectedTriangle = -1;
      highlightTri();
    }

    if (keypress.key == "b" ) {
      if ( blinnphong == 1 ) {
        blinnphong = 0;
      } else {
        blinnphong = 1;
      }
    }

    // ambient
    if (keypress.key == "1") {
        if (selectedTriangle == -1) {
            return 0;
        }

        for (var setidx = 0; setidx < triangleSets[selectedTriangle].length; setidx++) {
          var v = triangleSets[selectedTriangle][setidx] * 3;

          ambient[v] = (ambient[v] + .1) % 1;
          ambient[v + 1] = (ambient[v + 1] + .1) % 1;
          ambient[v + 2] = (ambient[v + 2] + .1) % 1;

        }

        gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambient), gl.STATIC_DRAW);

    }

    // diffuse
    if (keypress.key == "2") {
        if (selectedTriangle == -1) {
            return 0;
        }


        for (var setidx = 0; setidx < triangleSets[selectedTriangle].length; setidx++) {
          var v = triangleSets[selectedTriangle][setidx] * 3;

          diffuse[v] = (diffuse[v] + .1) % 1;
          diffuse[v + 1] = (diffuse[v + 1] + .1) % 1;
          diffuse[v + 2] = (diffuse[v + 2] + .1) % 1;

        }

        gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuse), gl.STATIC_DRAW);
    }

    // specular
    if (keypress.key == "3") {
        if (selectedTriangle == -1) {
            return 0;
        }

        for (var setidx = 0; setidx < triangleSets[selectedTriangle].length; setidx++) {
          var v = triangleSets[selectedTriangle][setidx] * 3;
          specular[v] = (specular[v] + .1) % 1;
          specular[v + 1] = (specular[v + 1] + .1) % 1;
          specular[v + 2] = (specular[v + 2] + .1) % 1;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specular), gl.STATIC_DRAW);
    }

    if (keypress.key == "n") {
        if (selectedTriangle == -1) {
            return 0;
        }
        for (var setidx = 0; setidx < triangleSets[selectedTriangle].length; setidx++) {
          var v = triangleSets[selectedTriangle][setidx];

          n[v] = (n[v] + 1) % 20;

        }

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);
    }

    // translate selection left
    if (keypress.key == "k") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(0.1,0,0));
    }

    if (keypress.key == ";") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(-0.1,0,0));
    }

    if (keypress.key == "o") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(0,0,0.1));
    }

    if (keypress.key == "l") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(0,0,-0.1));
    }

    if (keypress.key == "i") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(0,0.1,0));
    }

    if (keypress.key == "p") {
      if (selectedTriangle == -1) {
        return;
      }
      translate(vec3.fromValues(0,-0.1,0));
    }

    // yaw --> around Y axis
    if (keypress.key == "K") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateY(.1);
    }

    if (keypress.key == ":") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateY(-.1);
    }

    // pitch
    if (keypress.key == "O") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateX(.1);
    }

    if (keypress.key == "L") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateX(-.1);
    }

    // roll
    if (keypress.key == "I") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateZ(-.1);
    }

    if (keypress.key == "P") {
      if (selectedTriangle == -1) {
        return;
      }
      rotateZ(.1);
    }

    setupShaders();

});

function getCenter() {
  var sumX = 0;
  var sumY = 0;
  var sumZ = 0;
  for (var start = 0; start < triangleSets[selectedTriangle].length; start += 1) {
      var idx = triangleSets[selectedTriangle][start];
      var row1 = xtransformArray.slice(idx*4, idx*4+4);
      var row2 = ytransformArray.slice(idx*4, idx*4+4);
      var row3 = ztransformArray.slice(idx*4, idx*4+4);
      var row4 = ftransformArray.slice(idx*4, idx*4+4);

      var buffmatrix = mat4.fromValues(row1[0], row1[1], row1[2], row1[3],
                                       row2[0], row2[1], row2[2], row2[3],
                                       row3[0], row3[1], row3[2], row3[3],
                                       row4[0], row4[1], row4[2], row4[3]);
      var v = vec4.create()
      vec4.transformMat4(v, vec4.fromValues(coordArray[idx*3],
                                            coordArray[idx*3 + 1],
                                            coordArray[idx*3 + 2],1), buffmatrix);
      sumX += v[0];
      sumY += v[1];
      sumZ += v[2];
  }
  return [sumX / triangleSets[selectedTriangle].length,
  centerY = sumY / triangleSets[selectedTriangle].length,
  centerZ = sumZ / triangleSets[selectedTriangle].length];
}

function rotateY(val) {
  //rotate LEFT

  //translate to center
  var cent = getCenter()

  translate(vec3.fromValues(-cent[0], -cent[1], -cent[2]));

  // create rotation matrix
  var rotY = mat4.fromValues( Math.cos(val), 0, -Math.sin(val), 0,
                              0, 1, 0, 0,
                              Math.sin(val), 0, Math.cos(val), 0,
                              0, 0, 0, 1);

  // rotate
  visited = [];
  for( var step = 0; step < triangleSets[selectedTriangle].length; step++) {
      var idx = triangleSets[selectedTriangle][step];
      if (visited.includes(idx)){
        continue;
      } else {
        visited.push(idx);
      }
      var row1 = xtransformArray.slice(idx*4, idx*4+4);
      var row2 = ytransformArray.slice(idx*4, idx*4+4);
      var row3 = ztransformArray.slice(idx*4, idx*4+4);
      var row4 = ftransformArray.slice(idx*4, idx*4+4);

      var buffmatrix = mat4.fromValues(row1[0], row1[1], row1[2], row1[3],
                                       row2[0], row2[1], row2[2], row2[3],
                                       row3[0], row3[1], row3[2], row3[3],
                                       row4[0], row4[1], row4[2], row4[3]);

      mat4.multiply(buffmatrix, rotY, buffmatrix);

      for(var rep = 0; rep < 4; rep++) {
        xtransformArray[idx*4 + rep] = buffmatrix[rep];
        ytransformArray[idx*4 + rep] = buffmatrix[4 + rep];
        ztransformArray[idx*4 + rep] = buffmatrix[8 + rep];
        ftransformArray[idx*4 + rep] = buffmatrix[12 + rep];
      }
 }

  // translate back to original

  translate(vec3.fromValues(cent[0], cent[1], cent[2]));
}

function rotateX(val) {
  //translate to center
  var cent = getCenter()

  translate(vec3.fromValues(-cent[0], -cent[1], -cent[2]));

  // create rotation matrix
  var rotX = mat4.fromValues( 1, 0, 0, 0,
                              0, Math.cos(val), Math.sin(val), 0,
                              0, -Math.sin(val), Math.cos(val), 0,
                              0, 0, 0, 1);

  // rotate
  visited = [];
  for( var step = 0; step < triangleSets[selectedTriangle].length; step++) {
      var idx = triangleSets[selectedTriangle][step];
      if (visited.includes(idx)){
        continue;
      } else {
        visited.push(idx);
      }
      var row1 = xtransformArray.slice(idx*4, idx*4+4);
      var row2 = ytransformArray.slice(idx*4, idx*4+4);
      var row3 = ztransformArray.slice(idx*4, idx*4+4);
      var row4 = ftransformArray.slice(idx*4, idx*4+4);

      var buffmatrix = mat4.fromValues(row1[0], row1[1], row1[2], row1[3],
                                       row2[0], row2[1], row2[2], row2[3],
                                       row3[0], row3[1], row3[2], row3[3],
                                       row4[0], row4[1], row4[2], row4[3]);

      mat4.multiply(buffmatrix, rotX, buffmatrix);

      for(var rep = 0; rep < 4; rep++) {
        xtransformArray[idx*4 + rep] = buffmatrix[rep];
        ytransformArray[idx*4 + rep] = buffmatrix[4 + rep];
        ztransformArray[idx*4 + rep] = buffmatrix[8 + rep];
        ftransformArray[idx*4 + rep] = buffmatrix[12 + rep];
      }
 }

  // translate back to original

  translate(vec3.fromValues(cent[0], cent[1], cent[2]));
}

function rotateZ(val) {
  var cent = getCenter()

  translate(vec3.fromValues(-cent[0], -cent[1], -cent[2]));

  // create rotation matrix
  var rotZ = mat4.fromValues( Math.cos(val), Math.sin(val), 0, 0,
                              -Math.sin(val), Math.cos(val), 0, 0,
                              0, 0, 1, 0,
                              0, 0, 0, 1);

  // rotate
  visited = [];
  for( var step = 0; step < triangleSets[selectedTriangle].length; step++) {
      var idx = triangleSets[selectedTriangle][step];
      if (visited.includes(idx)){
        continue;
      } else {
        visited.push(idx);
      }
      var row1 = xtransformArray.slice(idx*4, idx*4+4);
      var row2 = ytransformArray.slice(idx*4, idx*4+4);
      var row3 = ztransformArray.slice(idx*4, idx*4+4);
      var row4 = ftransformArray.slice(idx*4, idx*4+4);

      var buffmatrix = mat4.fromValues(row1[0], row1[1], row1[2], row1[3],
                                       row2[0], row2[1], row2[2], row2[3],
                                       row3[0], row3[1], row3[2], row3[3],
                                       row4[0], row4[1], row4[2], row4[3]);

      mat4.multiply(buffmatrix, rotZ, buffmatrix);

      for(var rep = 0; rep < 4; rep++) {
        xtransformArray[idx*4 + rep] = buffmatrix[rep];
        ytransformArray[idx*4 + rep] = buffmatrix[4 + rep];
        ztransformArray[idx*4 + rep] = buffmatrix[8 + rep];
        ftransformArray[idx*4 + rep] = buffmatrix[12 + rep];
      }
 }

  // translate back to original

  translate(vec3.fromValues(cent[0], cent[1], cent[2]));
}

function translate(vec) {
  // determine selected triangle set -> 3+ vertices
  visited = [];
  for( var step = 0; step < triangleSets[selectedTriangle].length; step++) {
      var idx = triangleSets[selectedTriangle][step];
      if (visited.includes(idx)){
        continue;
      } else {
        visited.push(idx);
      }
      var row1 = xtransformArray.slice(idx*4, idx*4+4);
      var row2 = ytransformArray.slice(idx*4, idx*4+4);
      var row3 = ztransformArray.slice(idx*4, idx*4+4);
      var row4 = ftransformArray.slice(idx*4, idx*4+4);

      var buffmatrix = mat4.fromValues(row1[0], row1[1], row1[2], row1[3],
                                       row2[0], row2[1], row2[2], row2[3],
                                       row3[0], row3[1], row3[2], row3[3],
                                       row4[0], row4[1], row4[2], row4[3]);

      var transMatrix = mat4.fromValues(1, 0, 0, 0,
                                        0, 1, 0, 0,
                                        0, 0, 1, 0,
                                        vec[0], vec[1], vec[2], 1);

      mat4.multiply(buffmatrix, transMatrix, buffmatrix);

      for(var rep = 0; rep < 4; rep++) {
        xtransformArray[idx*4 + rep] = buffmatrix[rep];
        ytransformArray[idx*4 + rep] = buffmatrix[4 + rep];
        ztransformArray[idx*4 + rep] = buffmatrix[8 + rep];
        ftransformArray[idx*4 + rep] = buffmatrix[12 + rep];
      }

  }
  gl.bindBuffer(gl.ARRAY_BUFFER, xtransformVectBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(xtransformArray), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ytransformVectBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ytransformArray), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ztransformVectBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ztransformArray), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ftransformVectBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ftransformArray), gl.STATIC_DRAW);
}

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
