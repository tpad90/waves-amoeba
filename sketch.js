// Super bright colorful music responsive

// blank screen 
// 'Mouse click' = spawn at that location
// 'Space Bar' = spawn randomly

// 'C' = change color of particles
// 'R' = Reset to blank canvas
// the movements are a bit more random than V1

let particles = [];
let noiseScale = 800;
let sound;
let fft;
let volumeThreshold = .8; // Initial volume threshold
let hueTransitionRanges = [
  { // blue to light blue
    startColor: '#6691FF',
    endColor: '#9BB7FF'
  },
  { // pink to light pink
    startColor: '#F587FF',
    endColor: '#F9B2FF'
  },
  { // yellow to light
    startColor: '#FFD62D',
    endColor: '#FFE889'
  }
];

let loudestVolume = 0; // Variable to track loudest volume observed
let timeToAnalyze = 20; // Time (in seconds) to analyze for setting volume threshold
let analysisStartTime; // Variable to store the start time of analysis

function preload() {
  sound = loadSound('relaxing-forest-danamusic.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT();
  sound.loop();
  
  analysisStartTime = millis();
}

function draw() {
  background(255); // Fully clear the canvas (no tail effect)
  
  let spectrum = fft.analyze();
  let vol = fft.getEnergy(20, 200);
  
  for (let i = 0; i < particles.length; i++) {
    particles[i].update(vol);
    particles[i].display();
  }
}

function mouseClicked() {
  let numParticlesToSpawn = 4;
  let spacing = 5;
  for (let i = 0; i < numParticlesToSpawn; i++) {
    let offsetX = (i % 2 === 0 ? -1 : 1) * (spacing * floor(i / 2));
    let offsetY = (i % 2 === 0 ? 1 : -1) * (spacing * floor(i / 2));
    particles.push(new Particle(mouseX + offsetX, mouseY + offsetY, random(5, 15)));
  }
}

function changeColor() {
  let randomTransition = hueTransitionRanges[floor(random(hueTransitionRanges.length))];
  for (let i = 0; i < particles.length; i++) {
    particles[i].shiftHue(randomTransition.startColor, randomTransition.endColor);
  }
}

class Particle {
  constructor(x, y, size) {
    this.pos = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector();
    this.size = size;
    this.amoebaPoints = this.createAmoebaPoints();
    let randomTransition = hueTransitionRanges[floor(random(hueTransitionRanges.length))];
    this.color = lerpColor(color(randomTransition.startColor), color(randomTransition.endColor), 0.5);
    this.pulseAmount = random(5, 20);
    this.angleOffset = random(TWO_PI); // Offset for wave-like motion
    this.timeOffset = random(TWO_PI); // Time-based offset for smooth waves
  }
  
  update(vol) {
    let time = millis() * 0.002; // Smooth time-based movement
    let angle = map(noise(this.pos.x / noiseScale, this.pos.y / noiseScale), 0, 1, 0, TWO_PI);
    let waveMotion = sin(time + this.timeOffset) * 0.3; // Softer wavelike effect
    let steering = p5.Vector.fromAngle(angle + waveMotion);
    let steeringMagnitude = map(vol, 0, 255, -0.05, 0.05); // More pronounced reaction to volume
    steering.mult(steeringMagnitude);
    this.applyForce(steering);
    
    // Introduce gentle velocity variation
    this.velocity.add(p5.Vector.random2D().mult(0.1));
    this.velocity.limit(1.5); // Limit speed for smoother ripples
    
    // Apply velocity
    this.pos.add(this.velocity);
    this.acceleration.mult(0);
    
    // Adjust size based on volume with a breathing effect (expanding up to ~70% larger)
    let pulseFactor = map(vol, 0, 255, 1.0, 1.7);
    this.pulseAmount = this.size * pulseFactor;
  }
  
  applyForce(force) {
    this.acceleration.add(force);
  }
  
  display() {
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 50);
    beginShape();
    for (let i = 0; i < this.amoebaPoints.length; i++) {
      let x = this.pos.x + this.amoebaPoints[i].x * this.pulseAmount;
      let y = this.pos.y + this.amoebaPoints[i].y * this.pulseAmount;
      curveVertex(x, y);
    }
    endShape(CLOSE);
  }
  
  createAmoebaPoints() {
    let numPoints = floor(random(5, 12));
    let points = [];
    for (let i = 0; i < numPoints; i++) {
      let angle = map(i, 0, numPoints, 0, TWO_PI);
      let distance = random(this.size * 0.3, this.size * 0.6);
      let point = createVector(cos(angle) * distance, sin(angle) * distance);
      points.push(point);
    }
    return points;
  }
  
  shiftHue(startColor, endColor) {
    this.color = lerpColor(color(startColor), color(endColor), 0.5);
  }
}

// Added for mobile: when a touch is detected, trigger mouseClicked()
function touchStarted() {
  mouseClicked();
  return false; // Prevent default behavior
}
