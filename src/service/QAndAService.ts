import { v4 as uuidv4 } from 'uuid';
import { ipcRenderer } from 'electron';
import { TimeUtil } from '../lib/util';

export interface QAndARecord {
  id?: string;
  product_id?: string;
  enable?: number;
  problem?: string;
  like_problems?: string;
  replys?: string;
  state?: string;
  create_date?: string;
  creator?: string;
  updater?: string;
  update_date?: string;
}

class QAndAService {
  // 创建问答
  async create(data: QAndARecord): Promise<string> {
    const id = uuidv4();
    const now = TimeUtil.getCurrentTime();
    
    await ipcRenderer.invoke('db:run', `
      INSERT INTO q_and_a (
        id, product_id, enable, problem, like_problems, replys,
        state, create_date, creator, updater, update_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.product_id,
      data.enable || 1,
      data.problem,
      data.like_problems || '',
      data.replys || '',
      data.state || 'normal',
      now,
      data.creator,
      data.creator,
      now
    ]);
    
    return id;
  }

  // 更新问答
  async update(id: string, data: Partial<QAndARecord>): Promise<void> {
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
    params.push(TimeUtil.getCurrentTime());
    
    params.push(id);
    
    await ipcRenderer.invoke('db:run', `
      UPDATE q_and_a 
      SET ${sets.join(', ')}
      WHERE id = ?
    `, params);
  }

  // 删除问答
  async delete(id: string): Promise<void> {
    await ipcRenderer.invoke('db:run', `
      DELETE FROM q_and_a WHERE id = ?
    `, [id]);
  }

  // 获取单个问答
  async get(id: string): Promise<QAndARecord | null> {
    const result = await ipcRenderer.invoke('db:get', `
      SELECT * FROM q_and_a WHERE id = ?
    `, [id]);
    return result || null;
  }

  // 获取产品的所有问答
  async listByProduct(productId: string): Promise<QAndARecord[]> {
    return await ipcRenderer.invoke('db:all', `
      SELECT * FROM q_and_a 
      WHERE product_id = ? AND state = 'normal'
      ORDER BY create_date DESC
    `, [productId]);
  }

  // 批量删除问答
  async batchDelete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    await ipcRenderer.invoke('db:run', `
      DELETE FROM q_and_a WHERE id IN (${placeholders})
    `, ids);
  }

  // 启用/禁用问答
  async toggleEnable(id: string, enable: boolean): Promise<void> {
    await ipcRenderer.invoke('db:run', `
      UPDATE q_and_a 
      SET enable = ?, updater = ?, update_date = ?
      WHERE id = ?
    `, [enable ? 1 : 0, 'current_user', TimeUtil.getCurrentTime(), id]);
  }
}

export default new QAndAService(); 