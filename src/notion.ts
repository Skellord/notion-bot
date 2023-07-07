import { Client } from "@notionhq/client";

export default class NotionConnector {
  notion: Client;

  constructor(notion: Client) {
    this.notion = notion;
  }

  async createTask(blockId: string, text: string) {
    try {
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
                    content: text,
                  }
                }
              ]
            }
          }
        ]
      })
    } catch (err) {
      console.error(err);
    }
  }

  async createDatabaseTask(dbId: string, text: string) {
    try {
      return await this.notion.pages.create({
        parent: {
          database_id: dbId,
        },
        properties: {
          Task: {
            type: 'title',
            title: [{
              type: 'text',
              text: {
                content: text
              }
            }]
          },
          Inbox: {
            type: 'status',
            status: {
              name: 'Backlog',
              color: 'default',
            }
          }
        }
      })
    } catch (err) {
      console.error(err);
    }
  }
};
