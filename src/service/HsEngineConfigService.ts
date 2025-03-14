import { v4 as uuidv4 } from 'uuid';

export interface HsEngineConfig {
  id?: string;
  account?: string;
  app_key?: string;
  access_key_secret?: string;
  access_key_id?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  configType?: number;
  hsKeyid?: string;
  hsAccessKey?: string;
}

class HsEngineConfigService {
  tableName = 'hs_engine_config';

  // 初始化表
  async initTable(): Promise<void> {
    await window.$mapi.db.execute(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(255) PRIMARY KEY,
        account VARCHAR(255),
        app_key VARCHAR(255),
        access_key_secret VARCHAR(255),
        access_key_id VARCHAR(255),
        state VARCHAR(50),
        create_date TIMESTAMP,
        creator VARCHAR(255),
        updater VARCHAR(255),
        update_date TIMESTAMP,
        configType INTEGER,
        hsKeyid VARCHAR(255),
        hsAccessKey VARCHAR(255)
      )
    `);
  }

  // 创建配置
  async create(config: HsEngineConfig): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    // 如果没有提供 access_key_id，则使用 access_key_secret 的值
    const access_key_id = config.access_key_id || config.access_key_secret;

    const sql = `INSERT INTO ${this.tableName} (
      id, account, app_key, access_key_secret, access_key_id, 
      state, create_date, creator, updater, update_date, 
      configType, hsKeyid, hsAccessKey
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      config.account,
      config.app_key,
      config.access_key_secret,
      access_key_id,
      config.state || 'normal',
      now,
      config.creator || 'system',
      config.updater || 'system',
      now,
      config.configType || 1,
      config.hsKeyid,
      config.hsAccessKey,
    ]);

    return id;
  }

  // 更新配置
  async update(id: string, config: Partial<HsEngineConfig>): Promise<void> {
    const sets: string[] = [];
    const params: any[] = [];

    // 如果更新了 access_key_secret，同时也更新 access_key_id
    if (config.access_key_secret !== undefined) {
      config.access_key_id = config.access_key_secret;
    }

    Object.entries(config).forEach(([key, value]) => {
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

  // 获取配置
  async get(id: string): Promise<HsEngineConfig | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return await window.$mapi.db.first(sql, [id]);
  }

  // 获取所有配置
  async list(): Promise<HsEngineConfig[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`;
    return await window.$mapi.db.select(sql);
  }

  // 删除配置
  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await window.$mapi.db.execute(sql, [id]);
  }

  // 获取默认配置
  async getDefault(): Promise<HsEngineConfig | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE state = ? LIMIT 1`;
    return await window.$mapi.db.first(sql, ['normal']);
  }
}

export default new HsEngineConfigService();
