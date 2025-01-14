import { v4 as uuidv4 } from 'uuid';

export interface AudioCharacterRecord {
  id?: string;
  name?: string;
  gender_id?: number;
  language_id?: number;
  state?: string;
  audio_text?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  configType?: number;
  version?: number;
  image_url?: string;
  audio_url?: string;
}

class AudioCharacterService {
  tableName = 'audio_character';

  async create(data: AudioCharacterRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, name, gender_id, language_id, state,
      audio_text, create_date, creator, updater,
      update_date, configType, version, image_url, audio_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      data.name,
      data.gender_id,
      data.language_id,
      data.state || 'normal',
      data.audio_text,
      now,
      data.creator || 'system',
      data.creator || 'system',
      now,
      data.configType,
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
    return await window.$mapi.db.first(sql, [id]);
  }

  async list(): Promise<AudioCharacterRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }

  async delete(id: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET state = ?, update_date = ? WHERE id = ?`;
    await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
  }
}

export default new AudioCharacterService(); 