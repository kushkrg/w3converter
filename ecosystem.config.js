const fs = require('fs');
const path = require('path');

// Load environment variables from apps/web/.env
const env = {};
try {
  const envPath = path.join(__dirname, 'apps/web/.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        env[key] = val;
      }
    }
  }
} catch (e) {
  console.error("Warning: Failed to load apps/web/.env in ecosystem.config.js:", e);
}

module.exports = {
  apps: [
    {
      name: "w3converter-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "./apps/web",
      env: {
        ...env,
        NODE_ENV: "production",
      },
    },
    {
      name: "w3converter-worker",
      script: "pnpm",
      args: "run worker",
      cwd: "./",
      env: {
        ...env,
        NODE_ENV: "production",
        UPLOAD_DIR: "/tmp/pdftools/uploads",
        OUTPUT_DIR: "/tmp/pdftools/outputs",
      },
    },
    {
      name: "w3converter-janitor",
      script: "pnpm",
      args: "run janitor",
      cwd: "./",
      env: {
        ...env,
        NODE_ENV: "production",
        UPLOAD_DIR: "/tmp/pdftools/uploads",
        OUTPUT_DIR: "/tmp/pdftools/outputs",
        JANITOR_INTERVAL_MS: "300000",
      },
    },
  ],
};
