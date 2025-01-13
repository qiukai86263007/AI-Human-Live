import { v4 as uuidv4 } from 'uuid';

export interface LiveParameterRecord {
  id?: string;
  live_id?: string;
  product_play_rule?: string;
  scene_play_rule?: string;
  script_play_rule?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  isgeneralization?: string;
  platform?: string;
  rule_list?: string;
  live_room_id?: string;
  anchor_name?: string;
}

class LiveParameterService {
  tableName = 'live_parameter';

  async create(data: LiveParameterRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, product_play_rule, scene_play_rule,
      script_play_rule, state, create_date, creator,
      updater, update_date, isgeneralization, platform,
      rule_list, live_room_id, anchor_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.product_play_rule,
      data.scene_play_rule,
      data.script_play_rule,
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.isgeneralization,
      data.platform,
      data.rule_list,
      data.live_room_id,
      data.anchor_name
    ]);

    return id;
  }

  async update(id: string, data: Partial<LiveParameterRecord>): Promise<void> {
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

  async getByLiveId(liveId: string): Promise<LiveParameterRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }

  async delete(id: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET state = ?, update_date = ? WHERE id = ?`;
    await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
  }
}

export default new LiveParameterService(); 