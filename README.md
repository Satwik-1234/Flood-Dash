# Pravhatattva v3.0 \u00b7 The Essence of Flow 🌊🛡️
### Real-Time Flood Intelligence & Prediction System for India

**Created by:** Satwik Laxmikamalakar Udupi  
**Vision:** A system built not just for India's people, but for every institution that protects them — NDRF, CWC, IMD, WRD, State SDMAs, and District Collectors.

---

## 🎯 Project Overview
Pravhatattva is a production-grade, highly-resilient Web Application dedicated to forecasting and monitoring hydrological disasters across Maharashtra. It maps data from the **Central Water Commission (CWC)** and the **Indian Meteorological Department (IMD)** into a pristine, District Commander-level interface.

### The "Zero-Server" Superpowers
Traditional flood ML platforms crash under heavy traffic and cost thousands of dollars to host. Pravhatattva was architected under extreme austerity measures (designed explicitly for a `<150MB` local machine constraint):
- **Zero Paid Hosting:** Database scraping runs perfectly on *GitHub Actions Cloud VMs*.
- **Zero Backend Servers:** ML Python inferencing is outsourced to *WebAssembly ONNX browser processing*.
- **100% Uptime:** The React frontend compiles strictly to static files deployed on *GitHub Pages CDN*.

## 🗺️ System Architecture Visualization

```mermaid
graph TD
    classDef cloud fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef github fill:#24292e,color:#fff,stroke:#333;
    classDef frontend fill:#3b82f6,color:#fff,stroke:#333;
    classDef logic fill:#10b981,color:#fff,stroke:#333;

    A[IMD API] & B[CWC API] -->|Public Telemetry| C
    
    subgraph GitHub Ecosystem [Free Zero-Server Cloud]
        C(cron: telemetry_sync.yml) -->|JSON Scrape| D[public/mock/*.json]
        D -->|Triggers Build| E(deploy.yml)
        E -->|Publish| F((GitHub Pages CDN))
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

## 🛠️ Technology Stack
- **Framework:** React 18 + Vite + TypeScript (Strict)
- **Design System:** Built strictly to the **CCCSS SUK Dashboard** aesthetics (Forest Green, Playfair Display)
- **Data Layer:** `@tanstack/react-query` + `zod`
- **Geospatial & Visuals:** MapLibre GL JS + HTML/CSS Pure Hydrographs (No heavy graphing libs)
- **Machine Learning Tooling:** `onnxruntime-web` + Pure Python FastAPI (Local Fallback)
- **End-to-End Testing:** Microsoft Playwright (Cloud Execution Only)

## 🚀 Local Development
1. Clone the repository: `git clone https://github.com/Satwik-1234/Flood-Dash.git`
2. Change into frontend: `cd frontend`
3. Install strict dependencies: `npm ci`
4. Run locally: `npm run dev`

Read `DEPLOYMENT.md` to instantly launch this platform to the world for $0.
