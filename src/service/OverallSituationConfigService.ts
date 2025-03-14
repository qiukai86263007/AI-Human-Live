import { v4 as uuidv4 } from 'uuid';

export interface OverallSituationConfigRecord {
  id?: string;
  live_id?: string;
  platform?: string;
  live_room_no?: string;
  operation_mode?: number;
  operation_time?: number;
  regular_interaction_priority?: number;
  ordinary_user_priority?: number;
  gift_thank_priority?: number;
  qanda_priority?: number;
  aiChat_priority?: number;
  globalnatural_language_switch?: number;
  globalanchor_nick?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
}

class OverallSituationConfigService {
  tableName = 'overall_situation_config';

  async create(data: OverallSituationConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, platform, live_room_no, operation_mode,
      operation_time, regular_interaction_priority, ordinary_user_priority,
      gift_thank_priority, qanda_priority, aiChat_priority,
      globalnatural_language_switch, globalanchor_nick,
      state, create_date, creator, updater, update_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.platform,
      data.live_room_no,
      data.operation_mode || 0,
      data.operation_time || 0,
      data.regular_interaction_priority || 0,
      data.ordinary_user_priority || 0,
      data.gift_thank_priority || 0,
      data.qanda_priority || 0,
      data.aiChat_priority || 0,
      data.globalnatural_language_switch || 0,
      data.globalanchor_nick,
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
    ]);

    return id;
  }

  async update(id: string, data: Partial<OverallSituationConfigRecord>): Promise<void> {
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

  async get(id: string): Promise<OverallSituationConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  async getByLiveId(liveId: string): Promise<OverallSituationConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async list(): Promise<OverallSituationConfigRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }
}

export default new OverallSituationConfigService();
