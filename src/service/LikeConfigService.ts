import { v4 as uuidv4 } from 'uuid';

export interface LikeConfigRecord {
  id?: string;
  live_id?: string;
  enable?: number;
  reply_way?: number;
  like_parameters?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  platform?: string;
}

class LikeConfigService {
  tableName = 'like_config';

  async create(data: LikeConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, enable, reply_way,
      like_parameters, state,
      create_date, creator, updater,
      update_date, platform
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.enable || 1,
      data.reply_way || 1,
      data.like_parameters || '',
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.platform
    ]);

    return id;
  }

  async update(id: string, data: Partial<LikeConfigRecord>): Promise<void> {
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

  async get(id: string): Promise<LikeConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  async getByLiveId(liveId: string): Promise<LikeConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async list(): Promise<LikeConfigRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }
}

export default new LikeConfigService(); 