import { config } from 'dotenv';
import { Client } from '@notionhq/client';
import TelegramBot from 'node-telegram-bot-api';
import NotionConnector from './notion';
import DatabaseConnector from './db';

// initialization
config();
const taskDB = process.env.TASK_DB as string;
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN as string, { polling: true });
const notionCLient = new Client({ auth: process.env.NOTION_API_TOKEN });
const notion = new NotionConnector(notionCLient, taskDB);
const db = new DatabaseConnector();
const allowTelegramIds = process.env.TELEGRAM_ALLOW_IDS?.split(',').map(e => Number(e));
console.log(allowTelegramIds);

// app
db.createUsersTable();

bot.setMyCommands([
  {
    command: '/start',
    description: 'Начало работы',
  },
  {
    command: '/check',
    description: 'Проверка доступа',
  },
  {
    command: '/add',
    description: 'Добавить id страницы',
  },
  {
    command: '/test',
    description: 'test',
  },
])

bot.on('message', async msg => {
  const text = msg.text;
  const chatId = msg.chat.id;

  if (text === '/start') {
    await bot.sendMessage(chatId, `Привет, ${msg.chat.username}!`);

    if (msg.from?.id) {
      if (allowTelegramIds?.includes(msg.from.id)) {
        await db.addUser(msg.from.id, true);
      } else {
        await db.addUser(msg.from.id, false);
      }
    }

    return;
  }

  if (text === '/check') {
    await bot.sendMessage(chatId, 'Проверяю, есть ли доступ...');

    if (msg.from?.id) {
      const permission = await db.checkPermission(msg.from.id);

      if (permission?.allow) {
        return bot.sendMessage(chatId, 'Поздравляю! У вас есть доступ! Осталось добавить ID страницы');
      } else {
        return bot.sendMessage(chatId, 'К сожалению у вас нет доступа =(');
      }
    } else {
      return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз')
    }
  }

  if (text === '/add') {
    const namePrompt = await bot.sendMessage(chatId, 'Введите id страницы:', { reply_markup: { force_reply: true } });

    return bot.onReplyToMessage(chatId, namePrompt.message_id, async newId => {
      if (!msg.from?.id) {
        return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
      } else {
        if (typeof newId.text !== 'string') {
          return bot.sendMessage(chatId, 'ID может быть только строкой!');
        } else {
          const result = await db.addPageId(msg.from.id, newId.text);
          console.log(result);

          return bot.sendMessage(chatId, `ID ${result} добавлено`);
        }
      }
    })
  }

  if (text === '/test') {
    await notion.createTask();
    return bot.sendMessage(chatId, 'test');
  }

  // return bot.sendMessage(chatId, 'Я тебя не понял =(. Попробуй еще раз.');
})

// bot.command('check', async ctx => {
//   if (ctx.from.username) {
//     ctx.reply(`Проверяем ${ctx.from.username}`);
//     await db.addUsername(ctx.from.username);
//   } else {
//     ctx.reply('Ошибка =(, ')
//   }
// });

// bot.on('message', async function (ctx) {
//   if (!(ctx.message && 'text' in ctx.message)) {
//     await ctx.reply('Сообщение может быть только текстовым!');
//     return;
//   }

//   const createTaskResult = await notion.createTask(ctx.message.text, ctx.message.from.username);
//   const createdTaskMessage = 'Новая задача - [' + ctx.message.text + '](https://www.notion.so/' + notion.convertTaskToUrl(createTaskResult) + ')';

//   await ctx.reply(createdTaskMessage);
// });
