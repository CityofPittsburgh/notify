module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // First application
    {
      name      : "Notify",
      script    : "server.js",
      env: {
        TWILIO_NUMBER  : "+15005550006", // Twilio test number.
        TWILIO_ACCOUNT : "Paste Twilio Account SID.",
        TWILIO_TOKEN   : "Paste Twilio Auth Token.",
        NOTIFY_TOKEN   : "Do keyboard cat.",
        NOTIFY_PORT    : 8081
      },
      env_production : {
        NODE_ENV: "production"
      }
    },

    // Second application
    {
      name      : "Snowtify",
      script    : "client.js",
      env: {
        NOTIFY_URL   : "http://localhost:8080/notifications", // Local e.g.
        NOTIFY_TOKEN: "Copy keyboard cat from above.",
        SNOWTIFY_NUMBERS_PATH: "../volunteers.csv", // Local e.g.
        SNOWTIFY_PORT    : 8080
      },
      env_production : {
        NODE_ENV: "production"
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : "node",
      host : "212.83.163.1",
      ref  : "origin/master",
      repo : "git@github.com:repo.git",
      path : "/var/www/production",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env production"
    },
    dev : {
      user : "node",
      host : "212.83.163.1",
      ref  : "origin/master",
      repo : "git@github.com:repo.git",
      path : "/var/www/development",
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env dev",
      env  : {
        NODE_ENV: "dev"
      }
    }
  }
}
