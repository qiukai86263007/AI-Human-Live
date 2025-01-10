import { v4 as uuidv4 } from 'uuid';

export interface QAndARecord {
  id?: string;
  product_id?: string;
  enable?: number;
  problem?: string;         // 问题种类名称
  like_problems?: string[]; // 问题列表
  replys?: string[];       // 回答列表
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
}

class QAndAService {
  tableName = 'q_and_a';

  // 创建问题种类
  async createCategory(productId: string, categoryName: string): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO ${this.tableName} (
      id, product_id, problem, like_problems, replys,
      enable, state, create_date, creator, updater, update_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await window.$mapi.db.execute(sql, [
      id,
      productId,
      categoryName,    // problem 字段存储问题种类名称
      '[]',           // 初始化空的问题数组
      '[]',           // 初始化空的回答数组
      1,
      'normal',
      now,
      'system',
      'system',
      now
    ]);

    return id;
  }

  // 添加问答对
  async addQA(categoryId: string, question: string, answer: string): Promise<void> {
    const category = await this.get(categoryId);
    if (!category) return;

    const like_problems = category.like_problems || [];
    const replys = category.replys || [];

    // 添加新的问答对
    like_problems.push(question);
    replys.push(answer);

    // 更新数据库
    await this.update(categoryId, {
      like_problems,
      replys
    });
  }

  async update(id: string, data: Partial<QAndARecord>): Promise<void> {
    const sets: string[] = [];
    const params: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        if (key === 'like_problems' || key === 'replys') {
          value = JSON.stringify(value);
        }
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

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await window.$mapi.db.execute(sql, [id]);
  }

  async get(id: string): Promise<QAndARecord | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const result = await window.$mapi.db.first(sql, [id]);
    
    if (result) {
      result.like_problems = JSON.parse(result.like_problems as string || '[]');
      result.replys = JSON.parse(result.replys as string || '[]');
    }
    
    return result;
  }

  async listByProduct(productId: string): Promise<QAndARecord[]> {
    const sql = `SELECT * FROM ${this.tableName} 
                WHERE product_id = ? AND state = 'normal'
                ORDER BY create_date DESC`;
    const results = await window.$mapi.db.select(sql, [productId]);
    
    return results.map(result => ({
      ...result,
      like_problems: JSON.parse(result.like_problems as string || '[]'),
      replys: JSON.parse(result.replys as string || '[]')
    }));
  }

  async batchDelete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`;
    await window.$mapi.db.execute(sql, ids);
  }

  async toggleEnable(id: string, enable: boolean): Promise<void> {
    const sql = `UPDATE ${this.tableName} 
                SET enable = ?, updater = ?, update_date = ?
                WHERE id = ?`;
    await window.$mapi.db.execute(sql, [
      enable ? 1 : 0,
      'system',
      new Date().toISOString(),
      id
    ]);
  }

  async addLikeProblem(id: string, problem: string): Promise<void> {
    const qa = await this.get(id);
    if (!qa) return;
    
    const like_problems = qa.like_problems || [];
    if (!like_problems.includes(problem)) {
      like_problems.push(problem);
      await this.update(id, { like_problems });
    }
  }

  async addReply(id: string, reply: string): Promise<void> {
    const qa = await this.get(id);
    if (!qa) return;
    
    const replys = qa.replys || [];
    if (!replys.includes(reply)) {
      replys.push(reply);
      await this.update(id, { replys });
    }
  }
}

export default new QAndAService(); 