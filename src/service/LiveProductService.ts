import { TimeUtil } from '../lib/util';
import { v4 as uuidv4 } from 'uuid';

export type LiveProductRecord = {
  id?: string;
  live_id: string;
  product_id: string;
  ording: number;
  state: string;
  create_date?: string;
  creator: string;
  updater: string;
  update_date?: string;
  script_index: number;
  product_name?: string;
  product_backroud?: string;
  product_describe?: string;
};

export const LiveProductService = {
  tableName() {
    return 'live_product';
  },

  decodeRecord(record: LiveProductRecord): LiveProductRecord | null {
    if (!record) {
      return null;
    }
    return {
      ...record,
      product_name: record.product_name,
      product_backroud: record.product_backroud,
      product_describe: record.product_describe,
    } as LiveProductRecord;
  },

  async get(id: string): Promise<LiveProductRecord | null> {
    const record: any = await window.$mapi.db.first(
      `SELECT * FROM ${this.tableName()} WHERE id = ?`,
      [id]
    );
    return this.decodeRecord(record);
  },

  async list(): Promise<LiveProductRecord[]> {
    const records: LiveProductRecord[] = await window.$mapi.db.select(
      `SELECT * FROM ${this.tableName()} ORDER BY create_date DESC`
    );
    return records.map(this.decodeRecord) as LiveProductRecord[];
  },

  async listByLiveId(liveId: string): Promise<LiveProductRecord[]> {
    const records: any[] = await window.$mapi.db.select(
      `SELECT lp.id, lp.live_id, lp.product_id, lp.ording, lp.state, 
                    lp.create_date, lp.creator, lp.updater, lp.update_date, 
                    lp.script_index, p.product_name, p.product_backroud, p.product_describe 
             FROM ${this.tableName()} lp
             LEFT JOIN product p ON lp.product_id = p.id
             WHERE lp.live_id = ? AND p.is_delete = 0
             ORDER BY lp.ording ASC`,
      [liveId]
    );
    return records.map(this.decodeRecord) as LiveProductRecord[];
  },

  async create(record: LiveProductRecord) {
    const now = TimeUtil.timestampMS();
    record.id = uuidv4();
    record.create_date = new Date(now).toISOString();
    record.update_date = new Date(now).toISOString();

    const fields = [
      'id',
      'live_id',
      'product_id',
      'ording',
      'state',
      'create_date',
      'creator',
      'updater',
      'update_date',
      'script_index',
    ];
    const values = fields.map(f => record[f]);
    const valuesPlaceholder = fields.map(f => '?');

    return await window.$mapi.db.insert(
      `INSERT INTO ${this.tableName()} (${fields.join(',')})
             VALUES (${valuesPlaceholder.join(',')})`,
      values
    );
  },

  async update(id: string, record: Partial<LiveProductRecord>) {
    record.update_date = new Date(TimeUtil.timestampMS()).toISOString();

    const fields = Object.keys(record);
    const values = fields.map(f => record[f]);
    const set = fields.map(f => `${f} = ?`).join(',');

    return await window.$mapi.db.update(`UPDATE ${this.tableName()} SET ${set} WHERE id = ?`, [
      ...values,
      id,
    ]);
  },

  async delete(record: LiveProductRecord) {
    if (!record.id) throw new Error('Record ID is required');
    return await window.$mapi.db.delete(`DELETE FROM ${this.tableName()} WHERE id = ?`, [
      record.id,
    ]);
  },

  // 更新排序
  async updateOrding(id: string, ording: number) {
    return await this.update(id, { ording });
  },

  // 更新状态
  async updateState(id: string, state: string) {
    return await this.update(id, { state });
  },

  // 更新脚本索引
  async updateScriptIndex(id: string, scriptIndex: number) {
    return await this.update(id, { script_index: scriptIndex });
  },

  // 批量创建
  async batchCreate(records: LiveProductRecord[]) {
    const now = TimeUtil.timestampMS();
    const fields = [
      'id',
      'live_id',
      'product_id',
      'ording',
      'state',
      'create_date',
      'creator',
      'updater',
      'update_date',
      'script_index',
    ];
    const valuesPlaceholder = fields.map(f => '?').join(',');

    const sql = `INSERT INTO ${this.tableName()} (${fields.join(',')})
                    VALUES (${valuesPlaceholder})`;

    for (const record of records) {
      record.id = uuidv4();
      record.create_date = new Date(now).toISOString();
      record.update_date = new Date(now).toISOString();

      const values = fields.map(f => record[f]);
      await window.$mapi.db.insert(sql, values);
    }
  },

  // 批量删除
  async batchDelete(ids: string[]) {
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    return await window.$mapi.db.delete(
      `DELETE FROM ${this.tableName()} WHERE id IN (${placeholders})`,
      ids
    );
  },
};

export default LiveProductService;
