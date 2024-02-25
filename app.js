// WebGL context
let gl;
let canvas;

// Two lists holding the vertex and fragment shader
let vertexShaderSource = [
    'precision mediump float;',
    '',
    'attribute vec3 Positions;',
    'attribute vec3 Colors;',
    'attribute vec3 Normals;',
    'varying vec3 VertexColor;',
    'varying vec3 FragPos;',
    'varying vec3 Normal;',
    'varying vec3 directionToView;',
    'uniform mat4 worldMatrix;',
    'uniform mat4 viewMatrix;',
    'uniform mat4 projMatrix;',
    'uniform mediump int objectNumber;',
    'uniform mat4 worldGlobalSourceMat;',
    'uniform mat4 worldSpotlightMat;',
    'uniform vec3 viewPosition;',
    '',
    'void main()',
    '{',
    'VertexColor = Colors;',
    'FragPos = (worldMatrix * vec4(Positions, 1.0)).xyz;',
    'Normal = normalize((worldMatrix * vec4(Normals, 0.0)).xyz);',
    'directionToView = viewPosition - FragPos;',
    '',
    'if (objectNumber == 0)',
    '{',
    'gl_Position = projMatrix * viewMatrix * worldMatrix * vec4(Positions, 1.0);',
    '}',
    '',
    'else if (objectNumber == 1)',
    '{',
    'gl_Position = projMatrix * viewMatrix * worldGlobalSourceMat * vec4(Positions, 1.0);',
    '}',
    'else if (objectNumber == 2)',
    '{',
    'gl_Position = projMatrix * viewMatrix * worldSpotlightMat * vec4(Positions, 1.0);',
    '}',
    '}'
].join('\n');
let fragmentShaderSource = [
    'precision mediump float;',
    '',
    'varying vec3 VertexColor;',
    'varying vec3 FragPos;',
    'varying vec3 Normal;',
    'varying vec3 directionToView;',
    'uniform mediump int objectNumber;',
    'uniform mat4 worldGlobalSourceMat;',
    'uniform vec3 lightPosition;',
    'uniform vec3 SpotlightPos;',
    'uniform vec3 LightDirection;',
    'uniform float Limit;',
    'uniform mat4 worldSpotlightMat;',
    'uniform float shininess;',
    '',
    'void main()',
    '{',
    'if (objectNumber == 0)',
    '{',

    '// CALCULATING THE AMBIENT COLOR',
    'gl_FragColor.rgb = 0.6 * vec3(0.52, 0.37, 0.26);',


    '// CALCULATING LIGHT FROM THE GLOBAL SOURCE',
    'vec3 lightPos = (worldGlobalSourceMat * vec4(lightPosition, 1.0)).xyz;',
    'vec3 offset = lightPos - FragPos;',
    'vec3 directionToLight = normalize(offset);',
    'float diffuse = max(0.0, dot(Normal, directionToLight));',
    'gl_FragColor.rgb *= (diffuse + vec3(0.52, 0.37, 0.26));',
    '',

    '// CALCULATING THE SPECULAR HIGHLIGHTING',
    'vec3 directionToViewNormalized = normalize(directionToView);',
    'vec3 halfVector = normalize(directionToLight + directionToViewNormalized);',
    '',
    'float specular = 0.0;',
    'if (diffuse > 0.0) {',
    'specular = pow(dot(Normal, halfVector), shininess);',
    '}',
    'gl_FragColor.rgb += specular;',
    '',


    '// CALCULATING LIGHT FROM THE SPOTLIGHT',
    'vec3 surfaceToLightDirection = SpotlightPos - FragPos;',
    'vec3 lightDirectionAfterRotation = (worldSpotlightMat * vec4(LightDirection, 0.0)).xyz;',
    'surfaceToLightDirection = normalize(surfaceToLightDirection);',
    'float dotFromDirection = dot(surfaceToLightDirection, -lightDirectionAfterRotation);',
    '',
    'if (dotFromDirection >= Limit)',
    '{',
    'float spotlight = dot(Normal, surfaceToLightDirection);',
    'gl_FragColor.rgb += (spotlight * vec3(0.5, 0.5, 0.1));',
    '}',
    '',

    'gl_FragColor.a = 1.0;',
    '}',
    'else if (objectNumber == 1 || objectNumber == 2)',
    '{',
    'gl_FragColor= vec4(VertexColor, 1.0);',
    '}',
    '}'
].join('\n');

window.onload = function setup () {

    // Initialize the context
    init();

    // Fill the positions array and the colors array for the buffers.
    fillPositionsAndColors();

    // Fill the array with wireframes vertices and colors.
    fillPositionsAndColorsWireframes();

    // Calculate the Normals of each fragment
    calculateNormals();

    // Create vertex buffer data.
    createBuffers();

    // Compile the shaders.
    compileShaders();

    // Create a program.
    createProgram();

    // Handle additional errors.
    handleAdditionalErrors();

    // Generate the viewMatrix using the provided lookAt function.
    generateTheViewMatrix();

    // Generate the projection matrix using the provided perspective function.
    generateTheProjectionMatrix();

    // Send the world, view, and projection matrices to the vertex shader.
    sendMatricesToVertexShader();

    // Set an event listener for the translation and rotation of the cow.
    setEventListener();

    // Define the layout for the normals, and send them to the fragment shader.
    console.log('We are here');
    console.log(normals);
    console.log(vertices.length);

    defineTheDataLayoutNormals('Normals', normalsBufferObject,
        3, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Send the required variables to the shaders for the spotlight.
    sendVariablesToShadersForSpotlight();

    // Send variables for Phong lighting to the shaders.
    sendVariablesToShadersForPhongLighting();


    debug();

    // Render the cow.
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.useProgram(program);

    //=====================================================

    // This function translates the cow along the x-axis and the
    // y-axis when the left mouse key is pressed; according to the
    // movement of the mouse.
    if (translationMouseX !== 0 && translationMouseY !== 0) {
        translateTheCowAlongXAndY();
    }

    // This function translates the cow in the negative z direction
    // if the down key is pressed, and in the positive z direction
    // if the up key is pressed.
    translateTheCowAlongZ();

    // This function rotates the cow along x and y-axis based on the
    // coordinates of the mouse when the right mouse key is pressed.
    if (rotationMouseX !== 0 && rotationMouseY !== 0) {
        rotateTheCowAlongXAndY();
    }

    // This function rotates the cow along the z-axis based on the
    // clicks on the right and left arrows.
    rotateTheCowAlongZ();

    // If the r key was pressed reposition the cow.
    if (rKeyWasPressed) {
        repositionTheCow();
    }

    // If the p key was pressed rotate the global source.
    if (pKeyWasPressed) {
        rotateTheGlobalLightSource();
    }

    // If the s key was pressed rotate the spotlight.
    if (sKeyWasPressed) {
        rotateTheSpotlight();
    }

    // ================ Drawing the cow ================
    // Define the data layout for positions.
    defineTheDataLayoutPositions('Positions', cowPositionsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Define the data layout for colors.
    defineTheDataLayoutColors('Colors', cowColorsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Update the integer objectNumber to specify which object
    // is being rendered in the vertex shader.
    // 0: Cow
    // 1: Global light source wireframe
    // 2: Spotlight wireframe
    setObjectNumber(0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length);

    // ================ Drawing the Global Source ================
    // Define the data layout for positions.
    defineTheDataLayoutPositions('Positions', globalSourcePositionsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Define the data layout for colors.
    defineTheDataLayoutColors('Colors', globalSourceColorsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    setObjectNumber(1);

    gl.drawArrays(gl.LINES, 0, positionsGlobalLightSource.length);

    // ================ Drawing the spotlight ================
    // Define the data layout for positions.
    defineTheDataLayoutPositions('Positions', spotlightPositionsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    // Define the data layout for colors.
    defineTheDataLayoutColors('Colors', spotlightColorsBufferObject, 3,
        3 * Float32Array.BYTES_PER_ELEMENT, 0);

    setObjectNumber(2);

    gl.drawArrays(gl.LINES, 0, positionsSpotlight.length);

    requestAnimationFrame(render);
}

function init() {
    canvas = document.getElementById("cowCanvas");
    gl = canvas.getContext("webgl2");

    // Check if the WebGL is supported
    if (!gl) {
        console.log('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        alert('Your browser does not support WebGL');
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.lineWidth(1);

    console.log("WebGL initialized.");
}

let objectNumber;
function setObjectNumber(objectNum) {
    objectNumber = objectNum;
    gl.useProgram(program);

    let objectNumberLocation =
        gl.getUniformLocation(program, 'objectNumber');
    gl.uniform1i(objectNumberLocation, objectNum);
}

// positions holds the vertices which define faces for the vertex shader (vertices repeat).
// colors hold the vertex color for the fragment shader.
// faces hold the index of the vertices which define a face, or a triangle in this case.
// vertices hold the coordinates of the vertices (non-repeating).
let positions = [];
let colors = [];
const faces = get_faces();
const vertices = get_vertices();
function fillPositionsAndColors () {
    for (let i = 0; i < faces.length; ++i) {
        const currentFace = faces[i];
        fillPositionsAndColorsHelper(
            currentFace[0] - 1, currentFace[1] - 1, currentFace[2] - 1);
    }
}

function fillPositionsAndColorsHelper(vertexA, vertexB, vertexC) {
    let indices = [vertexA, vertexB, vertexC];
    for (let i = 0; i < indices.length; ++i) {
        positions.push(vertices[indices[i]]);
        colors.push(vec3(0.0, 0.0, 0.0));
    }
}

let positionsGlobalLightSource = [];
let colorsGlobalLightSource = [];
let positionsSpotlight = [];
let colorsSpotlight = [];
function fillPositionsAndColorsWireframes() {
    positionsGlobalLightSource = [
        vec3(8.5, 4.5, 4.5), vec3(7.5, 5.5, 5.5),
        vec3(8.5, 5.5, 5.5), vec3(7.5, 4.5, 4.5),
        vec3(8.0, 5.5, 4.5), vec3(8.0, 4.5, 5.5)
    ];

    positionsSpotlight = [
         vec3(0.0, 6.0, 6.0), vec3(0.0, 5.0, 3.0),
         vec3(0.0, 6.0, 6.0), vec3(0.5, 5.0, 4.0),
         vec3(0.0, 6.0, 6.0), vec3(-0.5, 5.0, 4.0)
    ];

    for (let i = 0; i < positionsSpotlight.length; i++) {
        colorsSpotlight.push(vec3(1.0, 1.0, 0.0));
    }

    for (let i = 0; i < positionsGlobalLightSource.length; i++) {
        colorsGlobalLightSource.push(vec3(1.0, 0.0, 0.0));
    }
}

let cowPositionsBufferObject;
let cowColorsBufferObject;
let globalSourcePositionsBufferObject;
let globalSourceColorsBufferObject;
let spotlightPositionsBufferObject;
let spotlightColorsBufferObject;
let normalsBufferObject;
function createBuffers () {
    // Create buffers to store vertices
    cowPositionsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cowPositionsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    globalSourcePositionsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, globalSourcePositionsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsGlobalLightSource), gl.STATIC_DRAW);

    spotlightPositionsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spotlightPositionsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsSpotlight), gl.STATIC_DRAW);

    // Create buffers to store colors
    cowColorsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cowColorsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    globalSourceColorsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, globalSourceColorsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsGlobalLightSource), gl.STATIC_DRAW);

    spotlightColorsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spotlightColorsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsSpotlight), gl.STATIC_DRAW);

    // Create a buffer for normals
    normalsBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(flatten(normals)), gl.STATIC_DRAW);

}

// Variables to hold vertex shader, fragment shader
let vertexShader;
let fragmentShader;

function compileShaders () {
    // Compiling the vertex shader.
    vertexShader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    // Check if the compilation for the vertex shader was successful
    // and delete the shader if it was unsuccessful.
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('There was an error in compiling the vertex shader!',
            gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return;
    }

    // Compile the fragment shader.
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Check if the compilation for the fragment shader was successful
    // and delete the shader if it was unsuccessful.
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('There was an error in compiling the fragment shader!',
            gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return;
    }

    console.log("Shaders compiled successfully.");
}

let program;

function createProgram () {
    program = gl.createProgram();

    // attach the existing compiled vertex shader and the fragment shader.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    // Check if the program was linked successfully.
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('There was an error in linking the program.',
            gl.getProgramInfoLog(program));
    }

    console.log("Program created successfully.");
}

function handleAdditionalErrors() {
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('There was an error validating the program!',
            gl.getProgramInfoLog(program));
    }
}

function defineTheDataLayoutPositions(dataArray, buffer, size, stride, offset) {

    // Get the location of the colors data
    let positionsLocation = gl.getAttribLocation(program, dataArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Specify the layout of the data
    gl.vertexAttribPointer(positionsLocation, size, gl.FLOAT, false, stride, offset);
    gl.enableVertexAttribArray(positionsLocation);
}

function defineTheDataLayoutColors(dataArray, buffer, size, stride, offset) {

    // Get the location of the colors data
    let colorsLocation = gl.getAttribLocation(program, dataArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Specify the layout of the data
    gl.vertexAttribPointer(colorsLocation, size, gl.FLOAT, false, stride, offset);
    gl.enableVertexAttribArray(colorsLocation);
}

function defineTheDataLayoutNormals(dataArray, buffer, size, stride, offset) {
    // Get the location of the colors data
    let normalsLocation = gl.getAttribLocation(program, dataArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Specify the layout of the data
    gl.vertexAttribPointer(normalsLocation, size, gl.FLOAT, gl.FALSE, stride, offset);
    gl.enableVertexAttribArray(normalsLocation);
}

let worldMatrix = mat4();
let viewMatrix = mat4();
let projectionMatrix = mat4();
let worldMatrixGlobalSource = mat4();
let worldMatrixSpotlight = mat4();

function generateTheViewMatrix () {
    viewMatrix = lookAt(vec3(0.0, 0.0, 30.0), vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0));
}

function generateTheProjectionMatrix () {
    projectionMatrix = perspective(45, canvas.width / canvas.height,
        1.0, 1000.0);
}

function sendMatricesToVertexShader() {
    gl.useProgram(program);

    // Get the location of the matrices.
    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');
    let viewUniformMatrixLocation
        = gl.getUniformLocation(program, 'viewMatrix');
    let projectionUniformLocation
        = gl.getUniformLocation(program, 'projMatrix');
    let worldGlobalSourceUniformLoc
        = gl.getUniformLocation(program, 'worldGlobalSourceMat');
    let worldMatrixSpotlightLocation
        = gl.getUniformLocation(program, 'worldSpotlightMat');

    // Send the matrices to vertex shader.
    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
    gl.uniformMatrix4fv(viewUniformMatrixLocation, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionUniformLocation, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(worldGlobalSourceUniformLoc, false, flatten(worldMatrixGlobalSource));
    gl.uniformMatrix4fv(worldMatrixSpotlightLocation, false, flatten(worldMatrixSpotlight));
}

let translationMouseX = 0;
let translationMouseY = 0;
let zCoordinate = 0;
let rotationMouseX = 0;
let rotationMouseY = 0;
let rotationAngleAlongZ = 0;
let rKeyWasPressed = false;
let pKeyWasPressed = false;
let sKeyWasPressed = false;


function setEventListener() {

    // In safari or other browsers the right click is usually
    // associated with a context menu we must prevent the default
    // behaviour so that we can rotate the cow along the X and Y.
    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });

    // Event listener for clicks on the mouse.
    document.addEventListener('mousemove', handleMouseMove);

    // Event listener for clicks on the keyboard.
    document.addEventListener('keydown', handleKeyDown);
    function handleMouseMove(event) {

        // The event where the left key is pressed
        // (translate the cow along X and Y).
        if (event.buttons === 1) {
            translationMouseX += event.movementX * 5;
            translationMouseY += event.movementY * 5;
        }

        // The case where the right key is pressed
        // (rotate the cow along X and Y).
        if (event.buttons === 2) {
            rotationMouseX += event.movementY;
            rotationMouseY += event.movementX;
        }
    }

    function handleKeyDown(event) {

        // The event where the up arrow key is pressed
        // (translate the cow in positive Z direction).
        if (event.key === 'ArrowUp') {
            zCoordinate++;
        }

        // The event where the down arrow key is pressed
        // (translate the cow in negative Z direction).
        else if (event.key === 'ArrowDown') {
            zCoordinate--;
        }

        // Rotation along z-axis (clockwise).
        else if (event.key === 'ArrowLeft') {
            rotationAngleAlongZ += 5;
        }

        // Rotation along z-axis (counter-clockwise).
        else if (event.key === 'ArrowRight') {
            rotationAngleAlongZ -= 5;
        }

        // The case where s is pressed (reposition the cow).
        else if (event.key === 'r') {
            rKeyWasPressed = true;
        }

        // The case where p is pressed (rotation of the global source).
        else if (event.key === 'p') {
            pKeyWasPressed = !pKeyWasPressed;
        }

        // The case where s is pressed (rotation of the spotlight).
        else if (event.key === 's') {
            sKeyWasPressed = !sKeyWasPressed;
        }
    }
}

function convertWindowToClipX(windowX) {
    return -1 + 2 * windowX / canvas.width;
}

function convertWindowToClipY(windowY) {
    return -1 + 2 * (canvas.height - windowY) / canvas.height;
}

function translateTheCowAlongXAndY () {
    worldMatrix = mat4();

    worldMatrix = mult(worldMatrix, translate
        (convertWindowToClipX(translationMouseX),
        convertWindowToClipY(translationMouseY), 0.0));

    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');

    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
}

function translateTheCowAlongZ () {
    // The case where translation along x and y has not yet been applied.
    if (translationMouseX === 0 && translationMouseY === 0) {
        worldMatrix = mat4();
        worldMatrix = mult(worldMatrix, translate(0.0, 0.0, zCoordinate));
    }

    else {
        worldMatrix = mult(worldMatrix,
            translate(convertWindowToClipX(translationMouseX),
                convertWindowToClipY(translationMouseY), zCoordinate));
        console.log(zCoordinate);
    }

    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');

    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
}

function rotateTheCowAlongXAndY () {

    // Rotation along the X.
    worldMatrix = mult(worldMatrix,
        rotate(rotationMouseX, vec3(1.0, 0.0, 0.0)));


    // Rotation along the Y.
    worldMatrix = mult(worldMatrix,
        rotate(rotationMouseY, vec3(0.0, 1.0, 0.0)));

    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');

    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
}

function rotateTheCowAlongZ () {
    worldMatrix = mult(worldMatrix, rotate(rotationAngleAlongZ, vec3(0.0, 0.0, 1.0)));

    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');

    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
}

function repositionTheCow () {

    worldMatrix = mat4();
    translationMouseX = 0;
    translationMouseY = 0;
    zCoordinate = 0;
    rotationMouseX = 0;
    rotationMouseY = 0;
    rotationAngleAlongZ = 0;
    rKeyWasPressed = false;

    let worldUniformMatrixLocation
        = gl.getUniformLocation(program, 'worldMatrix');

    gl.uniformMatrix4fv(worldUniformMatrixLocation, false, flatten(worldMatrix));
}

// Define the position of the light source.
let lightSourcePosition = vec3(8.0, 5.0, 5.0);
function rotateTheGlobalLightSource() {
    worldMatrixGlobalSource =
        mult(worldMatrixGlobalSource, rotate(1, vec3(0.0, 1.0, 0.0)));

    // Send the rotation matrix for the global light source to the vertex shader.
    let worldUniformGlobalSourceMatrixLoc
        = gl.getUniformLocation(program, 'worldGlobalSourceMat');

    gl.uniformMatrix4fv(worldUniformGlobalSourceMatrixLoc,
        false, flatten(worldMatrixGlobalSource));

    // Send the light source position to the vertex shader.
    let lightSourcePosLoc
        = gl.getUniformLocation(program, 'lightPosition');
    gl.uniform3fv(lightSourcePosLoc, flatten(lightSourcePosition));
}

// Defining an array to store the average normals of touching
// fragments for each vertex (used for Phong shading).
let normals = [];

//  Defining an array to accumulate the normals for each vertex.
//let vertexNormals = [];

function calculateNormals () {

    // for (let i = 0; i < vertices.length; i++) {
    //     vertexNormals.push([]);
    // }

    for (let i = 0; i < faces.length; ++i) {
        const currentFace = faces[i];
        calculateNormalsHelper(currentFace[0] - 1, currentFace[1] - 1, currentFace[2] - 1);
    }

    // // Calculate the average normals for each vertex
    // for (let i = 0; i < vertices.length; ++i) {
    //     const accumulatedNormals = vertexNormals[i];
    //     let averageNormal = vec3(0, 0, 0);
    //     for (let j = 0; j < accumulatedNormals.length; ++j) {
    //         averageNormal = add(averageNormal, accumulatedNormals[j]);
    //     }
    //     averageNormal = normalize(averageNormal);
    //     normals.push(averageNormal);
    // }

}

function calculateNormalsHelper (vertexA, vertexB, vertexC) {
    let edge1 = subtract(vertices[vertexB], vertices[vertexA]);
    let edge2 = subtract(vertices[vertexC], vertices[vertexA]);

    let normal = cross(edge1, edge2);

    normal = normalize(normal);

    // We need to store the same normal for the 3 vertices that define a triangle.
    // each index of vertexNormals consist of all the generated,
    // normals for the fragments that include that specific vertex.
    // Using a nested array.

    for (let i = 0; i < 3; i++) {
        normals.push(normal);
    }

    // vertexNormals[vertexA].push(normal);
    // vertexNormals[vertexB].push(normal);
    // vertexNormals[vertexC].push(normal);
}

function debug() {
    //console.log(normals);
}

let hitRightTarget = false;
let hitLeftTarget = true;
let rotationAngle = 0;

function rotateTheSpotlight() {
    if (hitLeftTarget) {
        if (rotationAngle < 60) {
            // Move right.
            worldMatrixSpotlight = mult(worldMatrixSpotlight, rotate(0.5, vec3(0.0, 1.0, 0.0)));
            rotationAngle++;
        }
    }

    if (hitRightTarget) {
        if (rotationAngle > -60) {
            // Move left.
            worldMatrixSpotlight = mult(worldMatrixSpotlight, rotate(-0.5, vec3(0.0, 1.0, 0.0)));
            rotationAngle--;
        }
    }

    if (rotationAngle === 60) {
        hitRightTarget = true;
        hitLeftTarget = false;
    }

    if (rotationAngle === -60) {
        hitRightTarget = false;
        hitLeftTarget = true;
    }

    // Send the updated rotation matrix for the spotlight to the vertex shader
    let worldUniformSpotlightMatrixLoc
        = gl.getUniformLocation(program, 'worldSpotlightMat');
    gl.uniformMatrix4fv(worldUniformSpotlightMatrixLoc, false, flatten(worldMatrixSpotlight));

}

let spotlightPosition = vec3(0.0, 6.0, 6.0);
let directionOfSpotlight = normalize(subtract(vec3(0.0, 0.0, 0.0), spotlightPosition));
let limit = degreesToRadians(7.5);
function sendVariablesToShadersForSpotlight () {

    // Get the location.
    let spotlightPositionLoc
        = gl.getUniformLocation(program, 'SpotlightPos');
    let directionOfSpotlightLoc
        = gl.getUniformLocation(program, 'LightDirection');
    let limitLoc
        = gl.getUniformLocation(program, 'Limit');

    // Send the variables to the shaders.
    gl.uniform3fv(spotlightPositionLoc, spotlightPosition);
    gl.uniform3fv(directionOfSpotlightLoc, directionOfSpotlight);
    gl.uniform1f(limitLoc, Math.cos(limit));
}

function degreesToRadians(angleDegrees) {
    return angleDegrees * (Math.PI / 180);
}

function sendVariablesToShadersForPhongLighting() {

    let viewPosition = vec3(0.0, 0.0, 30.0);
    let shininess = 200.0;

    let viewPositionLoc
        = gl.getUniformLocation(program, 'viewPosition');
    gl.uniform3fv(viewPositionLoc, viewPosition);

    let shininessLoc
        = gl.getUniformLocation(program, 'shininess');
    gl.uniform1f(shininessLoc, shininess);
}