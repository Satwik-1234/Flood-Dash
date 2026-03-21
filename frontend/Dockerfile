FROM node:20-alpine

WORKDIR /app

# Copy package files first (layer cache optimization)
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies
RUN npm ci

# Copy source
COPY . .

EXPOSE 5173

# Vite dev server — hot reload, accessible from host via 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
