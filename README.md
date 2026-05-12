# HIS-DBaaS — Hybrid Intelligent & Secure Database-as-a-Service Framework

> Research Prototype · AI Orchestration · Hardware-Accelerated Zero-Trust Security · Multi-Tenant DBaaS

---

## Project Structure

```
/project-root
├── index.html              ← Main SPA entry point
├── css/
│   └── style.css           ← Complete stylesheet (dark academic theme)
├── js/
│   └── app.js              ← All frontend logic, charts, simulation
├── app.py                  ← Flask Backend serving JSON APIs
│   # API Endpoints:
│   # GET /api/telemetry?tick=N  → cluster metrics
│   # GET /api/latency           → latency analytics
│   # GET /api/cluster           → node status
│   # GET /api/simulation?tick=N → full sim tick
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

---

## Features

| Section | Description |
|---|---|
| **Hero** | Animated particle canvas, counter stats, Start Simulation CTA |
| **Architecture** | 5-layer SVG diagram with animated arrows and hover effects |
| **Data Flow** | Tabbed flow diagram — Query Path & Orchestration Path |
| **Performance** | Latency comparison table, bar chart, migration circles |
| **Orchestration** | Live telemetry meters, LSTM chart, node grid, migration log |
| **Security** | SW ABAC vs HW DPU side-by-side, Zero-Trust workflow |
| **Dashboard** | KPI cards, live QPS chart |

---

## Key Metrics Visualized

| Metric | Baseline | HIS-DBaaS | Improvement |
|---|---|---|---|
| SELECT latency | 8.2 ms | 1.2 ms | **85.4% faster** |
| JOIN latency | 7.5 ms | 3.0 ms | **60.0% faster** |
| UPDATE latency | 8.8 ms | 3.6 ms | **59.1% faster** |
| Disruptive migrations | 41 | 12 | **70.7% reduction** |

---

## Running Locally

### Option A — Static only (no backend required)
Open `index.html` directly in a browser. All simulation is frontend-only (except telemetry which tries to fetch).

### Option B — With Python (Flask) Backend (Recommended)
```bash
# Install requirements
pip install flask flask-cors

# Start the server
python app.py
```
Then open `http://localhost:5000` or open `index.html` locally in your browser.

---

## Technology Stack

- **HTML5** — Semantic structure, accessibility
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **JavaScript (Vanilla)** — Canvas, IntersectionObserver, modular logic
- **Python (Flask)** — RESTful JSON APIs for telemetry, latency, cluster, simulation
- **SVG** — Architecture diagrams with animated flow arrows
- **Canvas API** — Sparklines, bar charts, QPS graph

---

## Architecture Layers

1. **Tenant Application Layer** — Multi-tenant query entry, API gateway, TLS 1.3
2. **SmartNIC / DPU Engine** — Hardware ABAC at line-rate, zero CPU overhead
3. **AI Orchestration (LSTM)** — 30–120s ahead demand forecasting, proactive migration
4. **Trusted Execution Environment** — Intel SGX / AMD SEV encrypted query processing
5. **Physical DB Cluster** — Distributed NVMe PostgreSQL/MySQL with live migration

---

*HIS-DBaaS Research Prototype — Academic Visualization Platform*
