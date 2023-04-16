import { Knex, knex } from 'knex'

const USERS = 'users';

interface User {
  id: number;
  user_id: number;
  allow: boolean;
  page_id?: string;
}

export default class DatabaseConnector {
  db: Knex;

  constructor() {
    this.db = this._open();
  }

  _open() {
    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
      },

      useNullAsDefault: true,
    });

    return db;
  }

  async createUsersTable() {
    try {
      await this.db.schema.createTable(USERS, table => {
        table.increments('id');
        table.integer('user_id');
        table.boolean('allow');
        table.string('page_id')
      })
    } catch (err) {
      console.error(err);
    }
  }

  async addUser(id: number, allow: boolean) {
    try {
      await this.db<User>(USERS).insert({ user_id: id, allow });
    } catch (err) {
      console.error(err);
    }
  }

  async checkPermission(userId: number) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).first('allow');
    } catch (err) {
      console.error(err);
    }
  }

  async addPageId(userId: number, pageId: string) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).insert({ page_id: pageId });
    } catch (err) {
      console.error(err);
    }
  }
};
