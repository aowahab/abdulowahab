// Run explicitly in a durable scheduler/worker with the same private server configuration.
// No deployment or schema migration happens here. A bounded tick is safe to retry.
import {studyPool} from '../lib/study/db.js';
import {MarkingWorker} from '../lib/study/worker.js';
import {retentionSweep} from '../lib/study/retention.js';
const pool=studyPool();try{if(process.argv.includes('--retention'))console.log(JSON.stringify(await retentionSweep(pool)));else console.log(JSON.stringify(await new MarkingWorker(pool).runOne()));}finally{await pool.end();}
