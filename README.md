Sample bot server
=================
This project provides a sample server, acting as a chat bot.

Installation
------------
Clone the repository:
```bash
git clone https://github.com/messengerpeople/sample-bot-server
cd sample-bot-server
```

Install the dependencies from npm:
```bash
npm install
```

Usage
-----
To run the server, simply execute the `index.js` file:
```bash
node .
```

This should yield the following output:
```
msgppl $ node .
Bot listening for messages on localhost:3000
```

Configuration
-------------
The project contains a simple `config.json` file holding some settings you may play around with:

| Setting               | Description                                                                   |
|:----------------------|:------------------------------------------------------------------------------|
| `host`                | The hostname to run the server on. `localhost` should suffice for testing.    |
| `port`                | The port to listen on. Defaults to `3000`.                                    |
| `verificationToken`   | The webhook verification token.                                               |
| `secret`              | The webhook secret for secured webhooks.                                      |
| `auth.clientId`       | The OAuth client ID obtained from the dashboard.                              |
| `auth.clientSecret`   | The OAuth client secret obtained from the dashboard.                          |
