const multer = require("multer");
const path = require('path');


function checkFileType(file, cb){
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extName(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if(mimeType && extName){
        return cb(null, true);
    } else{
        cb('Error: Images Only!!!');
    }
}

const storage = multer.memoryStorage();

const uploadMultiple = multer({
    storage,
    limits: { fileSize: 1000000 },
    fileFilter: function ( req, file, cb ){
        checkFileType(file, cb);
    }
}).array('image', 12);


const upload = multer({
    storage,
    limits: { fileSize: 1000000 },
    fileFilter: async function ( req, file, cb ){
        checkFileType(file, cb);
    }
}).single('image');

module.exports = { uploadMultiple, upload }

