import { TimeUtil } from "../lib/util";
import { v4 as uuidv4 } from 'uuid';

export type ProductRecord = {
    id?: string;
    product_type_id: string;
    product_backroud: string;
    product_describe: string;
    product_name: string;
    state: string;
    create_date?: string;
    creator: string;
    updater: string;
    update_date?: string;
    productAdvantages: string;
    prodectName: string;
    targetAudience: string;
    price: string;
    exclusivePrice: string;
    liveAdvantages: string;
    liveGuarantee: string;
    answerType: number;
    agentId: string;
    script_index: number;
    is_delete: number;
}

export const ProductService = {
    tableName() {
        return 'product'
    },

    decodeRecord(record: ProductRecord): ProductRecord | null {
        if (!record) {
            return null
        }
        return {
            ...record,
        } as ProductRecord
    },

    async get(id: string): Promise<ProductRecord | null> {
        const record: any = await window.$mapi.db.first(
            `SELECT * FROM ${this.tableName()} WHERE id = ? AND is_delete = 0`,
            [id]
        )
        return this.decodeRecord(record)
    },

    async list(): Promise<ProductRecord[]> {
        const records: ProductRecord[] = await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName()} WHERE is_delete = 0 ORDER BY create_date DESC`
        )
        return records.map(this.decodeRecord) as ProductRecord[]
    },

    async create(record: ProductRecord) {
        const now = TimeUtil.timestampMS()
        record.id = uuidv4()
        record.create_date = new Date(now).toISOString()
        record.update_date = new Date(now).toISOString()
        record.is_delete = 0

        const fields = [
            'id', 'product_type_id', 'product_backroud', 'product_describe',
            'product_name', 'state', 'create_date', 'creator',
            'updater', 'update_date', 'productAdvantages', 'prodectName',
            'targetAudience', 'price', 'exclusivePrice', 'liveAdvantages',
            'liveGuarantee', 'answerType', 'agentId', 'script_index',
            'is_delete'
        ]
        const values = fields.map(f => record[f])
        const valuesPlaceholder = fields.map(f => '?')
        
        return await window.$mapi.db.insert(
            `INSERT INTO ${this.tableName()} (${fields.join(',')})
             VALUES (${valuesPlaceholder.join(',')})`,
            values
        )
    },

    async update(id: string, record: Partial<ProductRecord>) {
        record.update_date = new Date(TimeUtil.timestampMS()).toISOString()
        
        const fields = Object.keys(record)
        const values = fields.map(f => record[f])
        const set = fields.map(f => `${f} = ?`).join(',')
        
        return await window.$mapi.db.update(
            `UPDATE ${this.tableName()} SET ${set} WHERE id = ?`,
            [...values, id]
        )
    },

    async delete(record: ProductRecord) {
        if (!record.id) throw new Error('Record ID is required');
        // 软删除
        return await this.update(record.id, { is_delete: 1 })
    },

    // 批量软删除
    async batchDelete(ids: string[]) {
        if (!ids.length) return;
        const now = TimeUtil.timestampMS();
        const placeholders = ids.map(() => '?').join(',');
        return await window.$mapi.db.update(
            `UPDATE ${this.tableName()} 
             SET is_delete = 1, update_date = ? 
             WHERE id IN (${placeholders})`,
            [new Date(now).toISOString(), ...ids]
        )
    }
}

export default ProductService 