/**
 * HIS-DBaaS – Main Application Script
 * Handles: Architecture SVG, Data Flow, Charts, Telemetry, Simulation
 */

/* ================================================================
   GLOBALS & STATE
   ================================================================ */
const STATE = {
  simulationRunning: false,
  telemetryInterval: null,
  qpsInterval: null,
  kpiInterval: null,
  cpuData: Array(30).fill(30),
  memData: Array(30).fill(40),
  ioData: Array(30).fill(20),
  lstmData: Array(30).fill(30),
  qpsData: Array(40).fill(0),
  tick: 0
};

/* ================================================================
   NAVBAR
   ================================================================ */
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

/* ================================================================
   HERO CANVAS – Animated particle/node network
   ================================================================ */
const heroCanvas = document.getElementById('heroCanvas');
const hCtx = heroCanvas.getContext('2d');
let particles = [];

function resizeHeroCanvas() {
  heroCanvas.width = heroCanvas.offsetWidth;
  heroCanvas.height = heroCanvas.offsetHeight;
}
resizeHeroCanvas();
window.addEventListener('resize', resizeHeroCanvas);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * heroCanvas.width;
    this.y = Math.random() * heroCanvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.r = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.2;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > heroCanvas.width || this.y < 0 || this.y > heroCanvas.height) this.reset();
  }
  draw() {
    hCtx.beginPath();
    hCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    hCtx.fillStyle = `rgba(0,212,255,${this.alpha})`;
    hCtx.fill();
  }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animateHero() {
  hCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  // Draw connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        hCtx.beginPath();
        hCtx.moveTo(particles[i].x, particles[i].y);
        hCtx.lineTo(particles[j].x, particles[j].y);
        hCtx.strokeStyle = `rgba(0,212,255,${0.15 * (1 - dist / 100)})`;
        hCtx.lineWidth = 0.5;
        hCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateHero);
}
animateHero();

/* ================================================================
   HERO STATS – Counter animation
   ================================================================ */
function animateCounters() {
  document.querySelectorAll('.stat-val').forEach(el => {
    const target = parseInt(el.dataset.target);
    let count = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count;
      if (count >= target) clearInterval(timer);
    }, 20);
  });
}

// Trigger on scroll into view
const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { animateCounters(); heroObserver.disconnect(); }
}, { threshold: 0.5 });
heroObserver.observe(document.getElementById('hero'));

/* ================================================================
   ARCHITECTURE SVG
   ================================================================ */
function buildArchSVG() {
  const svg = document.getElementById('archSvg');
  const W = 900, H = 620;
  const layers = [
    { id: 'tenant', label: 'Tenant Application Layer',  y: 40,  color: '#3b82f6', icon: '🏢', nodes: ['App A','App B','App C','App D'] },
    { id: 'nic',    label: 'SmartNIC / DPU Security Engine', y: 160, color: '#f59e0b', icon: '⚡', nodes: ['DPU-1','DPU-2','ABAC','Policy'] },
    { id: 'ai',     label: 'AI Orchestration (LSTM)',   y: 280, color: '#a78bfa', icon: '🧠', nodes: ['LSTM','Forecast','Trigger','Monitor'] },
    { id: 'tee',    label: 'Trusted Execution Env.',    y: 400, color: '#10b981', icon: '🔐', nodes: ['SGX','SEV','Key Mgr','Crypto'] },
    { id: 'db',     label: 'Physical DB Cluster',        y: 510, color: '#00d4ff', icon: '🗄️', nodes: ['Node-1','Node-2','Node-3','Node-4'] },
  ];

  let svgHTML = '';

  // Draw layer backgrounds + labels
  layers.forEach(layer => {
    svgHTML += `
      <rect x="20" y="${layer.y}" width="${W - 40}" height="95" rx="10"
        fill="${layer.color}18" stroke="${layer.color}55" stroke-width="1.5"
        class="arch-layer-rect" data-id="${layer.id}"/>
      <text x="40" y="${layer.y + 22}" font-size="11" fill="${layer.color}" font-weight="600" font-family="Inter,sans-serif">${layer.icon} ${layer.label}</text>`;

    // Nodes
    const nCount = layer.nodes.length;
    const spacing = (W - 80) / nCount;
    layer.nodes.forEach((node, i) => {
      const nx = 60 + i * spacing;
      const ny = layer.y + 40;
      svgHTML += `
        <rect x="${nx - 45}" y="${ny}" width="90" height="38" rx="7"
          fill="${layer.color}22" stroke="${layer.color}88" stroke-width="1"
          class="arch-node" data-layer="${layer.id}"/>
        <text x="${nx}" y="${ny + 24}" text-anchor="middle" font-size="10"
          fill="${layer.color}" font-family="Inter,sans-serif" font-weight="500">${node}</text>`;
    });
  });

  // Draw connecting arrows between layers
  const arrowX = W / 2;
  const arrowColors = ['#3b82f6','#f59e0b','#a78bfa','#10b981'];
  const arrowFrom = [135, 255, 375, 495];
  const arrowTo   = [160, 280, 400, 510];
  arrowFrom.forEach((fromY, i) => {
    svgHTML += `
      <defs>
        <marker id="arrow${i}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="${arrowColors[i]}"/>
        </marker>
      </defs>
      <line x1="${arrowX}" y1="${fromY}" x2="${arrowX}" y2="${arrowTo[i]}"
        stroke="${arrowColors[i]}" stroke-width="2" stroke-dasharray="5,3"
        marker-end="url(#arrow${i})" opacity="0.7">
        <animate attributeName="stroke-dashoffset" values="16;0" dur="1s" repeatCount="indefinite"/>
      </line>`;
  });

  svg.innerHTML = svgHTML;

  // Hover glow effect
  svg.querySelectorAll('.arch-node').forEach(node => {
    node.addEventListener('mouseenter', () => { node.style.filter = 'drop-shadow(0 0 6px currentColor)'; });
    node.addEventListener('mouseleave', () => { node.style.filter = ''; });
  });
}
buildArchSVG();

/* ================================================================
   UNIFIED DATA FLOW SVG
   ================================================================ */
function buildUnifiedFlowSVG() {
  const svg = document.getElementById('unifiedFlowSvg');
  if (!svg) return;

  // Helper for drawing text labels
  const label = (x, y, text, w) => `
    <rect x="${x - w/2}" y="${y - 12}" width="${w}" height="24" rx="4" class="uf-label-bg" />
    <text x="${x}" y="${y}" class="uf-label-text">${text}</text>
  `;

  // Helper for animated paths
  const path = (id, d, cls) => `<path id="${id}" d="${d}" class="uf-line ${cls}" marker-end="url(#arr1)"/>`;
  
  // Helper for moving packets
  const packet = (pathId, dur, color='#00d4ff', delay='0s') => `
    <circle r="5" fill="${color}" style="filter:drop-shadow(0 0 5px ${color})">
      <animateMotion dur="${dur}" begin="${delay}" repeatCount="indefinite">
        <mpath href="#${pathId}"/>
      </animateMotion>
    </circle>
  `;

  // Draw interactive node box
  const rectNode = (x, y, w, h, title, info, cls="uf-node", txtCls="", idPrefix="") => `
    <g class="uf-node-group" onclick="addAlert('${info}', 'info')">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="${cls}" />
      <text x="${x + w/2}" y="${y + h/2 + (idPrefix ? -2 : 5)}" class="uf-node-text ${txtCls}">${title}</text>
      ${idPrefix ? `<text id="svg-data-${idPrefix}" x="${x + w/2}" y="${y + h/2 + 14}" class="uf-node-data"></text>` : ''}
    </g>
  `;

  // Draw interactive cylinders
  const cylinder = (x, y, w, h, cls, txtCls, text, info, idPrefix="") => `
    <g class="uf-node-group" onclick="addAlert('${info}', 'info')">
      <path d="M ${x} ${y+15} C ${x} ${y-5}, ${x+w} ${y-5}, ${x+w} ${y+15} L ${x+w} ${y+h-15} C ${x+w} ${y+h+5}, ${x} ${y+h+5}, ${x} ${y+h-15} Z" class="${cls}" />
      <ellipse cx="${x + w/2}" cy="${y+15}" rx="${w/2}" ry="15" class="${cls}" />
      <text x="${x + w/2}" y="${y + h/2 + (idPrefix ? -2 : 5)}" class="uf-node-text ${txtCls}">${text}</text>
      ${idPrefix ? `<text id="svg-data-${idPrefix}" x="${x + w/2}" y="${y + h/2 + 14}" class="uf-node-data"></text>` : ''}
    </g>
  `;

  let html = `
    <!-- Layer Bounding Boxes -->
    <rect x="470" y="100" width="450" height="380" rx="4" class="uf-layer" />
    <text x="695" y="130" text-anchor="middle" class="uf-layer-text">Hardware Acceleration Layer</text>

    <rect x="30" y="380" width="390" height="100" rx="4" class="uf-layer" />
    <text x="225" y="405" text-anchor="middle" class="uf-layer-text">Confidential Computing Layer</text>

    <rect x="30" y="500" width="390" height="140" rx="4" class="uf-layer" />
    <text x="225" y="525" text-anchor="middle" class="uf-layer-text">Storage Layer</text>

    <rect x="30" y="680" width="450" height="380" rx="4" class="uf-layer" />
    <text x="255" y="710" text-anchor="middle" class="uf-layer-text">AI Orchestration Layer</text>

    <!-- Lines / Arrows -->
    <defs>
      <marker id="arr1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#00d4ff"/></marker>
    </defs>
    
    ${path('pReq', 'M 695 70 L 695 155', '')}
    ${label(695, 110, '1. SQL/NoSQL Request', 150)}

    ${path('pDen', 'M 770 310 L 800 405', '')}
    ${label(800, 360, 'Policy Denied', 90)}

    ${path('pAll', 'M 620 310 L 530 350 L 320 350 L 320 410', '')}
    ${label(460, 350, '2. Policy Allowed', 120)}

    ${path('pSec', 'M 225 465 L 225 525', '')}
    ${label(225, 495, '3. Secure Execution', 130)}

    ${path('pStr', 'M 180 610 L 180 735', 'uf-line-dashed')}
    ${label(180, 670, 'Streams Resource Usage', 150)}

    ${path('pLog', 'M 180 810 L 180 855', '')}
    
    ${path('pFor', 'M 180 910 L 180 965', '')}
    ${label(180, 940, 'Forecasts Demand', 120)}

    ${path('pMig', 'M 290 995 L 360 995 L 360 595 L 350 595', 'uf-line-dashed')}
    ${label(360, 810, 'Executes Graceful Migration', 170)}

    <!-- Animated Packets -->
    ${packet('pReq', '1.5s', '#00d4ff', '0s')}
    ${packet('pDen', '1.5s', '#ef4444', '0.5s')}
    ${packet('pAll', '2s', '#4ade80', '0.2s')}
    ${packet('pSec', '1s', '#4ade80', '2.2s')}
    ${packet('pStr', '2s', '#f59e0b', '0s')}
    ${packet('pLog', '1s', '#a78bfa', '0.5s')}
    ${packet('pFor', '1s', '#00d4ff', '1s')}
    ${packet('pMig', '3s', '#f59e0b', '0s')}

    <!-- Interactive Nodes -->
    ${rectNode(565, 20, 260, 50, 'Tenant Application Layer', 'Tenant initiates SQL/NoSQL query via multi-tenant API gateway.', 'uf-node', '', 'tenant')}

    <g class="uf-node-group" onclick="addAlert('DPU Hardware Engine performs line-rate Zero-Trust access control.', 'info')">
      <path d="M 695 160 L 845 260 L 695 360 L 545 260 Z" class="uf-node uf-diamond" />
      <text x="695" y="245" class="uf-node-text uf-diamond-text">SmartNIC / DPU Security</text>
      <text x="695" y="265" class="uf-node-text uf-diamond-text">Engine</text>
      <text id="svg-data-dpu" x="695" y="285" class="uf-node-data" style="fill:#fcd34d"></text>
    </g>

    ${rectNode(710, 410, 180, 50, 'Connection Dropped', 'Unauthorized access blocked at hardware level before hitting CPU.', 'uf-node uf-dropped', 'uf-dropped-text')}

    <g class="uf-node-group" onclick="addAlert('Trusted Execution Environment decrypts and processes the query securely.', 'info')">
      <rect x="70" y="415" width="310" height="50" rx="4" class="uf-node" />
      <text x="225" y="425" class="uf-node-text">Trusted Execution</text>
      <text x="225" y="445" class="uf-node-text">Environment - TEE</text>
      <text id="svg-data-tee" x="225" y="462" class="uf-node-data"></text>
    </g>

    ${cylinder(90, 540, 270, 70, 'uf-node', '', 'Physical Database Cluster', 'Distributed storage cluster processes the query execution.', 'db')}
    ${cylinder(70, 740, 220, 70, 'uf-node', '', 'Cluster Telemetry Logs', 'Aggregated resource utilization metrics (CPU, Memory, I/O).', 'log')}

    ${rectNode(70, 860, 220, 50, 'LSTM Predictive Model', 'AI model forecasts future workload demands 30-120s ahead.', 'uf-node', '', 'lstm')}
    ${rectNode(70, 970, 220, 50, 'Proactive Orchestrator', 'Orchestrator initiates live migrations based on LSTM predictions.', 'uf-node', '', 'orch')}
  `;

  svg.innerHTML = html;
}
window.addEventListener('load', buildUnifiedFlowSVG);

/* ================================================================
   PERFORMANCE CALCULATIONS
   ================================================================ */
const latencyData = [
  { op: 'SELECT', sw: 8.2, hw: 1.2 },
  { op: 'JOIN',   sw: 7.5, hw: 3.0 },
  { op: 'UPDATE', sw: 8.8, hw: 3.6 },
];

function calcPerformance() {
  const rows = document.querySelectorAll('.lt-row');
  rows.forEach((row, i) => {
    const d = latencyData[i];
    const pct = (((d.sw - d.hw) / d.sw) * 100).toFixed(1);
    row.querySelector('.red-val').textContent = `${pct}%`;
  });

  const avgSw = latencyData.reduce((s, d) => s + d.sw, 0) / latencyData.length;
  const avgHw = latencyData.reduce((s, d) => s + d.hw, 0) / latencyData.length;
  const avgRed = (((avgSw - avgHw) / avgSw) * 100).toFixed(1);
  const ratio = (avgSw / avgHw).toFixed(1);

  document.getElementById('avgSw').textContent = avgSw.toFixed(1) + 'ms';
  document.getElementById('avgHw').textContent = avgHw.toFixed(1) + 'ms';
  document.getElementById('avgRed').textContent = avgRed + '%';
  document.getElementById('speedRatio').textContent = ratio + '×';
}
calcPerformance();

/* Migration score circles */
function animateScoreCircle(id, pct, delay = 0) {
  const el = document.getElementById(id);
  const ring = el.querySelector('.score-ring');
  const valEl = el.querySelector('.score-val');
  const circ = 213.6;
  setTimeout(() => {
    ring.style.transition = 'stroke-dashoffset 1.5s ease';
    ring.style.strokeDashoffset = circ - (circ * pct / 100);
    let c = 0;
    const t = setInterval(() => {
      c = Math.min(c + 1, pct);
      valEl.textContent = c + '%';
      if (c >= pct) clearInterval(t);
    }, 1500 / pct);
  }, delay);
}

const perfObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    animateScoreCircle('migScore', 71, 0);
    animateScoreCircle('stabScore', 88, 300);
    animateScoreCircle('effScore', 94, 600);
    perfObserver.disconnect();
  }
}, { threshold: 0.3 });
perfObserver.observe(document.getElementById('performance'));

/* ================================================================
   LATENCY CHART – Bar chart via Canvas
   ================================================================ */
function drawLatencyChart() {
  const canvas = document.getElementById('latencyChart');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const labels = latencyData.map(d => d.op);
  const swVals = latencyData.map(d => d.sw);
  const hwVals = latencyData.map(d => d.hw);
  const maxVal = 10;
  const barW = 30, gap = 20;
  const groupW = barW * 2 + gap;
  const startX = 50;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = H - 30 - (i / 5) * (H - 50);
    ctx.beginPath();
    ctx.moveTo(40, y); ctx.lineTo(W - 10, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px Inter'; ctx.textAlign = 'right';
    ctx.fillText((i * 2) + 'ms', 38, y + 3);
  }

  labels.forEach((lbl, i) => {
    const gx = startX + i * (groupW + 40);

    // SW bar
    const swH = (swVals[i] / maxVal) * (H - 50);
    ctx.fillStyle = '#ef4444cc';
    ctx.fillRect(gx, H - 30 - swH, barW, swH);

    // HW bar
    const hwH = (hwVals[i] / maxVal) * (H - 50);
    ctx.fillStyle = '#00d4ffcc';
    ctx.fillRect(gx + barW + 4, H - 30 - hwH, barW, hwH);

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(lbl, gx + barW + 2, H - 10);
  });

  // Legend
  ctx.fillStyle = '#ef4444'; ctx.fillRect(W - 130, 8, 12, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '9px Inter'; ctx.textAlign = 'left';
  ctx.fillText('Software ABAC', W - 114, 17);
  ctx.fillStyle = '#00d4ff'; ctx.fillRect(W - 130, 24, 12, 10);
  ctx.fillText('HIS-DBaaS DPU', W - 114, 33);
}

window.addEventListener('load', drawLatencyChart);
window.addEventListener('resize', drawLatencyChart);

/* ================================================================
   ORCHESTRATION – Telemetry Charts
   ================================================================ */
function initNodeGrid() {
  const grid = document.getElementById('nodeGrid');
  grid.innerHTML = '';
  // 16 nodes to show a larger cluster
  const nodeStates = [
    'active','active','active','active',
    'active','migrating','active','overload',
    'active','active','active','active',
    'active','active','migrating','active'
  ];
  for (let i = 0; i < nodeStates.length; i++) {
    const div = document.createElement('div');
    div.className = `db-node ${nodeStates[i]}`;
    div.id = `node-${i}`;
    div.innerHTML = `<div class="node-icon">🗄️</div><div>Node-${i+1}</div>`;
    grid.appendChild(div);
  }
}
initNodeGrid();

function addMigLog(msg) {
  const log = document.getElementById('migLog');
  const d = document.createElement('div');
  d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.prepend(d);
  while (log.children.length > 10) log.removeChild(log.lastChild);
}

function addAlert(msg, type = 'warn') {
  const alerts = document.getElementById('lstmAlerts');
  const a = document.createElement('div');
  a.className = `alert-item ${type}`;
  a.textContent = msg;
  alerts.prepend(a);
  while (alerts.children.length > 4) alerts.removeChild(alerts.lastChild);
}

/* Canvas-based sparkline */
function drawSparkline(ctx, data, color, W, H) {
  ctx.clearRect(0, 0, W, H);
  const max = 100, min = 0;
  const step = W / (data.length - 1);

  // Fill area
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / (max - min)) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo((data.length - 1) * step, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = color + '22';
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / (max - min)) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

async function updateTelemetry() {
  STATE.tick++;
  const t = STATE.tick;

  try {
    const res = await fetch(`/api/telemetry?tick=${t}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    
    const cpu = data.cpu;
    const mem = data.memory;
    const io = data.io;
    const net = data.network;
    const qps = data.qps;
    const spike = data.spike;

    // Update meters
    ['cpu','mem','io','net'].forEach((key, i) => {
      const vals = [cpu, mem, io, net];
      const pct = Math.round(vals[i]);
      document.getElementById(`${key}Fill`).style.width = pct + '%';
      document.getElementById(`${key}Pct`).textContent = pct + '%';
    });

    // Update SVG Data Flow text if exists
    if (document.getElementById('svg-data-tenant')) {
      document.getElementById('svg-data-tenant').textContent = `Live QPS: ${qps}`;
      document.getElementById('svg-data-dpu').textContent = `Latency: 1.2ms (HW)`;
      document.getElementById('svg-data-tee').textContent = `Secure Enclave Active`;
      document.getElementById('svg-data-db').textContent = `Avg CPU: ${Math.round(cpu)}% | I/O: ${Math.round(io)}%`;
      document.getElementById('svg-data-log').textContent = `Streaming ${Math.round(qps * 0.4)} logs/sec`;
      document.getElementById('svg-data-lstm').textContent = spike ? `Forecast: ${Math.round(data.lstm_prediction)}% (Spike)` : `Forecast: ${Math.round(data.lstm_prediction)}% (Normal)`;
      document.getElementById('svg-data-lstm').style.fill = spike ? '#f59e0b' : '#4ade80';
      document.getElementById('svg-data-orch').textContent = spike ? `Migrating Nodes...` : `Monitoring Active`;
    }

    // Update data arrays (rolling window)
    STATE.cpuData.push(cpu); STATE.cpuData.shift();
    STATE.memData.push(mem); STATE.memData.shift();
    STATE.ioData.push(io);   STATE.ioData.shift();

    // LSTM prediction (ahead by a few ticks)
    const predicted = data.lstm_prediction;
    STATE.lstmData.push(predicted); STATE.lstmData.shift();

    // Draw telemetry chart
    const tc = document.getElementById('telemetryChart');
    tc.width = tc.offsetWidth;
    const tCtx = tc.getContext('2d');
    const W = tc.width, H = tc.height;
    tCtx.clearRect(0, 0, W, H);
    drawSparklineMulti(tCtx, [STATE.cpuData, STATE.memData, STATE.ioData], ['#3b82f6','#a78bfa','#f59e0b'], W, H);

    // Draw LSTM chart
    const lc = document.getElementById('lstmChart');
    lc.width = lc.offsetWidth;
    const lCtx = lc.getContext('2d');
    lCtx.clearRect(0, 0, lc.width, lc.height);
    drawSparklineMulti(lCtx, [STATE.cpuData, STATE.lstmData], ['#00d4ff','#4ade80'], lc.width, lc.height);

    // Alerts
    if (spike && t % 5 === 0) {
      addAlert(`⚠️ Demand spike predicted (CPU ${Math.round(cpu)}%)`, 'warn');
      document.getElementById('lstmStatus').innerHTML = '<div class="lstm-dot" style="background:#f59e0b"></div><span>Spike Forecasted!</span>';
      // Trigger migration on node 5
      const nodeEl = document.getElementById('node-5');
      if (nodeEl) nodeEl.className = 'db-node migrating';
      addMigLog('Live migration triggered on Node-6 → Node-3');
    } else if (!spike) {
      document.getElementById('lstmStatus').innerHTML = '<div class="lstm-dot"></div><span>Monitoring…</span>';
      const nodeEl = document.getElementById('node-5');
      if (nodeEl) nodeEl.className = 'db-node active';
    }

    // QPS
    STATE.qpsData.push(qps); STATE.qpsData.shift();
    drawQPS();

    // KPIs
    updateKPIs(cpu);
  } catch (err) {
    console.error("Failed to fetch telemetry from backend:", err);
  }
}

function drawSparklineMulti(ctx, datasets, colors, W, H) {
  const max = 100;
  datasets.forEach((data, di) => {
    const step = W / (data.length - 1);
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = H - (v / max) * (H - 10) - 5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors[di];
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawQPS() {
  const canvas = document.getElementById('qpsChart');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...STATE.qpsData, 800);
  const step = W / (STATE.qpsData.length - 1);

  // Fill
  ctx.beginPath();
  STATE.qpsData.forEach((v, i) => {
    const x = i * step;
    const y = H - (v / max) * (H - 20) - 10;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo((STATE.qpsData.length - 1) * step, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,212,255,0.35)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  STATE.qpsData.forEach((v, i) => {
    const x = i * step;
    const y = H - (v / max) * (H - 20) - 10;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Current QPS label
  const cur = STATE.qpsData[STATE.qpsData.length - 1];
  ctx.fillStyle = 'rgba(0,212,255,0.9)';
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.fillText(`${cur} QPS`, W - 80, 20);
}

function updateKPIs(cpu) {
  animKPI('kpiLatency', '2.6ms');
  animKPI('kpiStab', '88%');
  animKPI('kpiSec', '99.4%');
  animKPI('kpiSLA', '99.9%');
  animKPI('kpiScale', '8');
  animKPI('kpiPred', '94.2%');
}

function animKPI(id, val) {
  const el = document.getElementById(id);
  if (el && el.textContent !== val) el.textContent = val;
}

/* ================================================================
   START SIMULATION BUTTON
   ================================================================ */
document.getElementById('startSimBtn').addEventListener('click', () => {
  if (STATE.simulationRunning) return;
  STATE.simulationRunning = true;

  // Scroll to orchestration
  document.getElementById('orchestration').scrollIntoView({ behavior: 'smooth' });

  // Start telemetry loop
  STATE.telemetryInterval = setInterval(updateTelemetry, 800);

  addMigLog('Simulation started');
  addAlert('✅ HIS-DBaaS simulation active', 'ok');
});

/* ================================================================
   QPS chart auto-start (even without simulation)
   ================================================================ */
function initQPS() {
  STATE.qpsData = Array(40).fill(0).map(() => Math.round(200 + Math.random() * 300));
  drawQPS();
  setInterval(() => {
    if (!STATE.simulationRunning) {
      const qps = Math.round(200 + Math.random() * 300);
      STATE.qpsData.push(qps); STATE.qpsData.shift();
      drawQPS();
    }
  }, 1000);
}

/* ================================================================
   SECURITY ANIMATIONS
   ================================================================ */
function startSecurityAnimations() {
  // CPU bars animate via CSS already
  // DPU packets animate via CSS already
}

/* ================================================================
   INTERSECTION OBSERVER – lazy animate sections
   ================================================================ */
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.arch-card, .perf-card, .orch-panel, .sec-card, .kpi-card, .avg-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  sectionObserver.observe(el);
});

/* ================================================================
   DASHBOARD – animate KPI counters on scroll
   ================================================================ */
const dashObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    // Kick initial KPI values
    animKPI('kpiLatency', '2.6ms');
    animKPI('kpiStab', '88%');
    animKPI('kpiSec', '99.4%');
    animKPI('kpiSLA', '99.9%');
    animKPI('kpiScale', '8');
    animKPI('kpiPred', '94.2%');
    dashObserver.disconnect();
  }
}, { threshold: 0.3 });
dashObserver.observe(document.getElementById('dashboard'));

/* ================================================================
   INIT
   ================================================================ */
window.addEventListener('load', () => {
  drawLatencyChart();
  initQPS();
  startSecurityAnimations();
  addMigLog('System online. Click "Start Simulation" to begin.');
});

window.addEventListener('resize', () => {
  drawLatencyChart();
  drawQPS();
});
