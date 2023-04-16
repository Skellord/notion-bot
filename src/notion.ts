import { Client } from "@notionhq/client";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

export default class NotionConnector {
  notion: Client;
  taskDB: string;

  constructor(notion: Client, taskDB: string) {
    this.notion = notion;
    this.taskDB = taskDB;
  }

  async createTask(title: string, tgAuthor?: string) {
    return await this.notion.pages.create({
      parent: {
        database_id: this.taskDB
      },
      properties: {
        Name: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: title
              }
            }
          ]
        },
        TGAuthor: {
          type: "rich_text",
          rich_text: [
            {
              type: "text",
              text: {
                content: tgAuthor ?? 'Anonymous'
              }
            }
          ]
        },
      }

    });
  }

  convertTaskToUrl(task: CreatePageResponse) {
    return task.id.replace(/-/g, '');
  }
};
