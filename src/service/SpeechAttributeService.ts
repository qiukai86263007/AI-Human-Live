import { v4 as uuidv4 } from 'uuid';

export type SpeechAttributeRecord = {
    id: string;
    type: string;
    content: string;
    create_date?: string;
    creator?: string;
    updater?: string;
    update_date?: string;
    state: string;
    live_id: string;
    product_id: string;
    code: number;
}

export const SpeechAttributeService = {
    tableName: 'speech_attribute',

    async list(): Promise<SpeechAttributeRecord[]> {
        return await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName} WHERE state = 'normal' ORDER BY create_date DESC`
        );
    },

    async listByLiveId(liveId: string): Promise<SpeechAttributeRecord[]> {
        return await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName} WHERE live_id = ? AND state = 'normal' ORDER BY create_date DESC`,
            [liveId]
        );
    },

    async listByProductId(productId: string): Promise<SpeechAttributeRecord[]> {
        return await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName} WHERE product_id = ? AND state = 'normal' ORDER BY create_date DESC`,
            [productId]
        );
    },

    async get(id: string): Promise<SpeechAttributeRecord | null> {
        const record = await window.$mapi.db.first(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return record || null;
    },

    async create(record: Partial<SpeechAttributeRecord>): Promise<string> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        const sql = `INSERT INTO ${this.tableName} (
            id, type, content, create_date, creator, updater, update_date, 
            state, live_id, product_id, code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await window.$mapi.db.execute(sql, [
            id,
            record.type || '',
            record.content || '',
            now,
            record.creator || 'system',
            record.updater || 'system',
            now,
            record.state || 'normal',
            record.live_id || '',
            record.product_id || '',
            record.code || 0
        ]);
        
        return id;
    },

    async update(id: string, record: Partial<SpeechAttributeRecord>): Promise<void> {
        const updates: string[] = [];
        const values: any[] = [];

        if (record.type !== undefined) {
            updates.push('type = ?');
            values.push(record.type);
        }
        if (record.content !== undefined) {
            updates.push('content = ?');
            values.push(record.content);
        }
        if (record.state !== undefined) {
            updates.push('state = ?');
            values.push(record.state);
        }
        if (record.live_id !== undefined) {
            updates.push('live_id = ?');
            values.push(record.live_id);
        }
        if (record.product_id !== undefined) {
            updates.push('product_id = ?');
            values.push(record.product_id);
        }
        if (record.code !== undefined) {
            updates.push('code = ?');
            values.push(record.code);
        }

        updates.push('update_date = ?');
        values.push(new Date().toISOString());

        updates.push('updater = ?');
        values.push(record.updater || 'system');

        values.push(id);

        const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`;
        await window.$mapi.db.execute(sql, values);
    },

    async delete(id: string): Promise<void> {
        const sql = `UPDATE ${this.tableName} SET state = ?, update_date = ? WHERE id = ?`;
        await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
    }
}

export default SpeechAttributeService; 