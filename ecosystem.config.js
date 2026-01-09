module.exports = {
  apps: [{
    name: 'cne-app',
    script: './server.js',
    instances: 2, // Start with 2 instances (can scale based on CPU cores)
    exec_mode: 'cluster', // Cluster mode for load balancing
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    error_file: '~/.pm2/logs/cne-app-error.log',
    out_file: '~/.pm2/logs/cne-app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Auto restart on file changes in production
    watch: false,
    // Graceful shutdown
    kill_timeout: 5000,
    // Health check
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
