module.exports = {
    apps: [
        {
            name: 'taskboard-server',
            script: 'dist/main.js',
            namespace: 'taskboard',
            exec_mode: 'fork',
            instances: 1,
            watch: false,
            autorestart: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'DEV',
            },
            env_production: {
                NODE_ENV: 'PROD',
            },
        },
    ],
};