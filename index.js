require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
  token: process.env.OAUTH_TOKEN,
  appToken: process.env.BOT_TOKEN,
  socketMode: true
});

async function ai_request(text) {
  const response = await fetch('https://ai.megallm.io/v1/chat/completions', {
    method: 'POST',
    headers: {
      'x-api-key' : process.env.RANDOM_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "model" : "gemini-2.5-pro",
      "messages": [
        {
          "role": "user",
          "content": text
        }
      ]
    })
  });

  var data = await response.text();
  const result = JSON.parse(data);
  var final = result.choices[0].message.content;
  return final;
}


// Ping Command
app.command("/ping-sigmabot", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});


// Help Command
app.command("/help-sigmabot", async ({ command, ack, respond }) => {
  await ack();
  await respond({ text: "Available commands:\n/ping-sigmabot - Check bot latency\n/help-sigmabot - List available commands" });
});


// Cat Fact Command
app.command("/catfact-sigmabot", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});


// Joke Command
app.command("/joke-sigmabot", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});


// Weather Data Command
app.command("/weather-sigmabot", async ({command, ack, respond}) => {
  await ack();
  await respond({ text: "Fetching weather data for provided city..." });
  try {
    const city = command.text.trim();
    const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: city
      }
    });
    const message = await ai_request(`Summarize the weather data for ${city}. Here is the data: ${JSON.stringify(response.data)}\nDo not use any form of markdown in your response, just plain text. Keep it structured and neat though.`);
    await respond({ text: `Weather Data for ${city}:\n${message}` });
  } 
  
  catch (err) {
    await respond({ text: "Failed to fetch weather data." });
    await respond({ text: `Error: ${err.message}` });
  }
});


// AI Review Command
app.command("/ai-review-sigmabot", async ({ command, ack, respond }) => {
  await ack();

  await respond({ text: "Generating Review..."});

  try {
    const review = await ai_request(`Write a detailed review for the following product: ${command.text}\nMake sure to include both pros and cons in the review. Do not use any form of markdown in your response, just plain text. Keep it structured and neat though.`);
    await respond({ text: `AI Review:\n${review}` });
  
  } catch (err) {
    await respond({ text: "Failed to generate AI review." });
  }
});


// AI search command
app.command("/ai-search-sigmabot", async ({ command, ack, respond }) => {
  await ack();

  await respond({ text: "Performing AI Search..."});

  try {
    const search = await ai_request(`Perform a web search for the following query: ${command.text}\nSummarize the most relevant information you find in a concise manner. Do not use any form of markdown in your response, just plain text. Keep it structured and neat though.`);
    await respond({ text: `AI Search Result:\n${search}` });
  }

  catch (err) {
    await respond({ text: "Failed to perform AI search." });
  }

});


// Reminder Command
app.command("/remind-sigmabot", async ({ command, ack, respond }) => {
  await ack();
  
  // Had to define this coz it was giving an error :Wilted_Rose: and idk how to make it global
  let reminderText;

  try{
    const duration = command.text.split(" ")[0];
    reminderText = command.text.split(" ").slice(1).join(" ");

    var [d, h, m, s] = duration.split(":").map(Number);
    
    m += Math.floor(s / 60);
    s = s % 60;

    h += Math.floor(m / 60);
    m = m % 60;

    d += Math.floor(h / 24);
    h = h % 24;
  }
  catch (err) {
    await respond({ text: "Invalid duration format. Please use 'D : H : M : S <reminder_text>' format.\nError:\n" + err.message });
    return;
  }
  
  await app.client.chat.postMessage({ 
    channel: command.user_id,
    text: `Okay! I will remind you to "${reminderText}" in ${d} days, ${h} hours, ${m} minutes, and ${s} seconds.` 
    
  });


  // I originally wanted the bot to dm the reminder to the user, but the bots doesnt have the perms :/
  setTimeout(async () => {
    await respond({
      text: `<@${command.user_id}>\nReminder: ${reminderText}`
    });
    }, (d * 24 * 60 * 60 + h * 60 * 60 + m * 60 + s) * 1000);

});
// Runs the bot
(async () => {
  await app.start();
  console.log("bot is running!");
})();