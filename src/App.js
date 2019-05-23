'use strict';

const express = require('express');

/**
 * Application
 * ===========
 * This class provides a very simple wrapper around the express server,
 * mostly concerned with error handling and applying middleware and routes.
 *
 * @property {Express} _server
 */
class App {

  /**
   * Creates a new application instance and configures middleware and routes.
   *
   * @param {function(server: Express): void} [routes]
   * @param {function(server: Express): void} [middleware]
   */
  constructor ( routes = () => {}, middleware = () => {} ) {
    this._server = express();

    middleware(this._server);
    routes(this._server);
  }

  /**
   * Lets the application listen
   *
   * @param {number} port   Port to listen on
   * @param {string} [host] Host to listen on. Defaults to localhost
   */
  listen ( port, host = '127.0.0.1' ) {
    // Bring the application down on errors
    this._server.on('error', error => this._stop(error));

    try {
      // Let express listen on the designated host and port
      this._server.listen(
        port,
        host,
        () => console.log(`Bot listening for messages on ${ host }:${ port }`),
      );
    } catch ( error ) {
      // Bring down the application on fatal startup errors
      this._stop(error);
    }
  }

  /**
   * Stop the server and kill the process
   *
   * @param {Application|Error} error
   * @private
   */
  _stop ( error ) {
    this._server.close && this._server.close();
    console.error(`Fatal error: ${ error.message }\n`);
    process.exit(1);
  }
}

module.exports = App;
