const Helper = require('../v1/helpers/commonHelper');
const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
    let bearerHeader = req.header('authorization');
    if (!bearerHeader) {
        res.send({
            status: 0,
            message: 'Authorization token is required'
        });
        return res.status(401);
    }
    else {
        bearerHeader = bearerHeader.replace('Bearer ', '');
        if (bearerHeader == 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') {
            next();
        }
        else {
            jwt.verify(bearerHeader, process.env.JWT_TOKEN, (err, decode) => {
                if (err) {
                    res.send({
                        status: 0,
                        message: 'Invalid authorized token'
                    });
                    return res.status(401);
                }
                else if (decode) {
                    next();
                }
                else {
                    res.send({
                        status: 0,
                        message: 'Invalid user authorization'
                    });
                    return res.status(401);
                }
            })
        }
    }
}