const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES } = require('../config/queue');
const { EMAIL_JOBS } = require('../jobs/email.jobs');
const emailService = require('../services/email.service');
const logger = require('../config/logger');

const processEmailJob = async (job) => {
    const { name, data } = job;
    logger.info(`[Worker] Processing email job: ${name} | id: ${job.id}`);

    try {
        let result;
        switch (name) {
            case EMAIL_JOBS.VERIFY_EMAIL:
                result = await emailService.sendVerifyEmail(data.user, data.token);
                break;
            case EMAIL_JOBS.RESET_PASSWORD:
                result = await emailService.sendResetPassword(data.user, data.token);
                break;
            case EMAIL_JOBS.COURSE_INVITE:
                result = await emailService.sendCourseInvite(data);
                break;
            case EMAIL_JOBS.ENROLLMENT_CONFIRMED:
            case EMAIL_JOBS.ENROLLMENT_REQUEST_RECEIVED: // Nếu dùng chung service
                result = await emailService.sendEnrollmentConfirmed(data.user, data.enrollmentInfo || data.requestInfo);
                break;
            case EMAIL_JOBS.ENROLLMENT_CALLED:
            case EMAIL_JOBS.ENROLLMENT_INTERVIEW_SCHEDULED:
            case EMAIL_JOBS.ENROLLMENT_APPROVED:
            case EMAIL_JOBS.ENROLLMENT_REJECTED:
                result = await emailService.sendEnrollmentRequestReviewed(data.user, data.requestInfo || data.enrollmentInfo);
                break;
            case EMAIL_JOBS.COHORT_START_REMINDER:
                result = await emailService.sendCohortStartReminder(data.user, data.cohortInfo);
                break;
            case EMAIL_JOBS.PAYMENT_RECEIVED:
            case EMAIL_JOBS.PAYMENT_OVERDUE:
            case EMAIL_JOBS.PAYMENT_COMPLETED:
                result = await emailService.sendEmail({
                    to: data.user.email,
                    subject: data.paymentInfo.subject,
                    html: data.paymentInfo.html,
                });
                break;
            default:
                logger.warn(`[Worker] Unknown email job type: ${name}`);
                return { status: 'skipped', reason: 'unknown_job' };
        }

        // Trả về dữ liệu an toàn để lưu vào Redis
        return {
            success: true,
            jobName: name,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        // Log lỗi chi tiết tại đây trước khi BullMQ đánh dấu Job thất bại
        logger.error(`[Worker] Error in processEmailJob [${name}]: ${error.message}`);
        throw error; // Phải throw để BullMQ biết job thất bại và retry
    }
};

const createEmailWorker = () => {
    const worker = new Worker(
        QUEUE_NAMES.EMAIL,
        processEmailJob,
        {
            connection,
            concurrency: 5,         // xử lý 5 email song song
            limiter: {
                max: 10,       // tối đa 10 job
                duration: 1000,     // mỗi 1 giây — tránh spam Mailjet
            },
        }
    );

    worker.on('completed', (job) => {
        logger.info(`[Worker] Email sent: ${job.name} | id: ${job.id}`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[Worker] Email failed: ${job.name} | id: ${job.id} | attempt: ${job.attemptsMade} | error: ${err.message}`);
    });

    worker.on('error', (err) => {
        logger.error(`[Worker] Email worker error: ${err.message}`);
    });

    logger.info('[Worker] Email worker started');
    return worker;
};

module.exports = { createEmailWorker };