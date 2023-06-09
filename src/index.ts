import { config } from 'dotenv';
import { Client } from '@notionhq/client';
import TelegramBot from 'node-telegram-bot-api';
import NotionConnector from './notion';
import DatabaseConnector from './db';
import express from 'express';

// initialization
config();
const port = process.env.PORT ?? 8080;
const app = express();
const bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN as string, { polling: true });
// const notionClient = new Client({ auth: process.env.NOTION_API_TOKEN });
// const notion = new NotionConnector(notionClient);
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
    description: 'Добавить ID страницы',
  },
  {
    command: '/page',
    description: 'Проверить ID страницы',
  },
  {
    command: '/add_db',
    description: 'Добавить ID таблицы',
  },
  {
    command: '/db',
    description: 'Проверить ID таблицы',
  },
  {
    command: '/add_token',
    description: 'Добавить notion токен',
  }
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
          console.log(newId.text);
          const result = await db.addPageId(msg.from.id, newId.text);

          if (result) {
            return bot.sendMessage(chatId, 'ID добавлено');
          } else {
            return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
          }
        }
      }
    })
  }

  if (text === '/page') {
    if (msg.from?.id) {
      const pageIdResult = await db.getPageId(msg.from.id);

      return bot.sendMessage(chatId, `ID страницы - ${pageIdResult?.page_id}`);
    } else {
      return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
    }
  }

  if (text === '/add_db') {
    const namePrompt = await bot.sendMessage(chatId, 'Введите id таблицы:', { reply_markup: { force_reply: true } });

    return bot.onReplyToMessage(chatId, namePrompt.message_id, async newId => {
      if (!msg.from?.id) {
        return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
      } else {
        if (typeof newId.text !== 'string') {
          return bot.sendMessage(chatId, 'ID может быть только строкой!');
        } else {
          console.log(newId.text);
          const result = await db.addDBId(msg.from.id, newId.text);

          if (result) {
            return bot.sendMessage(chatId, 'ID добавлено');
          } else {
            return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
          }
        }
      }
    })
  }

  if (text === '/db') {
    if (msg.from?.id) {
      const dbIdResult = await db.getDBId(msg.from.id);

      return bot.sendMessage(chatId, `ID страницы - ${dbIdResult?.db_id}`);
    } else {
      return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
    }
  }

  if (text === '/add_token') {
    const namePrompt = await bot.sendMessage(chatId, 'Введите notion токен:', { reply_markup: { force_reply: true } });

    return bot.onReplyToMessage(chatId, namePrompt.message_id, async newId => {
      if (!msg.from?.id) {
        return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
      } else {
        if (typeof newId.text !== 'string') {
          return bot.sendMessage(chatId, 'Токен может быть только строкой!');
        } else {
          console.log(newId.text);
          const result = await db.addConnectionToken(msg.from.id, newId.text);
          console.log(result);

          if (result) {
            return bot.sendMessage(chatId, 'Токен добавлен');
          } else {
            return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
          }
        }
      }
    })
  }

  if (msg.from?.id && msg.text) {
    try {
      // const pageIdResult = await db.getPageId(msg.from.id);
      const dbIdResult = await db.getDBId(msg.from.id);
      const connectionToken = await db.getConnectionToken(msg.from.id);
      const notionClient = new Client({ auth: connectionToken?.token });
      const notion = new NotionConnector(notionClient);

      if (dbIdResult?.db_id) {
        const taskResult = await notion.createDatabaseTask(dbIdResult.db_id, msg.text);

        if (taskResult) {
          return bot.sendMessage(chatId, 'Задача добавлена ✅');
        } else {
          return bot.sendMessage(chatId, 'Ошибка! Попробуйте еще раз');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return bot.sendMessage(chatId, 'Я тебя не понял =(. Попробуй еще раз.');
})

app.listen(port, () => {
  console.log(`Server start on ${port}`);
});
