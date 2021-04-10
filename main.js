const { WebClient } = require('@slack/web-api');
const { execSync } = require('child_process');
const { title } = require('process');

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

// An access token (from your Slack app or custom integration - xoxp, xoxb)
const token = process.env.SAD_SLACK_TOKEN;

const web = new WebClient(token);

// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = process.env.SAD_SLACK_CONVERSATION_ID;


(async () => {
  const papers = await execSync('scholar-alert-digest -l "google-scholar" -json -authors -refs -mark');

  let contents = [];
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

    let content = [
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
      {
        "type": "divider"
      }
    ]

    let attachment = {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": paper["Abstract"]["FirstLine"] + " " + paper["Abstract"]["Rest"]
          }
        },
      ]
    };

    contents.push(content);
    attachments.push(attachment);
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

  let title_message = await web.chat.postMessage({
    channel: conversationId,
    blocks: alertInfo,
  });
  console.log('Message sent: ', title_message.ts);

  for (let i = 0; i < attachments.length; i++) {
    let paper_message = await web.chat.postMessage({
      channel: conversationId,
      thread_ts: title_message.ts,
      blocks: contents[i],
      attachments: [attachments[i]],
    });
    
    console.log('Message sent: ', paper_message.ts);
    await sleep(700);
    if (!paper_message.ok) break;
  }
})();