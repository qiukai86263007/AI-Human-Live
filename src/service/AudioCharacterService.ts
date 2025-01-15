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

  // 初始化表
  async initTable(): Promise<void> {
    await window.$mapi.db.execute(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(255) PRIMARY KEY,
        code INTEGER,
        name VARCHAR(255),
        voice_id VARCHAR(255),
        expire_time TIMESTAMP,
        token VARCHAR(255),
        gender_id INTEGER,
        language_id INTEGER,
        state VARCHAR(50),
        app_key VARCHAR(255),
        access_key_secret VARCHAR(255),
        access_key_id VARCHAR(255),
        create_date TIMESTAMP,
        creator VARCHAR(255),
        updater VARCHAR(255),
        update_date TIMESTAMP,
        configType INTEGER,
        hsKeyid VARCHAR(255),
        hsAccessKey VARCHAR(255),
        version INTEGER,
        image_url VARCHAR(255),
        audio_url VARCHAR(255)
      )
    `);
  }

  // 创建记录
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
      data.updater || 'system',
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

  // 更新记录
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

  // 获取记录
  async get(id: string): Promise<AudioCharacterRecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  // 获取所有记录
  async list(): Promise<AudioCharacterRecord[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }

  // 删除记录
  async delete(id: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET state = 'deleted', update_date = ? WHERE id = ?`;
    await window.$mapi.db.execute(sql, [new Date().toISOString(), id]);
  }
}

export default new AudioCharacterService(); 