const Helper = require('../../helpers/commonHelper');
const SQUser = require('../../models/SQUser');

module.exports = {
    registerUser: (req, res) => {
        const Sequelize = require('sequelize');
        const Op = Sequelize.Op;

        var body = Helper.sanitizeInput(req.body);
        const email = body.email;
        const phone = body.phone;
        const password = body.password;
        const con_password = body.con_password;
        const fname = body.fname;
        const lname = body.lname;
        const username = body.username;

        if (password == '' || con_password == '' || fname == '' || lname == '' || email == '' || phone == '' || username == '') {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'First name, Last name, Email, Phone, Username, Password and confirm password are required.'
            }));
            res.end();
        }
        else if (password != con_password) {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'Password and Confirm password should be same.'
            }));
            res.end();
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'status'],
                where: {
                    [Op.or]: [
                        {
                            email: email
                        },
                        {
                            phone: phone
                        },
                        {
                            username: username
                        }
                    ]
                }
            }).then(async ud => {
                ud = ud ? ud.dataValues : '';
                if ((ud && ud.status == 0) || ud == '' || !ud) {
                    var date = Helper.currentDatetime();
                    
                    // Update record
                    if (ud && ud.user_id) {
                        var uid = ud.user_uid;
                        SQUser.update(
                            {
                                modified_date: date,
                                modified_by: ud.user_id,
                                modified_by_type: 1,
                                fname: fname,
                                lname: lname,
                                username: username,
                                phone: phone,
                                email: email,
                                password: Helper.encryptPassword(password)
                            },
                            { where: { user_id: ud.user_id } },
                        );
                        res.send(Helper.apiResponse({
                            status: 1,
                            message: 'Details saved, verify phone number',
                            user_uid: uid,
                            phone: phone
                        }));
                    }
                    else {//Insert record
                        var date = Helper.currentDatetime();
                        var uid = Helper.generateUid();
                        SQUser.create(
                            {
                                user_uid: uid,
                                fname: fname,
                                lname: lname,
                                username: username,
                                phone: phone,
                                email: email,
                                password: Helper.encryptPassword(password),
                                modified_date: date,
                                status: 0,
                                added_date: date
                            }
                        ).then(async insData => {
                            SQUser.update(
                                {
                                    added_by: insData.user_id,
                                    added_by_type: 1,
                                    modified_by: insData.user_id,
                                    modified_by_type: 1,
                                    fname: fname,
                                    lname: lname,
                                    username: username,
                                    phone: phone,
                                    email: email,
                                    password: Helper.encryptPassword(password)
                                },
                                { where: { user_id: insData.user_id } },
                            );
                        });

                        res.send(Helper.apiResponse({
                            status: 1,
                            message: 'Details saved, verify phone number',
                            data:{
                                user_uid: uid,
                                fname: fname,
                                lname: lname,
                                username: username,
                                phone: phone,
                                email: email,
                                modified_date: date,
                                status: 0
                            }
                        }));
                    }
                }
                else if (ud && ud.status == 1) {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Email or phone or username already exist'
                    }));
                }
                else if (ud && ud.status == 3) {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Account deleted, contact administrator'
                    }));
                }
            }).catch(error => {
                Helper.addLog(`User register, data: ${JSON.stringify(body)}, error: ${error}`);
                res.send(Helper.apiResponse({
                    status: 0,
                    message: process.env.GLOBAL_SERVER_ERROR
                }));
            });
        }
    },
    resendOTP: async (req, res) => {
        var body = Helper.sanitizeInput(req.body);
        const userUid = body.user_uid;
        const phone = body.phone;
        if (phone == '' || !phone || userUid == '' || !userUid) {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'Phone number and user info cannot be null'
            }));
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'phone'],
                where: { user_uid: userUid, phone: phone }
            }).then(async ud => {
                ud = ud ? ud.dataValues : '';
                if (ud) {
                    var otp = Helper.generateOTP(6);
                    const SMS = require('../../models/SmsModel');

                    var smsData = [];
                    smsData.phone = phone;
                    smsData.body = `Welcome to ${process.env.SITE_TITLE}. Enter this OTP to register ${otp}`;
                    SMS.sendSMS(smsData, async (SMSErr, SMSRes) => {
                        if (SMSRes.status) {
                            await SQUser.update(
                                {
                                    reg_otp: otp
                                },
                                { where: { user_id: ud.user_id } },
                            );
                            res.send(Helper.apiResponse({
                                status: 1,
                                message: 'OTP sent'
                            }));
                        }
                        else {
                            res.send(Helper.apiResponse({
                                status: 0,
                                message: 'SMS not sent, try again'
                            }));
                        }
                    });
                }
                else {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid user info'
                    }));
                }

            }).catch(error => {
                Helper.addLog(`User verify phone, data: ${JSON.stringify(body)}, error: ${error}`);
                res.send(Helper.apiResponse({
                    status: 0,
                    message: process.env.GLOBAL_SERVER_ERROR
                }));
            });
        }
    },
    sendOtp: async (req, res) => {
        var body = Helper.sanitizeInput(req.body);
        const userUid = body.user_uid;
        if (userUid == '') {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'User info cannot be null'
            }));
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'phone'],
                where: { user_uid: userUid }
            }).then(async ud => {
                ud = ud ? ud.dataValues : '';
                if (ud) {
                    var phone = ud.phone;
                    var otp = Helper.generateOTP(6);
                    const SMS = require('../../models/SmsModel');

                    var smsData = [];
                    smsData.phone = phone;
                    smsData.body = `Welcome to ${process.env.SITE_TITLE}. Enter this OTP to register ${otp}`;
                    SMS.sendSMS(smsData, async (SMSErr, SMSRes) => { });
                    await SQUser.update(
                        {
                            reg_otp: otp
                        },
                        { where: { user_id: ud.user_id } },
                    );
                    res.send(Helper.apiResponse({
                        status: 1,
                        message: 'OTP sent'
                    }));
                }
                else {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid user info'
                    }));
                }

            }).catch(error => {
                Helper.addLog(`User verify phone, data: ${JSON.stringify(body)}, error: ${error}`);
                res.send(Helper.apiResponse({
                    status: 0,
                    message: process.env.GLOBAL_SERVER_ERROR
                }));
            });
        }
    },
    verifyPhone: (req, res) => {
        var body = Helper.sanitizeInput(req.body);
        const userUid = body.user_uid;
        const otp = body.otp;
        if (otp == '' || !otp || userUid == '' || !userUid) {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'OTP cannot be null'
            }));
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'reg_otp', 'fname', 'lname', 'username', 'phone', 'email', 'gender', 'dob', 'modified_date', 'last_login_date', 'status'],
                where: { user_uid: userUid }
            }).then(async ud => {
                ud = ud ? ud.dataValues : '';
                if (ud) {
                    if (ud.status == 1) {
                        var token = Helper.createJwtToken(ud.user_uid);
                        delete ud.reg_otp;
                        delete ud.user_id;
                        ud.token = token;
                        res.send(Helper.apiResponse({
                            status: 1,
                            message: 'Phone verified',
                            data: ud
                        }));
                    }
                    else if (ud.reg_otp != otp) {
                        res.send(Helper.apiResponse({
                            status: 0,
                            message: 'Incorrect OTP'
                        }));
                    }
                    else {
                        await SQUser.update(
                            {
                                reg_otp: null,
                                status: 1
                            },
                            { where: { user_id: ud.user_id } },
                        );
                        var token = Helper.createJwtToken(ud.user_uid);
                        delete ud.reg_otp;
                        delete ud.user_id;
                        ud.token = token;
                        res.send(Helper.apiResponse({
                            status: 1,
                            message: 'Phone verified',
                            data: ud
                        }));
                    }
                }
                else {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid user info'
                    }));
                }
            }).catch(error => {
                Helper.addLog(`User verify phone, data: ${JSON.stringify(body)}, error: ${error}`);
                res.send(Helper.apiResponse({
                    status: 0,
                    message: process.env.GLOBAL_SERVER_ERROR
                }));
            });
        }
    },
    login: (req, res) => {
        var body = Helper.sanitizeInput(req.body);
        const username = body.email;
        const password = body.password;
        if (password == '' || username == '') {
            res.send(Helper.apiResponse({
                status: 0,
                is_not_verified: 0,
                message: 'Email and password are required'
            }));
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'reg_otp', 'fname', 'lname', 'username', 'phone', 'email', 'gender', 'dob', 'modified_date', 'last_login_date', 'status', 'password'],
                where: { email: username }
            }).then(async ud => {
                ud = ud ? ud.dataValues : '';
                if (ud) {
                    if (ud.status == 1) {
                        if (Helper.comparePassword(password, ud.password)) {
                            await SQUser.update(
                                {
                                    last_login_date: Helper.currentDatetime()
                                },
                                { where: { user_id: ud.user_id } },
                            );
                            var token = Helper.createJwtToken(ud.user_uid);
                            delete ud.reg_otp;
                            delete ud.user_id;
                            delete ud.password;
                            ud.token = token;
                            res.send(Helper.apiResponse({
                                status: 1,
                                is_not_verified: 0,
                                message: 'Login success',
                                data: ud
                            }));
                        }
                        else {
                            res.send(Helper.apiResponse({
                                status: 0,
                                is_not_verified: 0,
                                message: 'Incorrect password'
                            }));
                        }
                    }
                    else if (ud.status == 0) {
                        var otp = Helper.generateOTP(6);
                        const SMS = require('../../models/SmsModel');

                        var smsData = [];
                        smsData.phone = ud.phone;
                        smsData.body = `Welcome to ${process.env.SITE_TITLE}. Enter this OTP to register ${otp}`;
                        SMS.sendSMS(smsData, async (SMSErr, SMSRes) => {
                            if (SMSRes.status) {
                                await SQUser.update(
                                    {
                                        reg_otp: otp
                                    },
                                    { where: { user_id: ud.user_id } },
                                );
                                res.send(Helper.apiResponse({
                                    status: 0,
                                    is_not_verified: 1,
                                    user_uid: ud.user_uid,
                                    phone: ud.phone,
                                    message: 'OTP sent, verify phone number'
                                }));
                            }
                            else {
                                res.send(Helper.apiResponse({
                                    status: 0,
                                    is_not_verified: 0,
                                    message: 'Phone number not verified'
                                }));
                            }
                        });
                    }
                    else if (ud.status == 2) {
                        res.send(Helper.apiResponse({
                            status: 0,
                            is_not_verified: 0,
                            message: 'Account inactive'
                        }));
                    }
                    else if (ud.status == 3) {
                        res.send(Helper.apiResponse({
                            status: 0,
                            is_not_verified: 0,
                            message: 'Account suspended'
                        }));
                    }
                }
                else {
                    res.send(Helper.apiResponse({
                        status: 0,
                        is_not_verified: 0,
                        message: 'Invalid user info'
                    }));
                }
            }).catch(error => {
                Helper.addLog(`User verify phone, data: ${JSON.stringify(body)}, error: ${error}`);
                res.send(Helper.apiResponse({
                    status: 0,
                    message: process.env.GLOBAL_SERVER_ERROR
                }));
            });
        }
    },
    forgotPassword: (req, res) => {
        var body = Helper.sanitizeInput(req.body);
        var userChoice = body.user_choice;
        var username = body.username;
        if (username == '') {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'Email or Phone is required'
            }));
        }
        else {
            const sequalize = require('sequelize');
            var Op = sequalize.Op;
            SQUser.findOne({
                attributes: ['user_id', 'user_uid', 'fname', 'lname', 'email', 'phone'],
                where: {
                    [Op.or]: [
                        {
                            email: username
                        },
                        {
                            phone: username
                        }
                    ]
                }
            }).then(async data => {
                if (data) {
                    var date = Helper.currentDatetime();
                    var otp = Helper.generateOTP(6);
                    var user_id = data.user_id;
                    var user_uid = data.user_uid;

                    if (userChoice == 'email') {
                        if (data.email) {

                            const EmailObj = require('../Email');
                            const EmailTemplate = require('../../helpers/EmailTemplate');
                            eb = [];
                            eb.otp = otp;
                            eb.name = data.fname + ' ' + data.lname;
                            var emailBody = EmailTemplate.forgotPasswordOtp(eb);

                            emailData = [];
                            emailData.subject = 'Forgot password';
                            emailData.body = emailBody;
                            emailData.toEmail = data.email;
                            await EmailObj.mail(emailData, async (emailErr, emailRes) => {
                                if (emailRes) {
                                    var u = await SQUser.update(
                                        {
                                            reg_otp: otp
                                        },
                                        { where: { user_id: data.user_id } },
                                    );

                                    res.send(Helper.apiResponse({
                                        status: 1,
                                        message: `Authentication code is sent on this email address ${Helper.hideEmailPartial(data.email)}`,
                                        user_uid: data.user_uid
                                    }));
                                }
                                else {
                                    res.send(Helper.apiResponse({
                                        status: 0,
                                        message: 'Authentication code not sent, try again'
                                    }));
                                }
                            })
                        }
                        else {
                            res.send(Helper.apiResponse({
                                status: 0,
                                message: 'Email address not found'
                            }));
                        }
                    }
                    else if (userChoice == 'phone') {
                        if (data.phone) {
                            const SMS = require('../../models/SmsModel');
                            var smsData = [];
                            smsData.phone = data.phone;
                            smsData.body = `${otp} is the authentication code to reset vest password`;
                            await SMS.sendSMS(smsData, async (err, SMSres) => {
                                if (SMSres.status) {
                                    await SQUser.update(
                                        {
                                            reg_otp: otp
                                        },
                                        { where: { user_id: data.user_id } },
                                    );
                                    res.send(Helper.apiResponse({
                                        status: 1,
                                        message: `Authentication code is sent on this phone number ${Helper.hidePhonePartial(data.phone)}`,
                                        user_uid: data.user_uid
                                    }));
                                }
                                else {
                                    res.send(Helper.apiResponse({
                                        status: 1,
                                        message: 'Authentication code not sent, try again'
                                    }));
                                }
                            });
                        }
                        else {
                            res.send(Helper.apiResponse({
                                status: 1,
                                message: 'Phone number not found'
                            }));
                        }
                    }
                    else {
                        res.send(Helper.apiResponse({
                            status: 0,
                            message: 'Choose reset options'
                        }));
                    }
                }
                else {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Email or Phone not found'
                    }));
                }
            });
        }
    },
    resetPassword: (req, res) => {
        var body = req.body;
        if (!body.password || !body.con_password) {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'New password and confirm password are required.'
            }));
            res.end();
        }
        else if (body.password != body.con_password) {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'New password and Confirm password should be same.'
            }));
            res.end();
        }
        else if (body.user_uid == '') {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'User details cannot be null.'
            }));
            res.end();
        }
        else if (body.otp == '') {
            res.send(Helper.apiResponse({
                status: 0,
                message: 'OTP cannot be null.'
            }));
            res.end();
        }
        else {
            SQUser.findOne({
                attributes: ['user_id', 'reg_otp', 'user_uid'],
                where: { user_uid: body.user_uid }
            }).then(async data => {
                if (!data) {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid user details'
                    }));
                    res.end();
                }
                else if (data.reg_otp == null) {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid request'
                    }));
                    res.end();
                }
                else if (data.reg_otp != body.otp) {
                    res.send(Helper.apiResponse({
                        status: 0,
                        message: 'Invalid OTP'
                    }));
                    res.end();
                }
                else {
                    var password = Helper.encryptPassword(body.password);
                    var update = await SQUser.update(
                        {
                            password: password,
                            reg_otp: null
                        },
                        { where: { user_id: data.user_id } },
                    );
                    if (update) {
                        res.send(Helper.apiResponse({
                            status: 1,
                            message: 'Password reset successfully'
                        }));
                        res.end();
                    }
                    else {
                        res.send(Helper.apiResponse({
                            status: 0,
                            message: 'Password not set, try again'
                        }));
                        res.end();
                    }
                }
            });
        }
    }
}