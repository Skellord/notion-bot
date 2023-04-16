import { config } from 'dotenv';
import { Telegraf } from 'telegraf';
import { Client } from '@notionhq/client';
import NotionConnector from './notion';

// initialization
config();
const taskDB = process.env.TASK_DB;
const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN as string);
const notionCLient = new Client({ auth: process.env.NOTION_API_TOKEN });
const notion = new NotionConnector(notionCLient, taskDB as string);


// app
bot.start((ctx) => ctx.reply(`Привет, ${ctx.message.from}!`));

bot.on('message', async function (ctx) {
  if (!(ctx.message && 'text' in ctx.message)) {
    await ctx.reply('Сообщение может быть только текстовым!');
    return;
  }

  const createTaskResult = await notion.createTask(ctx.message.text, ctx.message.from.username);
  const createdTaskMessage = 'Новая задача - [' + ctx.message.text + '](https://www.notion.so/' + notion.convertTaskToUrl(createTaskResult) + ')';

  await ctx.reply(createdTaskMessage);
});

bot.launch();
