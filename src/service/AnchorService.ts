import { v4 as uuidv4 } from 'uuid';

export type AnchorRecord = {
    id: string;
    anchor_name: string;
    anchor_backgroud: string;
    state: string;
    create_date?: string;
    creator?: string;
    updater?: string;
    update_date?: string;
}

export const AnchorService = {
    tableName() {
        return 'anchor'
    },

    async list(): Promise<AnchorRecord[]> {
        return await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName()} WHERE state = 'normal' ORDER BY create_date DESC`
        );
    },

    async get(id: string): Promise<AnchorRecord | null> {
        const record = await window.$mapi.db.first(
            `SELECT * FROM ${this.tableName()} WHERE id = ?`,
            [id]
        );
        return record || null;
    },

    async create(record: Partial<AnchorRecord>): Promise<string> {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        const sql = `INSERT INTO ${this.tableName()} (
            id, anchor_name, anchor_backgroud, state,
            create_date, creator, updater, update_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        await window.$mapi.db.execute(sql, [
            id,
            record.anchor_name,
            record.anchor_backgroud,
            record.state || 'normal',
            now,
            record.creator || 'system',
            record.updater || 'system',
            now
        ]);
        
        return id;
    },

    async delete(id: string): Promise<void> {
        const sql = `UPDATE ${this.tableName()} SET state = ?, update_date = ? WHERE id = ?`;
        await window.$mapi.db.execute(sql, ['deleted', new Date().toISOString(), id]);
    }
}

export default AnchorService; 