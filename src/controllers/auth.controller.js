const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
    });

    return res.json({
        status: "success",
        message: "Đăng nhập thành công",
        data: {
            user,
            accessToken: accessToken
        }
    })
});

const register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);

    return res.json({
        status: "success",
        message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh",
        data: {
            user: user.toAuthJSON()
        }
    });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout();
    res.clearCookie('refreshToken');

    return res.json({
        status: "success",
        message: "Đăng xuất thành công"
    });
});

const refreshAccessToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;

    const { accessToken, refreshToken: newRefreshToken, user } =
        await authService.refreshAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        status: "success",
        message: "Token được làm mới thành công",
        data: {
            user,
            accessToken: accessToken
        }
    });
});

const getMe = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const user = await userService.getUserById(userId);

    res.status(200).json({
        status: 'success',
        message: 'Lấy profile thành công',
        data: {
            user: user.getPublicProfile()
        }
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const { user } = await authService.forgotPassword(email);

    if (!user) {
        return res.status(200).json({ status: 'success', message: 'Email đặt lại mật khẩu đã được gửi' });
    }

    res.status(200).json({
        status: 'success',
        message: 'Email đặt lại mật khẩu đã được gửi',
    });
});

const resetPassword = catchAsync(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const user = await authService.resetPassword(resetToken, newPassword);

    res.status(200).json({
        status: 'success',
        message: 'Reset mật khẩu thành công',
        data: {
            user: user.toAuthJSON()
        }
    });
});

const changePassword = catchAsync(async (req, res) => {
    const { password, newPassword } = req.body;
    const user = await authService.changePassword(req.user.id, password, newPassword);

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật mật khẩu thành công',
        data: {
            user: user.toAuthJSON()
        }
    });
});

const updateProfile = catchAsync(async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    const user = await authService.updateProfile(req.user.id, {
        firstName,
        lastName,
        phone
    });

    res.status(200).json({
        status: 'success',
        message: 'Cập nhật thông tin thành công',
        data: {
            user: user.toAuthJSON()
        }
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.params;

    const user = await authService.verifyEmail(token);

    res.status(200).json({
        status: 'success',
        message: 'Xác thực email thành công',
        data: {
            user: user.toAuthJSON()
        }
    });
});

const resendVerifyEmail = catchAsync(async (req, res) => {
    const result = await authService.resendVerifyEmail(req.user.id);

    res.status(200).json({
        status: 'success',
        message: result.message
    });
});

module.exports = {
    login,
    logout,
    register,
    refreshAccessToken,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    verifyEmail,
    resendVerifyEmail
}