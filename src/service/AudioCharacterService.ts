import { v4 as uuidv4 } from 'uuid';

export interface AudioCharacterRecord {
  id?: string;
  code?: number;
  name?: string;
  voice_id?: string;
  expire_time?: string;
  token?: string;
  gender_id?: number;
  language_id?: number;
  state?: string;
  app_key?: string;
  access_key_secret?: string;
  access_key_id?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  configType?: number;
  hsKeyid?: string;
  hsAccessKey?: string;
  version?: number;
  image_url?: string;
  audio_url?: string;
}

class AudioCharacterService {
  tableName = 'audio_character_config';

  async create(data: AudioCharacterRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, code, name, voice_id, expire_time, token,
      gender_id, language_id, state, app_key, access_key_secret,
      access_key_id, create_date, creator, updater, update_date,
      configType, hsKeyid, hsAccessKey, version, image_url, audio_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.code || 0,
      data.name,
      data.voice_id,
      data.expire_time,
      data.token,
      data.gender_id,
      data.language_id,
      data.state || 'normal',
      data.app_key,
      data.access_key_secret,
      data.access_key_id,
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.configType || 1,
      data.hsKeyid,
      data.hsAccessKey,
      data.version || 1,
      data.image_url,
      data.audio_url
    ]);

    return id;
  }

  async update(id: string, data: Partial<AudioCharacterRecord>): Promise<void> {
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

  async get(id: string): Promise<AudioCharacterRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND state = 'normal'`;
    const result = await window.$mapi.db.execute(sql, [id]);
    if (!result || !Array.isArray(result)) {
      return null;
    }
    return result[0] || null;
  }

  async list(): Promise<AudioCharacterRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    const result = await window.$mapi.db.execute(sql);
    if (!result || !Array.isArray(result)) {
      return [];
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET state = ?, update_date = ? WHERE id = ?`;
    await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
  }
}

export default new AudioCharacterService(); 