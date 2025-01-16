import { app } from 'electron';
import { join } from 'path';

const versions = [
    {
        version: 0,
        up: async (db: DB) => {
            // await db.execute(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`);
            // console.log('db.insert', await db.insert(`INSERT INTO users (name, email) VALUES (?, ?)`,['Alice', 'alice@example.com']));
            // console.log('db.select', await db.select(`SELECT * FROM users`));
            // console.log('db.first', await db.first(`SELECT * FROM users`));
        }
    },
    {
        version:1,
        up: async (db: DB) => {
            await db.execute(`CREATE TABLE IF NOT EXISTS data_sound_tts (
                    id INTEGER PRIMARY KEY,

                    serverName TEXT,
                    serverTitle TEXT,
                    serverVersion TEXT,
                    text TEXT,
                    param TEXT,

                    status TEXT,
                    statusMsg TEXT,
                    jobId TEXT,
                    jobResult TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    resultWav TEXT
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS data_sound_clone (
                    id INTEGER PRIMARY KEY,

                    serverName TEXT,
                    serverTitle TEXT,
                    serverVersion TEXT,
                    promptName TEXT,
                    promptWav TEXT,
                    promptText TEXT,
                    text TEXT,
                    param TEXT,

                    status TEXT,
                    statusMsg TEXT,
                    jobId TEXT,
                    jobResult TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    resultWav TEXT
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS data_video_template (
                    id INTEGER PRIMARY KEY,

                    name TEXT,
                    video TEXT
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS data_video_gen (
                    id INTEGER PRIMARY KEY,

                    serverName TEXT,
                    serverTitle TEXT,
                    serverVersion TEXT,
                    videoTemplateId INTEGER,
                    videoTemplateName TEXT,
                    soundType TEXT,
                    soundTtsId INTEGER,
                    soundTtsText TEXT,
                    soundCloneId INTEGER,
                    soundCloneText TEXT,

                    param TEXT,

                    status TEXT,
                    statusMsg TEXT,
                    jobId TEXT,
                    jobResult TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    resultMp4 TEXT
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS live_broadcast_room (
                    id VARCHAR(100) NOT NULL,
                    live_name VARCHAR(100),
                    live_introduction VARCHAR(500),
                    state VARCHAR(100),
                    create_date TIMESTAMP,
                    creator VARCHAR(100),
                    updater VARCHAR(100),
                    update_date TIMESTAMP,
                    video_duration VARCHAR(100),
                    audio_live_on INTEGER,
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_live_broadcast_room_id
                    ON live_broadcast_room (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS live_product (
                    id VARCHAR(100) NOT NULL,
                    live_id VARCHAR(100),
                    product_id VARCHAR(100),
                    ording INTEGER,
                    state VARCHAR(20),
                    create_date TIMESTAMP,
                    creator VARCHAR(100),
                    updater VARCHAR(100),
                    update_date TIMESTAMP,
                    script_index INTEGER,
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_live_product_id
                    ON live_product (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS product (
                    id VARCHAR(100) NOT NULL,
                    product_type_id VARCHAR(100),
                    product_backroud VARCHAR(40),
                    product_describe VARCHAR(200),
                    product_name VARCHAR(40),
                    state VARCHAR(100),
                    create_date TIMESTAMP,
                    creator VARCHAR(100),
                    updater VARCHAR(100),
                    update_date TIMESTAMP,
                    productAdvantages VARCHAR(4000),
                    prodectName VARCHAR(4000),
                    targetAudience VARCHAR(4000),
                    price VARCHAR(100),
                    exclusivePrice VARCHAR(8000),
                    liveAdvantages VARCHAR(8000),
                    liveGuarantee VARCHAR(8000),
                    answerType INTEGER,
                    agentId VARCHAR(100),
                    script_index INTEGER,
                    is_delete INTEGER,
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_product_id
                    ON product (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS anchor (
                    id               VARCHAR(100) NOT NULL,
                    anchor_backgroud VARCHAR(500),
                    anchor_name      VARCHAR(500),
                    state           VARCHAR(100),
                    create_date     TIMESTAMP,
                    creator         VARCHAR(100),
                    updater         VARCHAR(100),
                    update_date     TIMESTAMP,
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_anchor_id
                    ON anchor (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS product_scene (
                    id               VARCHAR(100) NOT NULL,
                    scene_name       VARCHAR(20),
                    anchor_url       VARCHAR(200),
                    anchor_id        VARCHAR(100),
                    product_id       VARCHAR(100),
                    ording           INTEGER,
                    state            VARCHAR(100),
                    create_date      TIMESTAMP,
                    creator          VARCHAR(100),
                    updater          VARCHAR(100),
                    update_date      TIMESTAMP,
                    gender           VARCHAR(100),
                    anchor_video_url VARCHAR(100),
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_product_scene_id
                    ON product_scene (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS product_script (
                    id               VARCHAR(100) NOT NULL,
                    script_type_id   VARCHAR(100),
                    product_id       VARCHAR(100),
                    text_content     VARCHAR(500),
                    audio_content    VARCHAR(500),
                    state            VARCHAR(100),
                    create_date      TIMESTAMP,
                    creator          VARCHAR(100),
                    updater          VARCHAR(100),
                    update_date      TIMESTAMP,
                    gender           INTEGER,
                    audio_url        VARCHAR(255),
                    script_index     INTEGER,
                    video_duration   VARCHAR(100),
                    pay_url         VARCHAR(500),
                    PRIMARY KEY (id)
            )`);
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_product_script_id
                    ON product_script (id)`);
            await db.execute(`CREATE TABLE IF NOT EXISTS q_and_a (
                            id VARCHAR(255) PRIMARY KEY NOT NULL,
                            product_id VARCHAR(255),
                            enable INTEGER DEFAULT 1,
                            problem TEXT,
                            like_problems TEXT,
                            replys TEXT,
                            state VARCHAR(255) DEFAULT 'normal',
                            create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            creator VARCHAR(255),
                            updater VARCHAR(255),
                            update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS q_and_a_config (
                    id VARCHAR(255) PRIMARY KEY,
                    live_id VARCHAR(255),
                    enable INTEGER DEFAULT 1,
                    reply_way INTEGER DEFAULT 1,
                    appoint_within_do_not_reply INTEGER DEFAULT 0,
                    state VARCHAR(255) DEFAULT 'normal',
                    create_date TIMESTAMP,
                    creator VARCHAR(255),
                    updater VARCHAR(255),
                    update_date TIMESTAMP
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS overall_situation_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                platform VARCHAR(255),
                live_room_no VARCHAR(255),
                operation_mode INTEGER DEFAULT 0,
                operation_time INTEGER DEFAULT 0,
                regular_interaction_priority INTEGER DEFAULT 0,
                ordinary_user_priority INTEGER DEFAULT 0,
                gift_thank_priority INTEGER DEFAULT 0,
                qanda_priority INTEGER DEFAULT 0,
                aiChat_priority INTEGER DEFAULT 0,
                globalnatural_language_switch INTEGER DEFAULT 0,
                globalanchor_nick VARCHAR(255),
                state VARCHAR(255) DEFAULT 'normal',
                create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS gift_thank_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                enable INTEGER DEFAULT 1,
                reply_way INTEGER DEFAULT 1,
                thank_rule INTEGER DEFAULT 0,
                gift_money INTEGER DEFAULT 0,
                small_amount_money INTEGER DEFAULT 0,
                small_amount_thank_contents TEXT,
                big_amount_thank_contents TEXT,
                strengthen_thankcontents TEXT,
                strengthen_thank_enable INTEGER DEFAULT 0,
                state VARCHAR(255) DEFAULT 'normal',
                create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                platform VARCHAR(255)
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS regular_interaction_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                enable INTEGER DEFAULT 1,
                run_mode INTEGER DEFAULT 0,
                interval_time INTEGER DEFAULT 0,
                reply_way INTEGER DEFAULT 1,
                guide_all_chance INTEGER DEFAULT 0,
                guide_follow_chance INTEGER DEFAULT 0,
                guide_cost_chance INTEGER DEFAULT 0,
                guide_share_chance INTEGER DEFAULT 0,
                guide_all_contents TEXT,
                guide_follow_contents TEXT,
                guide_cost_contents TEXT,
                guide_share_contents TEXT,
                state VARCHAR(255) DEFAULT 'normal',
                create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                platform VARCHAR(255)
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS onLine_number_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                enable INTEGER DEFAULT 1,
                reply_way INTEGER DEFAULT 1,
                onLine_number_parameters TEXT,
                state VARCHAR(255) DEFAULT 'normal',
                create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                platform VARCHAR(255)
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS like_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                enable INTEGER DEFAULT 1,
                reply_way INTEGER DEFAULT 1,
                like_parameters TEXT,
                state VARCHAR(255) DEFAULT 'normal',
                create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                platform VARCHAR(255)
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS platform_config (
                id VARCHAR(255) PRIMARY KEY,
                live_id VARCHAR(255),
                platform VARCHAR(255),
                state VARCHAR(255),
                create_date TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS live_parameter (
                id VARCHAR(100) PRIMARY KEY,
                live_id VARCHAR(100),
                product_play_rule VARCHAR(100),
                scene_play_rule VARCHAR(100),
                script_play_rule VARCHAR(100),
                state VARCHAR(20),
                create_date TIMESTAMP,
                creator VARCHAR(100),
                updater VARCHAR(100),
                update_date TIMESTAMP,
                isgeneralization VARCHAR(100),
                platform VARCHAR(255),
                rule_list VARCHAR(1000),
                live_room_id VARCHAR(100),
                anchor_name VARCHAR(100)
            )`);
            await db.execute(`CREATE TABLE IF NOT EXISTS audio_character_config (
                id VARCHAR(255) PRIMARY KEY,
                code INTEGER NOT NULL,
                name VARCHAR(255),
                voice_id VARCHAR(255),
                expire_time TIMESTAMP,
                token VARCHAR(255),
                gender_id INTEGER,
                language_id INTEGER,
                state VARCHAR(255),
                app_key VARCHAR(255),
                access_key_secret VARCHAR(255),
                access_key_id VARCHAR(255),
                create_date TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP,
                configType INTEGER,
                hsKeyid VARCHAR(255),
                hsAccessKey VARCHAR(255),
                version INTEGER,
                image_url VARCHAR(255),
                audio_url VARCHAR(255)
            )`);
            const userDataPath = app.getPath('userData');
            const anchorsPath = join(userDataPath, 'resources/images/anchors');

            const defaultAnchors = [
                {
                    id: '1ffe203237f6472e9eb34929e7679a70',
                    anchor_name: '主播小美',
                    anchor_backgroud: join(anchorsPath, '1ffe203237f6472e9eb34929e7679a70.png'),
                    state: 'normal',
                    creator: 'system',
                    updater: 'system'
                },
                {
                    id: '9d176328b70a4dfabdc988011425c76e',
                    anchor_name: '主播小范',
                    anchor_backgroud: join(anchorsPath, '9d176328b70a4dfabdc988011425c76e.png'),
                    state: 'normal',
                    creator: 'system',
                    updater: 'system'
                }
                ,
                {
                    id: '9b2027be0be340c1870fca8ba999b53c',
                    anchor_name: '主播小黄',
                    anchor_backgroud: join(anchorsPath, '9b2027be0be340c1870fca8ba999b53c.png'),
                    state: 'normal',
                    creator: 'system',
                    updater: 'system'
                },
                {
                    id: 'c43827fcff4d44fa9c62f9853ea7a920',
                    anchor_name: '主播小王',
                    anchor_backgroud: join(anchorsPath, 'c43827fcff4d44fa9c62f9853ea7a920.png'),
                    state: 'normal',
                    creator: 'system',
                    updater: 'system'
                },
                {
                    id: '3890fbe4e71f45fc8568a2153dd5efe7',
                    anchor_name: '主播小李',
                    anchor_backgroud: join(anchorsPath, '3890fbe4e71f45fc8568a2153dd5efe7.png'),
                    state: 'normal',
                    creator: 'system',
                    updater: 'system'
                }
            ];

            const now = new Date().toISOString();
            for (const anchor of defaultAnchors) {
                const result = await db.execute(
                    'SELECT id FROM anchor WHERE id = ?',
                    [anchor.id]
                );
                const exists = Array.isArray(result) && result.length > 0;
                if (!exists) {
                    await db.execute(`
                        INSERT OR IGNORE INTO anchor (
                            id, anchor_name, state,
                            anchor_backgroud,
                            create_date, creator,
                            update_date, updater
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        anchor.id,
                        anchor.anchor_name,
                        anchor.state,
                        anchor.anchor_backgroud,
                        now,
                        anchor.creator,
                        now,
                        anchor.updater
                    ]);
                }
            }

            // 创建火山引擎配置表
            await db.execute(`CREATE TABLE IF NOT EXISTS hs_engine_config (
                id VARCHAR(255) PRIMARY KEY,
                account VARCHAR(255),
                app_key VARCHAR(255),
                access_key_secret VARCHAR(255),
                access_key_id VARCHAR(255),
                state VARCHAR(255),
                create_date TIMESTAMP,
                creator VARCHAR(255),
                updater VARCHAR(255),
                update_date TIMESTAMP,
                configType INTEGER,
                hsKeyid VARCHAR(255),
                hsAccessKey VARCHAR(255)
            )`);

            // 创建 speech_attribute 表
            await db.execute(`
              CREATE TABLE IF NOT EXISTS speech_attribute (
                id VARCHAR(255) PRIMARY KEY,
                type VARCHAR(100),
                content TEXT,
                create_date TIMESTAMP,
                creator VARCHAR(100),
                updater VARCHAR(100),
                update_date TIMESTAMP,
                state VARCHAR(100),
                live_id VARCHAR(255),
                product_id VARCHAR(255),
                code INTEGER
              )
            `);
        }
    }
]

export default {
    versions,
}


