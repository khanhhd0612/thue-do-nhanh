const User = require('../models/user.model');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const jwt = require("jsonwebtoken");
const emailJobs = require('../jobs/email.jobs');
const crypto = require('crypto');

const register = async (userBody) => {
    if (await User.isEmailTaken(userBody.email)) {
        throw new ApiError(409, 'Email đã được sử dụng');
    }

    const user = new User({
        firstName: userBody.firstName,
        lastName: userBody.lastName,
        email: userBody.email,
        password: userBody.password,
        phone: userBody.phone,
    });

    const token = user.createEmailVerificationToken();

    await user.save();

    await emailJobs.addVerifyEmail(user, token);

    return user;
};

const login = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ApiError(403, 'Email hoặc mật khẩu không đúng');
    }

    if (user.isLocked) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new ApiError(
            429,
            `Tài khoản bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút`
        );
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Tài khoản này đã bị vô hiệu hóa');
    }

    // if (!user.isVerified) {
    //     throw new ApiError(403, 'Tài khoản chưa được xác minh');
    // }

    const isPasswordMatch = await user.isPasswordMatch(password);

    if (!isPasswordMatch) {
        await user.incLoginAttempts();
        throw new ApiError(403, 'Email hoặc mật khẩu không đúng');
    }

    await user.updateOne({
        $set: { loginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: 1 }
    });

    const accessToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id.toString(), type: 'refresh' },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    await Token.create({
        token: refreshToken,
        user: user._id,
        type: 'refresh',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
        user: user.toAuthJSON(),
        accessToken,
        refreshToken
    };
};

const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, 'Refresh token không tồn tại');
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Token không hợp lệ hoặc hết hạn');
    }

    const tokenDoc = await Token.findOne({ token: refreshToken });

    if (!tokenDoc) {
        throw new ApiError(401, 'Token không hợp lệ');
    }

    if (tokenDoc.blacklisted) {
        await Token.updateMany(
            { user: tokenDoc.user },
            { blacklisted: true }
        );

        throw new ApiError(401, 'Phát hiện token bị đánh cắp (reuse)');
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
        throw new ApiError(401, 'User không hợp lệ');
    }

    tokenDoc.blacklisted = true;
    await tokenDoc.save();

    const newRefreshToken = jwt.sign(
        { id: user._id.toString(), type: 'refresh' },
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    await Token.create({
        token: newRefreshToken,
        user: user._id,
        type: 'refresh',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const accessToken = jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
        user: user.toAuthJSON()
    };
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ email });

    if (!user) {
        return { user: null, token: null };
    }

    const token = user.createResetToken();

    await user.save();

    await emailJobs.addResetPassword(user, token);

    return {
        user,
        token
    };
};

const resetPassword = async (resetToken, newPassword) => {
    const user = await User.findByResetToken(resetToken);

    if (!user) {
        throw new ApiError(404, 'Reset token không hợp lệ hoặc đã hết hạn');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
};

const logout = async (refreshToken) => {
    await Token.updateOne(
        { token: refreshToken },
        { blacklisted: true }
    );
};

const changePassword = async (userId, password, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new ApiError(404, 'User không tồn tại');
    }

    if (password === newPassword) {
        throw new ApiError(400, 'Mật khẩu mới không được trùng mật khẩu cũ');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Tài khoản này đã bị vô hiệu hóa');
    }

    const isPasswordMatch = await user.isPasswordMatch(password);

    if (!isPasswordMatch) {
        throw new ApiError(403, 'Mật khẩu hiện tại không đúng');
    }


    user.password = newPassword;
    await user.save();

    return user;
};

const updateProfile = async (userId, updateBody) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User không tồn tại');
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone'];

    const updates = Object.keys(updateBody);

    updates.forEach((field) => {
        if (!allowedUpdates.includes(field)) {
            throw new ApiError(400, `Không được phép cập nhật : ${field}`);
        }
    });

    allowedUpdates.forEach((field) => {
        if (updateBody[field] !== undefined) {
            user[field] = updateBody[field];
        }
    });

    await user.save();

    return user;
};

const verifyEmail = async (token) => {
    const crypto = require('crypto');

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, 'Token không hợp lệ hoặc đã hết hạn');
    }

    if (user.isVerified) {
        throw new ApiError(400, 'Email đã được xác minh');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return user;
};

const resendVerifyEmail = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User không tồn tại');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Tài khoản đã bị vô hiệu hóa');
    }

    if (user.isVerified) {
        throw new ApiError(400, 'Email đã được xác minh');
    }

    const token = user.createEmailVerificationToken();

    await user.save();

    await emailJobs.addVerifyEmail(user, token);

    return {
        message: 'Đã gửi lại email xác minh'
    };
};


module.exports = {
    refreshAccessToken,
    login,
    forgotPassword,
    resetPassword,
    logout,
    changePassword,
    register,
    updateProfile,
    verifyEmail,
    resendVerifyEmail
}