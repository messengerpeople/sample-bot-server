'use strict';

class Bot {
  constructor ( config ) {
    // This bot doesn't require configuration yet
  }

  // noinspection JSMethodCanBeStatic
  async handle ( message ) {
    switch ( message.payload.text.toLowerCase() ) {
      case 'hi':
      case 'hello':
      case 'hey':
        return {
          text: 'Hey there, bot user!',
        };

      case 'help':
      case 'info':
      case 'about':
        return {
          text: 'This is a sample bot, demonstrating the MessengerPeople API. Try to _ping_ it, or ask it to _repeat_ you.',
        };

      case 'ping':
        return {
          text: 'pong',
        };

      case 'repeat':
        return {
          text: 'You said:\n' + message.payload.text.replace(/repeat:?\s+/i, ''),
        };

      case 'space':

    }
  }
}

module.exports = Bot;
