# scholar-alert-digest-to-slack

Post google scholar alert digest (https://github.com/bzz/scholar-alert-digest) to slack

## Requirements

* [yarn](https://yarnpkg.com)
* [node](https://nodejs.org/)
* [scholar-alert-digest](https://github.com/bzz/scholar-alert-digest)

## Configuration

Set Slack's [Bot User OAuth Access Token](https://api.slack.com/authentication/token-types#bot) and [conversation ID](https://api.slack.com/docs/conversations-api) of the channel where alert will be posted as environment variables.

```
export SAD_SLACK_TOKEN=xoxb-0000000000-0000000000000-000000000000000000000000
export SAD_SLACK_CONVERSATION_ID=C0000000000
```

Configure scholar-alert-digest as described in [its repository](https://github.com/bzz/scholar-alert-digest). Because Gmail API token cannot be configured when scholar-alert-digest called inside main.js, you need to run scholar-alert-digest once before run main.js.

## Usage

```
node main.js
```
