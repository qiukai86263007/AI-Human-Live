import { v4 as uuidv4 } from 'uuid';

export interface QAndAConfigRecord {
  id?: string;
  live_id?: string;
  enable?: number;
  reply_way?: number;
  appoint_within_do_not_reply?: number;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
}

class QAndAConfigService {
  tableName = 'q_and_a_config';

  async create(data: QAndAConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, enable, reply_way, appoint_within_do_not_reply,
      state, create_date, creator, updater, update_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.enable || 1,
      data.reply_way || 1,
      data.appoint_within_do_not_reply || 0,
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now
    ]);

    return id;
  }

  async update(id: string, data: Partial<QAndAConfigRecord>): Promise<void> {
    const sets: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        sets.push(`${key} = ?`);
        params.push(value);
      }
    });
    
    if (sets.length === 0) return;
    
    sets.push('update_date = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `UPDATE ${this.tableName} SET ${sets.join(', ')} WHERE id = ?`;
    await window.$mapi.db.execute(sql, params);
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await window.$mapi.db.execute(sql, [id]);
  }

  async get(id: string): Promise<QAndAConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  async getByLiveId(liveId: string): Promise<QAndAConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async list(): Promise<QAndAConfigRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }

  async toggleEnable(id: string, enable: boolean): Promise<void> {
    const sql = `UPDATE ${this.tableName} 
                SET enable = ?, updater = ?, update_date = ?
                WHERE id = ?`;
    await window.$mapi.db.execute(sql, [
      enable ? 1 : 0,
      'system',
      new Date().toISOString(),
      id
    ]);
  }

  async updateReplyWay(id: string, replyWay: number): Promise<void> {
    const sql = `UPDATE ${this.tableName} 
                SET reply_way = ?, updater = ?, update_date = ?
                WHERE id = ?`;
    await window.$mapi.db.execute(sql, [
      replyWay,
      'system',
      new Date().toISOString(),
      id
    ]);
  }
}

export default new QAndAConfigService(); 