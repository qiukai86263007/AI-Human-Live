import { TimeUtil } from "../lib/util";
import { LiveRoomState } from '../types/liveRoomState';

export type LiveBroadcastRecord = {
    id?: string;
    live_name: string;
    live_introduction: string;
    state?: LiveRoomState;
    create_date?: string;
    creator: string;
    updater: string;
    update_date?: string;
    video_duration: string;
    audio_live_on: number;
}

export const LiveBroadcastService = {
    tableName() {
        return 'live_broadcast_room'
    },

    decodeRecord(record: LiveBroadcastRecord): LiveBroadcastRecord | null {
        if (!record) {
            return null
        }
        return {
            ...record,
        } as LiveBroadcastRecord
    },

    async get(id: string): Promise<LiveBroadcastRecord | null> {
        const record: any = await window.$mapi.db.first(
            `SELECT * FROM ${this.tableName()} WHERE id = ?`,
            [id]
        )
        return this.decodeRecord(record)
    },

    async list(): Promise<LiveBroadcastRecord[]> {
        const records: LiveBroadcastRecord[] = await window.$mapi.db.select(
            `SELECT * FROM ${this.tableName()} ORDER BY create_date DESC`
        )
        return records.map(this.decodeRecord) as LiveBroadcastRecord[]
    },

    async create(record: LiveBroadcastRecord) {
        const now = TimeUtil.timestampMS()
        record.state = LiveRoomState.EDITING
        record.create_date = new Date(now).toISOString()
        record.update_date = new Date(now).toISOString()

        const fields = [
            'id', 'live_name', 'live_introduction', 'state',
            'create_date', 'creator', 'updater', 'update_date',
            'video_duration', 'audio_live_on'
        ]
        const values = fields.map(f => record[f])
        const valuesPlaceholder = fields.map(f => '?')
        
        return await window.$mapi.db.insert(
            `INSERT INTO ${this.tableName()} (${fields.join(',')})
             VALUES (${valuesPlaceholder.join(',')})`,
            values
        )
    },

    async update(id: string, record: Partial<LiveBroadcastRecord>) {
        record.update_date = new Date(TimeUtil.timestampMS()).toISOString()
        
        const fields = Object.keys(record)
        const values = fields.map(f => record[f])
        const set = fields.map(f => `${f} = ?`).join(',')
        
        return await window.$mapi.db.update(
            `UPDATE ${this.tableName()} SET ${set} WHERE id = ?`,
            [...values, id]
        )
    },

    async delete(record: LiveBroadcastRecord) {
        if (!record.id) throw new Error('Record ID is required');
        await window.$mapi.db.delete(
            `DELETE FROM ${this.tableName()} WHERE id = ?`,
            [record.id]
        )
    },

    // 启动直播间
    async start(record: LiveBroadcastRecord) {
        if (!record.id) throw new Error('Record ID is required');
        await this.update(record.id, {
            state: LiveRoomState.LIVE
        })
    },

    // 停止直播间
    async stop(record: LiveBroadcastRecord) {
        if (!record.id) throw new Error('Record ID is required');
        await this.update(record.id, {
            state: LiveRoomState.STOPPED
        })
    }
}

export default LiveBroadcastService 