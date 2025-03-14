import { v4 as uuidv4 } from 'uuid';

export type ProductScriptRecord = {
  id?: string;
  script_type_id: string;
  product_id: string;
  text_content: string;
  audio_content: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
  gender: number;
  audio_url: string;
  script_index: number;
  video_duration: string;
  pay_url: string;
};

export const ProductScriptService = {
  tableName() {
    return 'product_script';
  },

  // 创建产品脚本
  async create(record: ProductScriptRecord): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await window.$mapi.db.execute(
      `INSERT INTO ${this.tableName()} (
                id, script_type_id, product_id, text_content,
                audio_content, state, create_date, creator,
                updater, update_date, gender, audio_url,
                script_index, video_duration, pay_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.script_type_id,
        record.product_id,
        record.text_content,
        record.audio_content,
        record.state || 'normal',
        now,
        record.creator || 'system',
        record.updater || 'system',
        now,
        record.gender,
        record.audio_url,
        record.script_index,
        record.video_duration,
        record.pay_url,
      ]
    );

    return id;
  },

  // 更新产品脚本
  async update(id: string, record: Partial<ProductScriptRecord>): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];

    Object.entries(record).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (sets.length === 0) return;

    sets.push('update_date = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await window.$mapi.db.execute(
      `UPDATE ${this.tableName()} SET ${sets.join(', ')} WHERE id = ?`,
      values
    );
  },

  // 删除产品脚本
  async delete(id: string): Promise<void> {
    await window.$mapi.db.execute(`DELETE FROM ${this.tableName()} WHERE id = ?`, [id]);
  },

  // 获取单个产品脚本
  async get(id: string): Promise<ProductScriptRecord | null> {
    const record = await window.$mapi.db.first(`SELECT * FROM ${this.tableName()} WHERE id = ?`, [
      id,
    ]);
    return record || null;
  },

  // 获取产品脚本列表
  async list(where: Partial<ProductScriptRecord> = {}): Promise<ProductScriptRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    Object.entries(where).forEach(([key, value]) => {
      if (value !== undefined) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return await window.$mapi.db.select(
      `SELECT * FROM ${this.tableName()} ${whereClause} ORDER BY script_index ASC`,
      values
    );
  },

  // 根据产品ID获取脚本列表
  async listByProductId(productId: string): Promise<ProductScriptRecord[]> {
    return await this.list({ product_id: productId });
  },
};

export default ProductScriptService;
