import { v4 as uuidv4 } from 'uuid';

export interface PlatformConfigRecord {
  id?: string;
  live_id?: string;
  platform?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
}

class PlatformConfigService {
  tableName = 'platform_config';

  async create(data: PlatformConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, platform, state,
      create_date, creator, updater, update_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.platform,
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
    ]);

    return id;
  }

  async update(id: string, data: Partial<PlatformConfigRecord>): Promise<void> {
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

  async getByLiveId(liveId: string): Promise<PlatformConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async delete(id: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET state = ?, update_date = ? WHERE id = ?`;
    await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
  }
}

export default new PlatformConfigService();
