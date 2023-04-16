import { Client } from "@notionhq/client";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";

export default class NotionConnector {
  notion: Client;
  taskDB: string;

  constructor(notion: Client, taskDB: string) {
    this.notion = notion;
    this.taskDB = taskDB;
  }

  async createTask(title?: string, tgAuthor?: string) {
    const blockId = '636e77292d78463495494163f9e09576';

    return await this.notion.blocks.children.append({
      block_id: blockId,
      children: [
        {
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'title'
                }
              }
            ]
          }
        }
      ]
    })
  }

  convertTaskToUrl(task: CreatePageResponse) {
    return task.id.replace(/-/g, '');
  }
};
