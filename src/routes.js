'use strict';

const MessengerPeopleApiClient = require('./MessengerPeopleApiClient');
const Bot                      = require('./Bot');

/**
 * Route setup function
 * ====================
 * This function takes the configuration object and returns a route setup callback. It will be
 * passed the express server to register the routes.
 *
 * @param  {Object}                       config  Configuration data
 * @return {function(app: Express): void}         Route function
 */
module.exports = function ( config = {} ) {
  const applicationVerificationToken = config.verificationToken;
  const applicationSecret            = config.secret;

  // The API client used here is a simplified version of the npm package we're going to release
  // later this year on GitHub. Feel free to check out its source - there's nothing exciting
  // happening here, just OAuth client credentials authorization and wrapped axios requests to
  // the REST API.
  const apiClient = new MessengerPeopleApiClient();

  // The Bot class is a simple example of what a powerful abstraction might look like: It has a
  // single method to handle incoming messages that can return a promise. This gives us all the
  // possibilities to do magic stuff: Fetching data from remote servers, performing NLP or other
  // text analysis, or just a good ol' switch case for the input message.
  const bot = new Bot(config);

  /**
   * Loads all routes
   *
   * @param {Express} app
   */
  return function ( app ) {
    /**
     * The root endpoint simply reports the status of the bot server.
     * This will not be checked by the MessengerPeople API but could be used by your own
     * infrastructure to make sure everything is fine.
     */
    app.get('/', ( req, res ) => {
      return res.json({
        status: 'ok',
      });
    });

    /**
     * The simple webhook endpoint accepts any incoming messages without further authorization.
     * In a real-world implementation, you might want to use a more obtuse URL to prevent others
     * from guessing it.
     * The webhook recipient must be capable of handling the verification token process which is
     * explained in more detail below. It must handle incoming messages in under 10 seconds, after
     * which our servers will timeout.
     */
    app.post('/webhooks/message', async ( req, res ) => {

      // If the request had no body, abort.
      if ( Object.keys(req.body).length === 0 ) {
        return res
          .json({
            error: 'Bad request',
          })
          .status(400);
      }

      // If we have a verification token, the server requests webhook verification, so we're going
      // to verify. Obviously, this should be implemented as a middleware, but to make the code
      // easier to understand, it's inlined here.
      if ( req.body.hasOwnProperty('verification_token') ) {
        const verificationToken = req.body.verification_token;
        const challenge         = req.body.challenge;

        // The tokens didn't match, so this is a bad request.
        if ( verificationToken !== applicationVerificationToken ) {

          // This response will show up in the "add webhook" dialog, so we should be verbose here.
          return res
            .status(403)
            .json({
              error: 'Bad verification token',
            });
        }

        // If the token sent by the server matches the one we have in our config, this
        // is a legitimate request from the MessengerPeople API, so we return the challenge
        // value and complete the process.
        return res.json({
          challenge,
        });
      }

      try {
        // Obtain an access token from the API, if we don't have one already
        await apiClient.authorize(config.auth.clientId, config.auth.clientSecret);

        // The API expects sender and recipient as an identifier string, separated by a colon. The naming
        // is slightly confusing here: Why would you map sender to sender? That's due to the fact that the
        // webhook reports the message sender - the user that sent the message - and we're going to respond
        // to them, making us the sender again.
        const identifier = `${ config.senderId }:${ req.body.sender }`;

        // We let the bot handle the message and return the whole payload object. That gives us the
        // opportunity to have a simple handler class with the full power of message objects.
        const payload = await bot.handle(req.body);

        // Send the message to the API
        await apiClient.sendMessage({
          identifier,
          payload,
        });
      } catch ( error ) {
        console.error(`[${ new Date }] [ERROR] ${ error.message }`);

        // We'll report this error back to the webhook emitter, so it will get logged and may be reviewed
        // from the dashboard. Since nobody except the MessengerPeople servers will reach this point, we
        // can be verbose here: Anything that might help us later in debugging the issue should be printed.
        return res
          .status(500)
          .json({
            error: error.message,
          });
      }

      // Everything is fine, so we're just reporting that and finish the request.
      return res.status(204);
    });

    /**
     * The secure webhook endpoint works exactly as the simple webhook endpoint above, except that
     * it additionally checks the Authorization header for the pre-configured secret value to make
     * sure messages will only be POSTed by the MessengerPeople API.
     */
    app.post('/secure-webhooks/message', async ( req, res ) => {

      // The request had no body, abort
      if ( Object.keys(req.body).length === 0 ) {
        return res
          .json({
            error: 'Bad request',
          })
          .status(400);
      }

      // The request had no Authorization header, abort
      if ( !req.headers.authorization ) {
        return res
          .status(401)
          .header('WWW-Authenticate', 'Bearer')
          .json({
            error: 'Not authorized',
          });
      }

      // Extract the secret from the request
      const secret = req.headers.authorization.replace('Bearer ', '');

      // If the secret does not match the one we have in our config, abort
      if ( secret !== applicationSecret ) {
        return res
          .status(401)
          .header('WWW-Authenticate', 'Bearer')
          .json({
            error: 'Bad credentials',
          });
      }

      // If we have a verification token, the server requests webhook verification, so we're going
      // to verify. Obviously, this should be implemented as a middleware, but to make the code
      // easier to understand, it's inlined here.
      if ( req.body.hasOwnProperty('verification_token') ) {
        const verificationToken = req.body.verification_token;
        const challenge         = req.body.challenge;

        // The tokens didn't match, so this is a bad request.
        if ( verificationToken !== applicationVerificationToken ) {
          return res
            .status(403)
            .json({
              error: 'Bad verification token',
            });
        }

        // If the token sent by the server matches the one we have in our config, this
        // is a legitimate request from the MessengerPeople API, so we return the challenge
        // value and complete the process.
        return res.json({
          challenge,
        });
      }

      try {
        // Obtain an access token from the API, if we don't have one already
        await apiClient.authorize(config.auth.clientId, config.auth.clientSecret);

        // The API expects sender and recipient as an identifier string, separated by a colon. The naming
        // is slightly confusing here: Why would you map sender to sender? That's due to the fact that the
        // webhook reports the message sender - the user that sent the message - and we're going to respond
        // to them, making us the sender again.
        const identifier = `${ config.senderId }:${ req.body.sender }`;

        // We let the bot handle the message and return the whole payload object. That gives us the
        // opportunity to have a simple handler class with the full power of message objects.
        const payload = await bot.handle(req.body);

        // Send the message to the API
        await apiClient.sendMessage({
          identifier,
          payload,
        });
      } catch ( error ) {
        console.error(`[${ new Date }] [ERROR] ${ error.message }`);

        // We'll report this error back to the webhook emitter, so it will get logged and may be reviewed
        // from the dashboard. Since nobody except the MessengerPeople servers will reach this point, we
        // can be verbose here: Anything that might help us later in debugging the issue should be printed.
        return res
          .status(500)
          .json({
            error: error.message,
          });
      }

      // Everything is fine, so we're just reporting that and finish the request.
      return res.status(204);
    });
  };
};
