import { v4 as uuidv4 } from 'uuid';

export interface RegularInteractionConfigRecord {
  id?: string;
  live_id?: string;
  enable?: number;
  run_mode?: number;
  interval_time?: number;
  reply_way?: number;
  guide_all_chance?: number;
  guide_follow_chance?: number;
  guide_cost_chance?: number;
  guide_share_chance?: number;
  guide_all_contents?: string;
  guide_follow_contents?: string;
  guide_cost_contents?: string;
  guide_share_contents?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  platform?: string;
}

class RegularInteractionConfigService {
  tableName = 'regular_interaction_config';

  async create(data: RegularInteractionConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, enable, run_mode, interval_time,
      reply_way, guide_all_chance, guide_follow_chance,
      guide_cost_chance, guide_share_chance,
      guide_all_contents, guide_follow_contents,
      guide_cost_contents, guide_share_contents,
      state, create_date, creator, updater, update_date, platform
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.enable || 1,
      data.run_mode || 0,
      data.interval_time || 0,
      data.reply_way || 1,
      data.guide_all_chance || 0,
      data.guide_follow_chance || 0,
      data.guide_cost_chance || 0,
      data.guide_share_chance || 0,
      data.guide_all_contents || '',
      data.guide_follow_contents || '',
      data.guide_cost_contents || '',
      data.guide_share_contents || '',
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.platform,
    ]);

    return id;
  }

  async update(id: string, data: Partial<RegularInteractionConfigRecord>): Promise<void> {
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

  async get(id: string): Promise<RegularInteractionConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  async getByLiveId(liveId: string): Promise<RegularInteractionConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async list(): Promise<RegularInteractionConfigRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }
}

export default new RegularInteractionConfigService();
