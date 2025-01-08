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
        }
    },
]

export default {
    versions,
}


