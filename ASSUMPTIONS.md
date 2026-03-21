# 🌊 FloodSentinel India — Project Infrastructure Assumptions

As this is a production-grade application for real-time flood monitoring, several architectural choices were made based on senior-level engineering principles and hydrological requirements.

## 1. Environment & Tools
- **Tooling Gap**: During project bootstrap, common development tools like `node`, `npm`, and `npx` were not detected in the current PATH. To proceed with Phase 1 (Foundation), all project structure and configuration files were manually scaffolded. 
- **Developer Expectation**: It is assumed the user will either Dockerize the application or has a specific local development environment (e.g., portable node, nvm, or wsl) that was not automatically visible to the system during initialization.

## 2. UI/UX Hierarchy
- **The "Command Center" Approach**: A dark theme is non-negotiable for operational dashboards. It reduces eye fatigue during long monitoring shifts and improves the visual contrast for critical color-coded flood alerts.
- **Micro-Animations**: Strategic pulsations (e.g., Red Alerts) are implemented in CSS to draw immediate attention without causing cognitive overload.

## 3. Data Integrity & Proxying
- **IP Whitelisting**: Many Indian governmental APIs (like IMD) require rigid whitelisting. The architecture uses the FastAPI backend as a dedicated proxy to handle authentication, caching, and IP-bridging, ensuring the frontend remains as thin as possible.
- **Stale Data Management**: In a mission-critical context, a "No Data" state is distinct from a "Safe" state. The map choropleths distinguish between Gray (No Monitoring) and Green (Below-Normal/Normal).

## 4. Geospatial Execution
- **MapLibre Choice**: MapLibre GL JS was chosen over Leaflet for its high-performance WebGL rendering capabilities, which are essential for visualizing large-scale district GeoJSONs and multiple raster WMS layers (GPM Rainfall/Bhuvan Inundation) simultaneously.

## 5. Offline Capabilities
- **Service Worker**: A service worker strategy is assumed for production to cache the last known state from the backend (PWA capabilities) to ensure the system remains functional during network outages common during heavy rainfall events.
