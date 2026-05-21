const { Queue, Worker, QueueEvents } = require('bullmq');
const logger = require('./logger');

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};

const QUEUE_NAMES = {
    EMAIL: 'email',
};

const defaultJobOptions = {
    attempts: 3,                    // retry tối đa 3 lần nếu thất bại
    backoff: {
        type: 'exponential',
        delay: 5000,                // lần 1: 5s, lần 2: 10s, lần 3: 20s
    },
    removeOnComplete: { count: 100 },  // giữ 100 job complete gần nhất
    removeOnFail: { count: 200 },  // giữ 200 job fail để debug
};

const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
    connection,
    defaultJobOptions,
});

const emailQueueEvents = new QueueEvents(QUEUE_NAMES.EMAIL, { connection });

emailQueueEvents.on('completed', ({ jobId }) => {
    logger.info(`[Queue] Email job ${jobId} completed`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[Queue] Email job ${jobId} failed: ${failedReason}`);
});

module.exports = {
    emailQueue,
    connection,
    QUEUE_NAMES,
};