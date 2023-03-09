require('express-router-group');
var r = require('express').Router();
const { append } = require('express/lib/response');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage });
upload.single('video_file')

// User Routes
var Video = require('../controllers/Video');
r.get('/', (req, res) => {
    res.render('add-video', {
        title: 'Add video'
    })
});
r.post('/', upload.single('video_file'), (req, res) => {
    var body = req.body;
    console.log(body);
    if(req.file !== undefined)
    {
        console.log('HERE');
        body.filename = req.file.originalname;    
    }
    else{
        body.filename = '';
    }
    
    res.render('view-video', body)
});


module.exports = r;
// https://www.geeksforgeeks.org/how-to-setup-view-engine-in-node-js/