<div align="center">
  <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/shield-check.svg" width="120" alt="Pravhatattva Logo"/>
  <h1>Pravhatattva v3.0 🌊 <br/> <em>The Essence of Flow</em></h1>
  <p><strong>A Production-Grade, "Zero-Server" Machine Learning Flood Intelligence Platform</strong></p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/Satwik-1234/Flood-Dash/actions"><img src="https://img.shields.io/github/actions/workflow/status/Satwik-1234/Flood-Dash/deploy.yml?label=Vite%20Build%20%26%20Deploy&style=for-the-badge" alt="Build Status"></a>
    <a href="https://github.com/Satwik-1234/Flood-Dash/actions"><img src="https://img.shields.io/github/actions/workflow/status/Satwik-1234/Flood-Dash/e2e_tests.yml?label=Playwright%20E2E&style=for-the-badge&color=purple" alt="E2E Tests"></a>
    <a href="https://github.com/Satwik-1234/Flood-Dash/actions"><img src="https://img.shields.io/github/actions/workflow/status/Satwik-1234/Flood-Dash/telemetry_sync.yml?label=Data%20Scraper%20(Cron)&style=for-the-badge&color=orange" alt="Cron Job"></a>
    <br/>
    <img src="https://img.shields.io/badge/React-18.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/ONNX_WASM-Enabled-005CED?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX ML" />
    <img src="https://img.shields.io/badge/MapLibre-GL_JS-FF8170?style=for-the-badge&logo=maplibre&logoColor=white" alt="MapLibre GL" />
  </p>
</div>

---

## 🎨 Frontend Visualization Profile

![Pravhatattva UI Dashboard Mockup](assets/pravhatattva_mockup.png)

Pravhatattva utilizes the official **CCCSS SUK Dashboard Aesthetic**—incorporating `<150MB` optimized CSS Glassmorphism logic layered continuously over strict Neon-Glowing vector path streams mapped directly to Indian rivers.

### The React Component Domain Map
```mermaid
graph TD
    classDef main fill:#1e293b,color:#f8fafc,stroke:#475569;
    classDef view fill:#0ea5e9,color:#fff,stroke:#0284c7;
    classDef comp fill:#10b981,color:#fff,stroke:#059669;

    A[main.tsx] -->|TanStack QueryProvider| B(App.tsx Router)
    
    B --> C[Layout.tsx]
    C -->|Sidebar| D[Navigation Hub]
    
    B --> V1(LiveMap.tsx)
    B --> V2(AlertCenter.tsx)
    B --> V3(MLAnalysis.tsx)
    B --> V4(DistrictDrilldown.tsx)
    
    V1 --> C1[MapLibre Canvas]
    V1 --> C2[StationPopup.tsx]
    C2 -->|Pure CSS| C3[48h Trend Charting]
    
    V2 --> C4[Zod IMD Schema Hook]
    V4 --> C5[CWC Live JSON Validation]
    
    V3 --> C6[ONNX WASM Worker]

    class A,B,C main;
    class V1,V2,V3,V4 view;
    class C1,C2,C3,C4,C5,C6 comp;
```

---

## 📖 Mission Statement

**Pravhatattva** (*The Essence of Flow*) was engineered to protect Indian catchments by providing NDRF, CWC, IMD, State SDMAs, and District Collectors with real-time, zero-latency hydrological analytics. 

Instead of relying on fragile, highly-expensive Python backend servers that crash during catastrophic weather events, Pravhatattva introduces a revolutionary **"Zero-Server Architecture"**. It shifts all ML execution to the user's browser via WebAssembly (ONNX) and delegates database scraping to free GitHub Cloud pipelines. 

**The result? A dashboard that costs $0 to host globally, with indestructible 100% CDN uptime.**

---

## ⚡ Core Features

- 🛰️ **Live Telemetry Engine:** `useCWCStations` and `useIMDWarnings` TanStack queries strictly validate raw JSON telemetry via **Zod** mathematical schemas to prevent UI crashes if sensors fail.
- 🧠 **Browser-Native ML (ONNX):** Neural Networks execute directly on District Magistrates' local GPUs using `onnxruntime-web`, removing external API latency during severe crisis response maps.
- 🗺️ **Live MapLibre Overlays:** Interactive geospatial vectors displaying active river thresholds, integrated with a custom-engineered 4-tab interactive Data Popup (featuring pure-CSS 48h trend hydrographs).
- 🚨 **The Alert Matrix:** Dynamic Dashboard utilizing the CCCSS SUK Design tokens (`L5 Extreme` down to `L1 Normal`) to visually rank District-level meteorological threats.
- ☁️ **Automated E2E QA:** Microsoft Playwright tests rigorously execute on Linux GitHub VMs every time code is pushed.

---

## 🏗️ The Data/System Architecture

```mermaid
graph TD
    classDef cloud fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef github fill:#24292e,color:#fff,stroke:#333;
    classDef frontend fill:#3b82f6,color:#fff,stroke:#333;
    classDef logic fill:#10b981,color:#fff,stroke:#333;

    A[IMD API] & B[CWC API] -->|Public Telemetry| C
    
    subgraph GitHub Ecosystem [Free Cloud Fabric]
        C(telemetry_sync.yml) -->|Python Scraper Runs every 15m| D[frontend/public/mock/*.json]
        D -->|Triggers React Build| E(deploy.yml)
        E -->|Publishes Files| F((GitHub Pages CDN))
    end
    
    subgraph Client Browser [End User Machine]
        F -.->|Static Delivery| G[Vite React Application]
        G --> H[TanStack Query Data Layer]
        H --> I[Zod Validation]
        I --> J[LiveMap & Alert Center]
        G --> K[ONNX WebAssembly ML Engine]
    end

    class A,B cloud;
    class C,E,F github;
    class G,D frontend;
    class H,I,K logic;
```

---

## 💻 Tech Stack Deep-Dive

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 & Vite | Lightning-fast HMR and minimal production bundling. |
| **Type Safety** | TypeScript `v5` (Strict) | Enforcing interfaces across complex geospatial APIs. |
| **Networking & Validation** | `@tanstack/react-query` & `zod` | Caching dynamic API states; mathematically parsing JSON. |
| **Mapping Engine** | `maplibre-gl` | WebGL hardware-accelerated rendering for river vectors. |
| **Machine Learning** | `onnxruntime-web` | Processing deep learning Python models natively in browser. |
| **Data Pipelines** | GitHub Actions | 15-minute Python scrapers generating zero-cost data-lakes. |
| **Testing** | Playwright E2E | Rendering Headless Chrome interactions across routing pages. |

---

## 🛠️ Local Development & Deployment

To run this platform strictly on your local machine:

```bash
# 1. Clone the master repository
git clone https://github.com/Satwik-1234/Flood-Dash.git

# 2. Enter the workspace
cd frontend

# 3. Install strict dependencies
npm ci

# 4. Spin up the Vite HMR server
npm run dev
```

> **Note on Disk Space & Constraints:** 
> Playwright binaries and heavy `.onnx` models are deliberately omitted from the local installation to protect development setups with tight hard-drive limitations (`< 150MB`). Review `ASSUMPTIONS.md` for our strict austerity engineering rules.

### Cloud Deployment (GitHub Pages)
The CD (Continuous Deployment) pipeline is pre-configured. To take this site live globally:
1. Open your GitHub Repository Settings.
2. Select **Pages** on the left menu.
3. Change **Source** to **"GitHub Actions"**.
4. The `.github/workflows/deploy.yml` takes over and automates everything in 2 minutes.

---

<div align="center">
  <p><strong>Developed with precision engineering by <a href="https://github.com/Satwik-1234">Satwik Laxmikamalakar Udupi</a>.</strong></p>
  <p><em>Pravhatattva — Warning the people before the water arrives, not after.</em></p>
</div>
