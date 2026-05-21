const { createEmailWorker } = require('../workers/email.worker');
const logger = require('../config/logger');

let emailWorker;

const initQueues = () => {
    emailWorker = createEmailWorker();
    logger.info('[Queue] All workers initialized');
};

const closeQueues = async () => {
    logger.info('[Queue] Closing workers...');
    if (emailWorker) await emailWorker.close();
    logger.info('[Queue] All workers closed');
};

module.exports = { initQueues, closeQueues };