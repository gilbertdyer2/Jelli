"use strict";
import { BeatDetector, BeatDetectorManager } from './BeatDetector.js';

/*

**Notes:
Use the "Audio file" dropdown to choose a .wav from the AudioFiles folder. The list is loaded from
audioFileList.json (generate/update it by running: node list-audio.js). The best demonstration of
the audio side is probably the first kick/snare loop in the list.

The default listener setup has 2 listeners. One listener is set up to track a general 58hz kick, 
which is around the frequency of the kicks in the provided samples, and the other tracks around 375hz,
a general middle frequency.

In context, the beat recognition algorithm struggles a bit with false positives from frequency 
interference and sudden changes. 

The listeners "adapt" a bit over time through exponential moving mean, but the
values probably need to be tuned a little more. Tuning values for specific songs helps greatly.
The framework I built makes it pretty easy to add a new listener to an area around a target
frequency and a specified number of octaves above, then assign it to a WebGL graphics element
externally by checking the listener's parameter value.
*/

// CONFIG: Set provided filepath in AUDIO_FILEPATH //

const PROVIDED_FILES = [
    "AudioFiles/58hzKick_375hzSnare_loop_110bpm.wav", // [0] Basic kick/snare loop @ 110bpm
    "AudioFiles/58hz_kick_loop_110bpm.wav", // [1] Basic kick loop @ 110bpm
    "AudioFiles/58hz_kick_loop_40bpm.wav", // [2] Basic kick loop @ 40bpm
    "AudioFiles/nujabes-luv(sic)pt2.wav", // [3] Nujabes - Luv(Sic) Pt 2
    "AudioFiles/mgmt-kids.wav", // [4] MGMT - Kids
    "AudioFiles/goldre.wav", // [5] goldre
    "AudioFiles/harwav.wav", // [6] harwav
    "AudioFiles/helo_exp4.wav", // [7] helo
    "AudioFiles/traff.wav", // [8] traff
    "AudioFiles/wtr.wav", // [9] wtr
    "AudioFiles/nuview.wav"
]


// Fallback if audioFileList.json is missing; first file is default
const AUDIO_FILEPATH_DEFAULT = PROVIDED_FILES[0];


const RPM_MAX = 60.0; // Max rotation speed on beat trigger
const RPM_MIN = 10.0; // Min rotation speed when idle
const SMOOTH_RPM_MAX = 95.0; // Exaggerated max RPM for Smooth mode (Twixtor-style cube)

const OCTAHEDRON_MAX_SCALE = 1.03; // Max scale of octahedron when kick triggered

// Diamond/Square tunnel config values
const DIAMOND_MIN_SPEED = 1.0;  // Min speed diamonds move when idle
const DIAMOND_MAX_SPEED = 10.0; // Max speed diamonds move forward on beat trigger
const DIAMOND_SPACE_AMOUNT = 1.5; // Space between diamonds
const TUNNEL_SMOOTH_FACTOR = 0.07; // Lerp factor for smooth tunnel zoom (0–1 per frame)
const SMOOTH_TUNNEL_MAX_SPEED = 24.0; // Exaggerated max zoom speed for Twixtor-style (on beat)
var curDiamondSpace = 0; // Don't change
var smoothedTunnelSpeed = DIAMOND_MIN_SPEED; // For smooth/flowing tunnel zoom mode
// Twixtor-style: smoothed target (stretched response), then speed eases toward it; position trails for fluid interpolation
var smoothedTunnelTargetSpeed = DIAMOND_MIN_SPEED;
var idealTunnelOffset = 0; // unwrapped ideal position; display trails this
// Twixtor-style cube rotation (Smooth mode): smoothed RPM
var smoothedTargetRPM = RPM_MIN;
var smoothedCubeRPM = RPM_MIN;


// GLOBAL VARS
var canvas
var gl;
var context;
var analyser;
var audio;
var previous_EMA = 0.0;
var frame_delay = 10; // ms
var timeData;
var frequencyData;
var audioFileList = [];


// Vertice definitions 
var numVertices = 24;
var pointsArray = [];
var normalsArray = [];

// Octahedron vertices
var vertices = [
    vec4( 0.0,  1.0,  0.0, 1.0), // top (0)
    vec4( 1.0,  0.0,  0.0, 1.0), // right (1)
    vec4( 0.0,  0.0,  1.0, 1.0), // front (2)
    vec4(-1.0,  0.0,  0.0, 1.0), // left (3)
    vec4( 0.0,  0.0, -1.0, 1.0), // back (4)
    vec4( 0.0, -1.0,  0.0, 1.0)  // bottom (5)
];

var oct_top = vec4(0, 1, 0, 1);
var oct_bottom = vec4(0, -1, 0, 1);
var oct_left = vec4(-1, 0, 0, 1);
var oct_right = vec4(1, 0, 0, 1);
var oct_front = vec4(0, 0, 1, 1);
var oct_back = vec4(0, 0, -1, 1);

// Vertices for a wireframe octahedron
var lineVertices = [
    // Square around middle
    oct_front, oct_left,
    oct_left, oct_back,
    oct_back, oct_right,
    oct_right, oct_front,

    // Square around z-axis vertical
    oct_front, oct_top,
    oct_top, oct_back,
    oct_back, oct_bottom, 
    oct_bottom, oct_front,

    // Square around x-axis vertical
    oct_top, oct_right,
    oct_right, oct_bottom,
    oct_bottom, oct_left,
    oct_left, oct_top
];

var diamondVertices = [
    oct_top, oct_right,
    oct_right, oct_bottom,
    oct_bottom, oct_left,
    oct_left, oct_top
]


function triangle(a, b, c) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
}
function colorOctahedron() {
    // Top faces (use top point = vertex 0)
    triangle(0, 1, 2);
    triangle(0, 2, 3);
    triangle(0, 3, 4);
    triangle(0, 4, 1);

    // Bottom faces (use bottom point = vertex 5)
    triangle(5, 2, 1);
    triangle(5, 3, 2);
    triangle(5, 4, 3);
    triangle(5, 1, 4);
}

// Lighting
var lightPosition = vec4(-2.5, -2.0, -2.0, 0.0 );
var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.1, 0.2, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 50.0;


// View & rotation
var modelView, projection;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];
var oneDimTheta = 0; // For rotation around 1 axis

var prev_time;
var thetaLoc;

// Beat detection manager and detector instances (initialized in playButton.onclick)
var manager = null;
var bassDetector = null;
var midDetector = null;

// Buffers
var nBuffer;
var vNormal;
var vBuffer;
var vPosition;
var lineBuffer;
var diamondBuffer

// Slider functionality
var seekSlider;
var currentTimeSpan;
var durationSpan;

// EQ view (frequency vs dB)
var eqCanvas;
var eqCtx;

// Function to format time to MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Populate file list from AudioFiles (audioFileList.json from list-audio.js, or fallback)
function populateAudioFileSelect(files) {
    audioFileList = files && files.length ? files : PROVIDED_FILES;
    const sel = document.getElementById("audioFileSelect");
    if (!sel) return;
    sel.innerHTML = "";
    audioFileList.forEach(function (path) {
        const opt = document.createElement("option");
        opt.value = path;
        opt.textContent = path.replace(/^AudioFiles\//, "");
        sel.appendChild(opt);
    });
}

function getSelectedAudioPath() {
    const sel = document.getElementById("audioFileSelect");
    if (sel && sel.value) return sel.value;
    return audioFileList.length ? audioFileList[0] : AUDIO_FILEPATH_DEFAULT;
}

var MAX_TRIGGER_LOG_ENTRIES = 100;
function formatTriggerTime(seconds) {
    if (seconds === undefined || isNaN(seconds)) return "0:00.000";
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s.toFixed(3);
}
function addTriggerLog(listenerName, timeSinceLastMs) {
    var listEl = document.getElementById("trigger-log-list");
    if (!listEl) return;
    var trackTime = (typeof audio !== "undefined" && audio) ? audio.currentTime : 0;
    var timeStr = formatTriggerTime(trackTime);
    var sinceStr = timeSinceLastMs === null ? "first" : timeSinceLastMs + "ms";
    var entry = document.createElement("div");
    entry.className = "entry";
    entry.innerHTML = "<span class=\"ts\">" + timeStr + "</span> <span class=\"name\">" + listenerName + "</span> <span class=\"since\">(time since last: " + sinceStr + ")</span>";
    listEl.insertBefore(entry, listEl.firstChild);
    while (listEl.children.length > MAX_TRIGGER_LOG_ENTRIES) listEl.removeChild(listEl.lastChild);
}
function clearTriggerLog() {
    var listEl = document.getElementById("trigger-log-list");
    if (listEl) listEl.innerHTML = "";
}

// Draw EQ view: x = frequency (log scale), y = dB. Uses current frequencyData from analyser.
function drawEQView() {
    if (!eqCtx || !context || !analyser || !frequencyData) return;
    const width = eqCanvas.width;
    const height = eqCanvas.height;
    const sampleRate = context.sampleRate;
    const fftSize = analyser.fftSize;
    const binCount = frequencyData.length;
    const maxFreq = sampleRate / 2;
    const minFreq = 10;
    const maxFreqDisplay = Math.min(20000, maxFreq);
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreqDisplay);
    const dbMin = -90;
    const dbMax = 0;

    // X-axis: standard log-scale spacing (1-2-5 per decade)
    const freqTicks = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

    function freqToX(f) {
        if (f <= minFreq) return 0;
        if (f >= maxFreqDisplay) return width;
        return ((Math.log(f) - logMin) / (logMax - logMin)) * width;
    }
    function formatFreq(f) {
        return f >= 1000 ? (f / 1000) + "k" : String(f);
    }

    eqCtx.fillStyle = "#111";
    eqCtx.fillRect(0, 0, width, height);

    // Grid: vertical lines at each frequency tick; horizontal at -60, -30, 0 dB
    eqCtx.strokeStyle = "rgba(255,255,255,0.08)";
    eqCtx.lineWidth = 1;
    freqTicks.forEach(function (f) {
        if (f < minFreq || f > maxFreqDisplay) return;
        var x = freqToX(f);
        eqCtx.beginPath();
        eqCtx.moveTo(x, 0);
        eqCtx.lineTo(x, height);
        eqCtx.stroke();
    });
    eqCtx.strokeStyle = "rgba(255,255,255,0.12)";
    [-60, -30, 0].forEach(function (db) {
        var y = height - ((db - dbMin) / (dbMax - dbMin)) * height;
        eqCtx.beginPath();
        eqCtx.moveTo(0, y);
        eqCtx.lineTo(width, y);
        eqCtx.stroke();
    });

    // Spectrum line: use bin center frequencies so low end (bin 0 ≈ 0–86 Hz) is drawn
    eqCtx.beginPath();
    var first = true;
    for (var i = 0; i < binCount; i++) {
        var binCenterFreq = (i + 0.5) * sampleRate / fftSize;
        if (binCenterFreq > maxFreqDisplay) break;
        var x = freqToX(binCenterFreq);
        var db = frequencyData[i];
        if (db < dbMin) db = dbMin;
        if (db > dbMax) db = dbMax;
        var y = height - ((db - dbMin) / (dbMax - dbMin)) * height;
        if (first) {
            // Start at left edge (minFreq) with bin 0 level so curve extends to 10 Hz
            if (binCenterFreq > minFreq) {
                var db0 = Math.max(dbMin, Math.min(dbMax, frequencyData[0]));
                eqCtx.moveTo(freqToX(minFreq), height - ((db0 - dbMin) / (dbMax - dbMin)) * height);
                eqCtx.lineTo(x, y);
            } else {
                eqCtx.moveTo(x, y);
            }
            first = false;
        } else {
            eqCtx.lineTo(x, y);
        }
    }
    eqCtx.strokeStyle = "#0af";
    eqCtx.lineWidth = 2;
    eqCtx.stroke();
    eqCtx.lineTo(width, height);
    eqCtx.lineTo(0, height);
    eqCtx.closePath();
    eqCtx.fillStyle = "rgba(0,170,255,0.25)";
    eqCtx.fill();

    // X-axis: frequency labels at each tick (leave room for two rows if needed to avoid overlap)
    eqCtx.fillStyle = "#888";
    eqCtx.font = "11px sans-serif";
    eqCtx.textAlign = "center";
    freqTicks.forEach(function (f) {
        if (f < minFreq || f > maxFreqDisplay) return;
        var x = freqToX(f);
        eqCtx.fillText(formatFreq(f), x, height - 4);
    });
    eqCtx.textAlign = "right";
    [-60, -30, 0].forEach(function (db) {
        var y = height - ((db - dbMin) / (dbMax - dbMin)) * height;
        eqCtx.fillText(db + " dB", width - 2, y + 4);
    });
}

// Render Settings
var screenShakeCheckmark;
var flashCheckmark;
var tunnelRotationCheckmark;
var renderOctahedronCheckmark;
var renderTunnelCheckmark;
var freezeCheckmark;
var renderWireframesCheckmark;
var renderOctahedronOutlineCheckmark;


window.onload = function init() {
    // Show file list immediately from fallback; replace with audioFileList.json if available
    populateAudioFileSelect(PROVIDED_FILES);
    fetch("audioFileList.json")
        .then(function (r) { return r.json(); })
        .then(function (files) { populateAudioFileSelect(files); })
        .catch(function () { /* keep PROVIDED_FILES */ });

    // When user picks a different file while audio is loaded, switch source
    document.getElementById("audioFileSelect").addEventListener("change", function () {
        if (audio && this.value) {
            if (manager) manager.reset();
            clearTriggerLog();
            audio.src = this.value;
            audio.load();
            if (!audio.paused) audio.play();
        }
    });

    // Setup WebGL
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); // Displayed vertices are transparent, so use depthmask
    gl.lineWidth(1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    colorOctahedron();

    // Rotating shape  
    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVertices), gl.STATIC_DRAW);

    diamondBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, diamondBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(diamondVertices), gl.STATIC_DRAW);

    thetaLoc = gl.getUniformLocation(program, "theta");

    // projection = ortho(-1.5, 1.5, -1.5, 1.5, -100, 100);
    projection = perspective( 45, 1, 0.01, 1000 )

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
       flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
       flatten(lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"),materialShininess);
 
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
    false, flatten(projection));

    // Checkmarks for enable/disable render steps
    screenShakeCheckmark = document.getElementById("ToggleScreenShake");
    flashCheckmark = document.getElementById("ToggleFlashEffect");
    tunnelRotationCheckmark = document.getElementById("ToggleTunnelRotation");
    renderOctahedronCheckmark = document.getElementById("RenderOctahedron");
    renderTunnelCheckmark = document.getElementById("RenderTunnel");
    renderWireframesCheckmark = document.getElementById("RenderWireframes");
    renderOctahedronOutlineCheckmark = document.getElementById("RenderOctahedronOutline");
    freezeCheckmark = document.getElementById("Freeze");
    

    // Get slider and time display elements
    seekSlider = document.getElementById("seekSlider");
    currentTimeSpan = document.getElementById("currentTime");
    durationSpan = document.getElementById("duration");

    // EQ view canvas
    eqCanvas = document.getElementById("eq-canvas");
    eqCtx = eqCanvas ? eqCanvas.getContext("2d") : null;
    document.getElementById("ShowEQView").addEventListener("change", function () {
        document.getElementById("eq-container").style.display = this.checked ? "block" : "none";
    });
    document.getElementById("eq-container").style.display = document.getElementById("ShowEQView").checked ? "block" : "none";
    
    // Add slider event listeners
    seekSlider.addEventListener('input', function() {
        if (audio && audio.duration) {
            // Update time display while dragging
            const time = (audio.duration * seekSlider.value) / 100;
            currentTimeSpan.textContent = formatTime(time);
        }
    });

    seekSlider.addEventListener('change', function() {
        if (audio && audio.duration) {
            // Seek when slider is released
            const seekTime = (audio.duration * seekSlider.value) / 100;
            audio.currentTime = seekTime;
        }
    });

    // Listener frequency controls: update target Hz from UI
    document.getElementById("bassListenerHz").addEventListener("change", function() {
        const val = parseFloat(this.value);
        if (!isNaN(val) && bassDetector) bassDetector.targetHz = Math.max(20, Math.min(200, val));
    });
    document.getElementById("midListenerHz").addEventListener("change", function() {
        const val = parseFloat(this.value);
        if (!isNaN(val) && midDetector) midDetector.targetHz = Math.max(50, Math.min(2000, val));
    });

    document.getElementById("resetListenersButton").addEventListener("click", function() {
        if (manager) manager.reset();
        clearTriggerLog();
    });

    // Add button click handler
    document.getElementById("playButton").onclick = function() {
        if (!context || !audio) {
            // Setup audio element
            audio = new Audio();
            audio.loop = true;
            audio.src = getSelectedAudioPath();

            // Setup Web Audio graph via manager (must be inside user gesture for autoplay policy)
            manager = new BeatDetectorManager(audio, { fftSize: 2048 });
            manager.init();

            // Cache references so existing consumers (drawEQView, render guard) still work
            context = manager.context;
            analyser = manager.analyser;
            frequencyData = manager.frequencyData;

            bassDetector = manager.addDetector({
                targetHz: 58, rangeHz: 10, octaves: 1, triggerDuration: 8, name: "Bass",
                onTrigger: (ms) => addTriggerLog("Bass", ms)
            });
            midDetector = manager.addDetector({
                targetHz: 375, rangeHz: 60, octaves: 3, triggerDuration: 10, name: "Mid",
                onTrigger: (ms) => addTriggerLog("Mid", ms)
            });

            // Slider playback functionality
            audio.addEventListener('timeupdate', function() {
                if (!seekSlider.dragging) {
                    const percent = (audio.currentTime / audio.duration) * 100;
                    seekSlider.value = percent;
                    currentTimeSpan.textContent = formatTime(audio.currentTime);
                }
            });

            audio.addEventListener('loadedmetadata', function() {
                durationSpan.textContent = formatTime(audio.duration);
            });

            audio.addEventListener('canplay', handleCanplay);
            audio.load();

        }
        else {
            // Toggle play/pause if audio is already initialized
            if (audio.paused) {
                audio.play();
                this.textContent = "Pause Audio";
            } else {
                audio.pause();
                this.textContent = "Play Audio";
            }
        }
    };

    // Start rendering with no audio
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Get change in time since last render to decouple certain animations from fps
    let new_time = new Date();
    let deltaTime = new_time - prev_time; 
    prev_time = new_time;

    let kickVal = -1;
    let midVal = -1;
    let deltaTheta = -1;

    if (context && audio && !audio.paused && !freezeCheckmark.checked) {
        var minTriggerIntervalMs = 0;
        if (document.getElementById("BeatMinInterval").checked) {
            var raw = parseFloat(document.getElementById("BeatMinIntervalMs").value);
            if (!isNaN(raw) && raw > 0) minTriggerIntervalMs = raw;
        }
        var twixLen = (parseFloat(document.getElementById("TwixtorLength").value) || 100) / 100; // 0=short, 1=long (Smooth mode)

        manager.update(minTriggerIntervalMs);
        kickVal = bassDetector.parameter;

        // If a peak was just triggered, change the axis of spin
        if (bassDetector.justTriggered) {
            // Pick new axis value [0-2], not equal to last value
            let next_axis = (axis + 1 + Math.floor(Math.random() * 2)) % theta.length;
            axis = next_axis;
        }
        
        // Cube rotation speed: either direct (kickVal -> RPM) or Smooth mode (Twixtor-style smoothed RPM)
        if (document.getElementById("SmoothMode").checked) {
            var twixTargetF = 0.08 + (1 - twixLen) * 0.2;   // long: 0.08, short: 0.28
            var twixSpeedF = 0.12 + (1 - twixLen) * 0.2;   // long: 0.12, short: 0.32
            var rawTargetRPM = kickVal >= 0 ? rescale(kickVal, 0, 1, RPM_MIN, SMOOTH_RPM_MAX) : RPM_MIN;
            smoothedTargetRPM += (rawTargetRPM - smoothedTargetRPM) * twixTargetF;
            smoothedCubeRPM += (smoothedTargetRPM - smoothedCubeRPM) * twixSpeedF;
            var tRPM = clamp((smoothedCubeRPM - RPM_MIN) / (SMOOTH_RPM_MAX - RPM_MIN), 0, 1);
            tRPM = tRPM * tRPM * (3 - 2 * tRPM); // smoothstep
            var effectiveRPM = RPM_MIN + tRPM * (SMOOTH_RPM_MAX - RPM_MIN);
            deltaTheta = (effectiveRPM * 360 * deltaTime) / 60000;
        } else {
            const theta_val = rescale(kickVal, 0, 1, RPM_MIN, RPM_MAX);
            deltaTheta = (theta_val * 360 * deltaTime) / (60000); // 60000 = 1m * 60s * 1000ms
        }
        theta[axis] += deltaTheta;
        
        // For diamond 1-axis spin
        oneDimTheta += deltaTheta;
        oneDimTheta = oneDimTheta % 360;


        // Trigger small scaling change for octahedron
        const new_shape_size = 1 - (rescale(kickVal, 0, 1, 1, OCTAHEDRON_MAX_SCALE) - 1);
        for (let i = 0; i < vertices.length; i++) {
            vertices[i][3] = new_shape_size;
        }
        
        // Increment uniform tunnel location
        let deltaSpace = 0;
        if (document.getElementById("SmoothMode").checked) {
            // Twixtor-style: length slider shortens effect (higher factors = snappier)
            var twixTargetF = 0.08 + (1 - twixLen) * 0.2;
            var twixSpeedF = 0.12 + (1 - twixLen) * 0.2;
            var twixPosF = 0.18 + (1 - twixLen) * 0.2;
            var rawTarget = kickVal >= 0 ? rescale(kickVal, 0, 1, DIAMOND_MIN_SPEED, SMOOTH_TUNNEL_MAX_SPEED) : DIAMOND_MIN_SPEED;
            smoothedTunnelTargetSpeed += (rawTarget - smoothedTunnelTargetSpeed) * twixTargetF;
            smoothedTunnelSpeed += (smoothedTunnelTargetSpeed - smoothedTunnelSpeed) * twixSpeedF;
            var t = clamp((smoothedTunnelSpeed - DIAMOND_MIN_SPEED) / (SMOOTH_TUNNEL_MAX_SPEED - DIAMOND_MIN_SPEED), 0, 1);
            t = t * t * (3 - 2 * t); // smoothstep for eased acceleration
            var effectiveSpeed = DIAMOND_MIN_SPEED + t * (SMOOTH_TUNNEL_MAX_SPEED - DIAMOND_MIN_SPEED);
            idealTunnelOffset += effectiveSpeed * deltaTime / 1000;
            idealTunnelOffset = idealTunnelOffset % DIAMOND_SPACE_AMOUNT;
            if (idealTunnelOffset < 0) idealTunnelOffset += DIAMOND_SPACE_AMOUNT;
            var d = idealTunnelOffset - curDiamondSpace;
            if (d > DIAMOND_SPACE_AMOUNT * 0.5) d -= DIAMOND_SPACE_AMOUNT;
            else if (d < -DIAMOND_SPACE_AMOUNT * 0.5) d += DIAMOND_SPACE_AMOUNT;
            curDiamondSpace += d * twixPosF;
            curDiamondSpace = ((curDiamondSpace % DIAMOND_SPACE_AMOUNT) + DIAMOND_SPACE_AMOUNT) % DIAMOND_SPACE_AMOUNT;
        } else {
            // Original: tunnel only advances on beat, speed follows kickVal directly
            if (kickVal != -1) {
                deltaSpace = rescale(kickVal, 0, 1, DIAMOND_MIN_SPEED, DIAMOND_MAX_SPEED) * deltaTime / 1000;
                curDiamondSpace += deltaSpace;
            }
        }
        curDiamondSpace = curDiamondSpace % DIAMOND_SPACE_AMOUNT;
        
        
        // Middle frequency beat detection
        midVal = midDetector.parameter;
        let squareFade = rescale(midVal, 0,  1.0, 0.0, 0.2);

        // Update Lighting according to mid
        lightAmbient[1] = 0.3 + squareFade;
        lightAmbient[2] = 0.3 + squareFade * 2;
        
        // Flash effect for entire screen
        if (flashCheckmark.checked) {
            let flashAmt = rescale(kickVal, 0, 1.0, 1.0, 0.9);
            gl.clearColor(0.0, 0.0, 0.0, flashAmt);
        }

        // EQ view: frequency (x) vs dB (y)
        if (document.getElementById("ShowEQView").checked) drawEQView();
    }

    // ----- Draw steps ----- //

    // Draw octahedron
    if (renderOctahedronCheckmark.checked) {
        colorOctahedron();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); // existing buffer for triangles
        gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        // Apply lighting
        materialAmbient = vec4( 1.1, 0.2, 1.0, 1.0 );
        var ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

        // Apply translation and rotation
        modelView = mat4();
        modelView = mult(modelView, translate(0.0, 0.0, -4.0)); // Translate
        modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
        modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
        modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));

        gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );
        

        gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    }

    // Draw outline of octahedron
    if (renderOctahedronOutlineCheckmark.checked) {
        // Draw inner wireframes
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        // Set wireframe material color
        materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
        var ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

        // Apply translation and rotation
        modelView = mat4();
        modelView = mult(modelView, translate(0.0, 0.0, -4.0)); 
        modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
        modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
        modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
        
        gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

        gl.drawArrays( gl.LINES, 0, lineVertices.length );
    }

    // Render inner wireframes
    if (renderWireframesCheckmark.checked) {
        // Draw inner wireframes
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(lineVertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        // Set wireframe material color
        materialAmbient = vec4( 1.1, 0.2, 2.0, 1.0 );
        var ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

        // Draw inner wireframes
        for (let i = -5.0; i >= -8.0; i-=3) { // 2 Wireframes
            modelView = mat4();
            modelView = mult(modelView, translate(0.0, 0.0, i)); 
            modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
            modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
            modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
            
            gl.uniformMatrix4fv( gl.getUniformLocation(program,
                "modelViewMatrix"), false, flatten(modelView) );

            gl.drawArrays( gl.LINES, 0, lineVertices.length );
        }
    }
    
    // Draw diamond 'tunnel'
    if (renderTunnelCheckmark.checked) {
        gl.bindBuffer(gl.ARRAY_BUFFER, diamondBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(diamondVertices), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        // Set tunnel material color
        materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
        var ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));

        for (let i = 0; i < 20; i++) {
            modelView = mat4();
            modelView = mult(modelView, translate(0.0, 0.0, -i * DIAMOND_SPACE_AMOUNT + curDiamondSpace)); 
            
            // Rotate tunnel, if enabled
            if (tunnelRotationCheckmark.checked) {
                modelView = mult(modelView, rotate(oneDimTheta, [0, 0, 1] ));
            }

            modelView = mult(modelView, rotate(45, [0, 0, 1] ));
            
            gl.uniformMatrix4fv( gl.getUniformLocation(program,
                "modelViewMatrix"), false, flatten(modelView) );

            gl.drawArrays( gl.LINES, 0, diamondVertices.length );
        }
    }
    
    // Screenshake effect via fov change
    if (screenShakeCheckmark.checked) {
        let projection_new = rescale(kickVal, 0, 1, 45, 43);
        projection = perspective( projection_new, 1, 0.01, 1000 );
        gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
            false, flatten(projection));
    }
    
    setTimeout(
        function() { requestAnimFrame(render); }, frame_delay
    );
};


function handleCanplay() {
    audio.play();
};

// Clamps a value
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function rescale(value, minInput, maxInput, minOutput, maxOutput) {
    const normalizedValue = ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
    return normalizedValue;
}