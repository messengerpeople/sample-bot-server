'use strict';

// We'll use axios for HTTP requests here
const axios = require('axios');

/**
 * The default API URL. This value is hard-coded since only our engineers have access to
 * other API versions.
 *
 * @type {string}
 */
const DEFAULT_API_URL = 'https://api.messengerpeople.dev';

/**
 * The default authentication server URL. This value is hard-coded since only our engineers
 * have access to other API versions.
 *
 * @type {string}
 */
const DEFAULT_AUTH_URL = 'https://auth.messengerpeople.dev';

/**
 * The base scopes requested from the authentication server. This project only sends messages,
 * so that's probably going to be the only scope we need.
 *
 * @type {string[]}
 */
const BASE_SCOPES = [
  'messages:send',
];

/**
 * MessengerPeople API client
 * ==========================
 * This is a simplified version of the API client we are going to release later this year.
 * It will eventually be replaced by the actual client once its released on npm. Feel free
 * to inspect the code, however: It illustrates pretty well how authorization and API calls
 * work.
 */
class MessengerPeopleApiClient {
  /**
   * Create a new instance, optionally overriding the URLs the client connects to.
   *
   * @param {string} [apiUrl]   URL of the API server
   * @param {string} [authUrl]  URL of the OAuth server
   */
  constructor ( apiUrl = DEFAULT_API_URL, authUrl = DEFAULT_AUTH_URL ) {
    this._apiUrl  = apiUrl;
    this._authUrl = authUrl;

    // Create a simple axios instance with the base URL set
    this._httpClient = new axios.create({
      baseURL: apiUrl,
    });
  }

  /**
   * Obtains an access token by authorizing to the OAuth server
   *
   * @param   {string}        clientId      OAuth client ID
   * @param   {string}        clientSecret  OAuth client secret
   * @param   {string[]}      scopes        Optional list of additional scopes to request
   * @return  {Promise<void>}
   */
  async authorize ( clientId, clientSecret, scopes = [] ) {
    // If we already have an access token, we skip here
    if ( this._accessToken ) {
      return;
    }

    let response;

    try {
      // Request a token from the API
      response = await axios.post(`${ this._authUrl }/token`, {
        grant_type:    'client_credentials',
        scope:         BASE_SCOPES.concat(scopes),
        client_id:     clientId,
        client_secret: clientSecret,
      });
    } catch ( error ) {
      const message = MessengerPeopleApiClient._extractErrorMessage(error);
      throw new Error(`Failed to authorize: ${ message }`);
    }

    if ( !response.data.hasOwnProperty('access_token') ) {
      throw new Error('Authorization server returned an invalid response: Access token missing from response');
    }

    console.log(`[${ new Date }] [INFO] Authorized successfully`);

    this._accessToken = response.data.access_token;
  }

  /**
   * Performs a request, checking and adding authorization and required headers
   *
   * @param   {AxiosRequestConfig}    config  Request configuration
   * @return  {Promise<AxiosPromise>}         Response object
   */
  async request ( config ) {
    if ( !this._accessToken ) {
      throw new Error('Not authorized yet');
    }

    const mergedConfig = Object.assign({}, {
      headers: {
        'Authorization': `Bearer ${ this._accessToken }`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    }, config);

    let response;

    try {
      response = await this._httpClient(mergedConfig);
    } catch ( error ) {
      const message = MessengerPeopleApiClient._extractErrorMessage(error);

      throw new Error(`[API] ${ mergedConfig.url } failed: ${ message }`);
    }

    return response.data;
  }

  /**
   * Sends a message
   *
   * @param   {Object}                message
   * @return  {Promise<AxiosPromise>}
   */
  sendMessage ( message ) {
    return this.request({
      method: 'POST',
      url:    `${ this._apiUrl }/messages`,
      data:   message,
    });
  }

  /**
   * Extracts an error message from an Axios error. Since all our APIs _always_ return both
   * an error message and a hint containing details, we can check for these properties and
   * construct an error message from them.
   *
   * @param   {AxiosError} error
   * @return  {string}           Error message
   * @private
   */
  static _extractErrorMessage ( error ) {
    if ( !error.response || !error.response.data || !error.response.data.error ) {
      return error.message || 'Unknown error';
    }

    let message = `${ error.message }: ${ error.response.data.error }`;

    if ( error.response.data.hint ) {
      message += ` (${ error.response.data.hint })`;
    }

    return message;
  }
}

module.exports = MessengerPeopleApiClient;
