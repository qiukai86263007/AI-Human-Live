import { v4 as uuidv4 } from 'uuid';

export interface GiftThankConfigRecord {
  id?: string;
  live_id?: string;
  enable?: number;
  reply_way?: number;
  thank_rule?: number;
  gift_money?: number;
  small_amount_money?: number;
  small_amount_thank_contents?: string;
  big_amount_thank_contents?: string;
  strengthen_thankcontents?: string;
  strengthen_thank_enable?: number;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  platform?: string;
}

class GiftThankConfigService {
  tableName = 'gift_thank_config';

  async create(data: GiftThankConfigRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, live_id, enable, reply_way, thank_rule,
      gift_money, small_amount_money, small_amount_thank_contents,
      big_amount_thank_contents, strengthen_thankcontents,
      strengthen_thank_enable, state, create_date,
      creator, updater, update_date, platform
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.live_id,
      data.enable || 1,
      data.reply_way || 1,
      data.thank_rule || 0,
      data.gift_money || 100,
      data.small_amount_money || 500,
      data.small_amount_thank_contents || '[]',
      data.big_amount_thank_contents || '[]',
      data.strengthen_thankcontents || '[]',
      data.strengthen_thank_enable || 1,
      data.state || 'normal',
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.platform,
    ]);

    return id;
  }

  async update(id: string, data: Partial<GiftThankConfigRecord>): Promise<void> {
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

  async getByLiveId(liveId: string): Promise<GiftThankConfigRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal'`;
    return await window.$mapi.db.first(sql, [liveId]);
  }
}

export default new GiftThankConfigService();
