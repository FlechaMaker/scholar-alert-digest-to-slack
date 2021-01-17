const { WebClient } = require('@slack/web-api');
const { execSync } = require('child_process');

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

// An access token (from your Slack app or custom integration - xoxp, xoxb)
const token = process.env.SAD_SLACK_TOKEN;

const web = new WebClient(token);

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = process.env.SAD_SLACK_CONVERSATION_ID;


(async () => {
  const papers = await execSync('scholar-alert-digest -l "google-scholar" -json -authors -refs -mark');

  let attachments = [];
  papers.toString('utf-8').split(/[\n\r]/).forEach(paper => {
    try {
      paper = JSON.parse(paper);
    } catch (error) {
      console.error(`Unhandled paper: ${paper}`);
      console.error(error);
      return;
    }

    // Slack's header limit is 150 characters
    if (paper["Title"].length > 150 - 3) {
      paper["Title"] = paper["Title"].slice(0, 147) + "...";
    }

    let content = {
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": paper["Title"],
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": paper["Author"]
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `:link: ${paper["URL"]}`
            }
          ]
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": paper["Abstract"]["FirstLine"] + " " + paper["Abstract"]["Rest"]
          }
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `Count: ${paper["Freq"]}`
            },
            {
              "type": "plain_text",
              "text": `Source: ${paper["Refs"].map( e => e["Title"] ).join(', ')}`,
              "emoji": true
            }
          ]
        },
      ]
    };

    attachments.push(content);
  });
  // there is no paper
  if (attachments.length <= 0) {
    return;
  }

  let currentDate = new Date();
  let alertInfo = [
    {
      type: "header",
      text: {
        "type": "plain_text",
        "text": `New papers - ${currentDate.toDateString()}`,
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Uniq paper titles*: ${attachments.length}`
      }
    },
    {
      "type": "divider"
    },
  ];

  let res = await web.chat.postMessage({
    channel: conversationId,
    blocks: alertInfo,
  });
  console.log('Message sent: ', res.ts);

  for (let i = 0; i < attachments.length; i++) {
    res = await web.chat.postMessage({
      channel: conversationId,
      attachments: [attachments[i]],
    });
    
    console.log('Message sent: ', res.ts);
    await sleep(700);
    if (!res.ok) break;
  }
})();