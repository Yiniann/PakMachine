module.exports = {
  apps: [
    {
      name: "pacmachine-backend",
      cwd: __dirname,
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 5,
      restart_delay: 2000,
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
      output: "./logs/out.log",
      error: "./logs/error.log",
    },
  ],
};
