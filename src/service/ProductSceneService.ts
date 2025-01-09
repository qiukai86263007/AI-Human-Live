import { v4 as uuidv4 } from 'uuid';
export type ProductSceneRecord = {
    id?: string;
    scene_name: string;
    anchor_url: string;
    anchor_id: string;
    product_id: string;
    ording: number;
    state?: string;
    create_date?: string;
    creator?: string;
    updater?: string;
    update_date?: string;
    gender: string;
    anchor_video_url: string;
}

export const ProductSceneService = {
    tableName() {
        return 'product_scene'
    },

    // 创建产品场景
    async create(record: ProductSceneRecord): Promise<string> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await window.$mapi.db.execute(
            `INSERT INTO ${this.tableName()} (
                id, scene_name, anchor_url, anchor_id, product_id,
                ording, state, create_date, creator, updater,
                update_date, gender, anchor_video_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                record.scene_name,
                record.anchor_url,
                record.anchor_id,
                record.product_id,
                record.ording,
                record.state || 'normal',
                now,
                record.creator || 'system',
                record.updater || 'system',
                now,
                record.gender,
                record.anchor_video_url
            ]
        );
        
        return id;
    },

    // 更新产品场景
    async update(id: string, record: Partial<ProductSceneRecord>): Promise<void> {
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

    // 删除产品场景
    async delete(id: string): Promise<void> {
        await window.$mapi.db.execute(
            `DELETE FROM ${this.tableName()} WHERE id = ?`,
            [id]
        );
    },

    // 获取单个产品场景
    async get(id: string): Promise<ProductSceneRecord | null> {
        const record = await window.$mapi.db.first(
            `SELECT * FROM ${this.tableName()} WHERE id = ?`,
            [id]
        );
        return record || null;
    },

    // 获取产品场景列表
    async list(where: Partial<ProductSceneRecord> = {}): Promise<ProductSceneRecord[]> {
        const conditions: string[] = [];
        const values: any[] = [];
        
        Object.entries(where).forEach(([key, value]) => {
            if (value !== undefined) {
                conditions.push(`${key} = ?`);
                values.push(value);
            }
        });
        
        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}` 
            : '';
        
        return await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName()} ${whereClause} ORDER BY create_date DESC`,
            values
        );
    },

    // 根据产品ID获取场景列表
    async listByProductId(productId: string): Promise<ProductSceneRecord[]> {
        return await this.list({ product_id: productId });
    },

    // 根据主播ID获取场景列表
    async listByAnchorId(anchorId: string): Promise<ProductSceneRecord[]> {
        return await this.list({ anchor_id: anchorId });
    },

    // 更新排序
    async updateOrding(id: string, ording: number): Promise<void> {
        await this.update(id, { ording });
    }
}

export default ProductSceneService; 