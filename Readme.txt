Site Flow
Open url: http://54.193.48.44:8085/
 - This url will display add video form
 	- Currently mp4 videos will be supported
 - Add details and then submit
 - Redirect to view page, all the details and video preview will be displayed

Tenchnical
Nodejs with below packages
{
  "name": "video_editor",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.0",
    "body-parser": "^1.20.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "ejs": "^3.1.8",
    "express": "^4.18.2",
    "express-router-group": "^0.1.4",
    "moment": "^2.29.4",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^2.3.3",
    "nodemon": "^2.0.20",
    "otp-generator": "^4.0.0",
    "sequelize": "^6.28.0",
    "uuid": "^9.0.0"
  }
}
Site is working on PORT 8085