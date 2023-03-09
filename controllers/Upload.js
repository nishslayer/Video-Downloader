const util = require("util");
const multer = require("multer");
const path = require("path");
const Helper = require("../v1/helpers/commonHelper");

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/temp/");
    },
    filename: (req, file, cb) => {
        var ext = path.extname(file.originalname).toLowerCase();
        var filename = Helper.generateString(8)+'_'+Date.now() + ext;
        // console.log(filename);
        cb(null, filename);
    },
});

let uploadFile = multer({
    storage: storage,
    fileFilter: function (_req, file, cb) {
        const fileSize = parseInt(_req.headers["content-length"])
        checkFileType(file,fileSize, cb);
    }
}).single("file");
function checkFileType(file,fileSize, cb) {
    
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|mpeg|mp4|ogg|3gpp|quicktime|x-msvideo|x-mpegURL|mp3/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

     var mime = file.mimetype;
    mime = mime.toLowerCase();
    var maxSize = 0;
    if (mime == "image/png" || mime == "image/jpg" || mime == "image/jpeg") {
        maxSize = 2 * 1024 * 1024;
    }
    else if (mime == "audio/mpeg" || mime == "audio/mp4" || mime == "audio/ogg" || mime == "audio/mp3") {
        maxSize = 5 * 1024 * 1024;
    }
    else if (mime == "video/3gpp" || mime == "video/quicktime" || mime == "video/x-msvideo" || mime == "video/mp4" || mime == "video/x-mpegURL") {
        maxSize = 8 * 1024 * 1024;
    } 

    if (!mimetype || !extname) {
        cb('Error: File type not allowed!');
    }
    else if (fileSize >= maxSize) {
        cb('Error: Maximum file size is ' + (maxSize / (1024 * 1024)) + 'MB');
    }
    else if (mimetype && extname) {
        return cb(null, true);
    }
}
// create the exported middleware object
let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;