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
    }
}

export default AnchorService; 