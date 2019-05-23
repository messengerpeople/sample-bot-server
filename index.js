'use strict';

const App        = require('./src/App');
const routes     = require('./src/routes');
const middleware = require('./src/middleware');
const config     = require('./config.json');

if ( config.verificationToken === 'change-me' || config.auth.clientId === 'your-client-id' ) {
  console.error([
    '',
    '  Please update the configuration first and insert your details,',
    `  otherwise the application won't connect to the API.`,
    '',
    '  To obtain your OAuth credentials and create the webhook, please',
    '  log in to the dashboard at https://app.messengerpeople.dev and',
    '  configure your account.',
    '',
    '  If you need help, please contact our support at ' +
    '  api@messengerpeople.dev.',
    '',
    '  With ❤, MessengerPeople',
    '',
  ].join('\n'));

  process.exit(1);
}

/**
 * Holds the application instance
 *
 * @type {App}
 */
const app = new App(
  routes(config),
  middleware(config),
);

// Let the application listen
app.listen(config.port || 3000, config.host || 'localhost');
