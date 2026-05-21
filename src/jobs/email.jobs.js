const { emailQueue } = require('../config/queue');

const EMAIL_JOBS = {
    VERIFY_EMAIL: 'verify_email',
    RESET_PASSWORD: 'reset_password',
    COURSE_INVITE: 'course_invite',
    ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
    ENROLLMENT_REQUEST_RECEIVED: 'enrollment_request_received',
    ENROLLMENT_CALLED: 'enrollment_called',
    ENROLLMENT_INTERVIEW_SCHEDULED: 'enrollment_interview_scheduled',
    ENROLLMENT_APPROVED: 'enrollment_approved',
    ENROLLMENT_REJECTED: 'enrollment_rejected',
    COHORT_START_REMINDER: 'cohort_start_reminder',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_OVERDUE: 'payment_overdue',
    PAYMENT_COMPLETED: 'payment_completed',
};

const addVerifyEmail = (user, token) =>
    emailQueue.add(EMAIL_JOBS.VERIFY_EMAIL, { user, token });

const addResetPassword = (user, token) =>
    emailQueue.add(EMAIL_JOBS.RESET_PASSWORD, { user, token });

const addCourseInvite = (payload) =>
    emailQueue.add(EMAIL_JOBS.COURSE_INVITE, payload);

const addEnrollmentConfirmed = (user, enrollmentInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_CONFIRMED, { user, enrollmentInfo });

const addEnrollmentRequestReceived = (user, requestInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_REQUEST_RECEIVED, { user, requestInfo });

const addEnrollmentCalled = (user, requestInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_CALLED, { user, requestInfo });

const addEnrollmentInterviewScheduled = (user, requestInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_INTERVIEW_SCHEDULED, { user, requestInfo });

const addEnrollmentApproved = (user, enrollmentInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_APPROVED, { user, enrollmentInfo });

const addEnrollmentRejected = (user, requestInfo) =>
    emailQueue.add(EMAIL_JOBS.ENROLLMENT_REJECTED, { user, requestInfo });

const addCohortStartReminder = (user, cohortInfo) =>
    emailQueue.add(EMAIL_JOBS.COHORT_START_REMINDER, { user, cohortInfo });

// Bulk — thêm nhiều job cùng lúc (dùng cho cronjob reminder)
const addBulkCohortStartReminder = (enrollments, cohortInfo) => {
    const jobs = enrollments.map(({ user }) => ({
        name: EMAIL_JOBS.COHORT_START_REMINDER,
        data: { user, cohortInfo },
    }));
    return emailQueue.addBulk(jobs);
};

const addPaymentReceived = (user, paymentInfo) =>
    emailQueue.add(EMAIL_JOBS.PAYMENT_RECEIVED, { user, paymentInfo });

const addPaymentOverdue = (user, paymentInfo) =>
    emailQueue.add(EMAIL_JOBS.PAYMENT_OVERDUE, { user, paymentInfo });

const addPaymentCompleted = (user, paymentInfo) =>
    emailQueue.add(EMAIL_JOBS.PAYMENT_COMPLETED, { user, paymentInfo });

module.exports = {
    EMAIL_JOBS,
    addVerifyEmail,
    addResetPassword,
    addCourseInvite,
    addEnrollmentConfirmed,
    addEnrollmentRequestReceived,
    addEnrollmentCalled,
    addEnrollmentInterviewScheduled,
    addEnrollmentApproved,
    addEnrollmentRejected,
    addCohortStartReminder,
    addBulkCohortStartReminder,
    addPaymentReceived,
    addPaymentOverdue,
    addPaymentCompleted,
};