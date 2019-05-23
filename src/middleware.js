'use strict';

const express = require('express');

/**
 * Middleware setup function
 * =========================
 * This function takes the configuration object and returns a middleware setup callback. It
 * will be passed the express server to register the middlewares.
 *
 * @param  {Object}                       config  Configuration data
 * @return {function(app: Express): void}         Route function
 */
module.exports = function ( config = {} ) {

  /**
   * Loads all middlewares
   *
   * @param {Express} app
   */
  return function ( app ) {
    /**
     * JSON request body parser
     * ========================
     * The MessengerPeople API exclusively sends and accepts JSON bodies.
     */
    app.use(express.json());

    /**
     * Request logger middleware
     * =========================
     * We don't need anything fancy here, a simple request logger is completely okay here
     */
    app.use('/', ( request, response, next ) => {
      console.log(`[${ new Date }] ${ request.ip || '-' }\t${ request.method } ${ request.path }`);

      return next();
    });
  };
};
