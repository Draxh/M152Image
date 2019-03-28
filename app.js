const express = require('express');
const multer = require('multer');
const path = require('path');
const gm = require('gm');



// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './files',                             // Where the file will be saved
    filename: function(req, file, cb){
        cb(null, file.originalname);   // This is the filename that will be saved
    }
});


// Init Upload
const singleUpload = multer({
    storage: storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('file');

const multiUpload = multer({
    storage: storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).array('files', 20);

// Check File Type
function checkFileType(file, cb){
    // Allowed ext (regex)
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!', false);
    }
}

// App
const app = express();
app.use('/files', express.static(__dirname + '/files'));  // The images are public they can be seen on the web
app.listen(process.env.PORT || 80, () => console.log('Server started'));


// Frontend
app.get('/', (req, res) => res.send("Hello World"));


app.post('/api/file', (req, res) => {       // Single Upload
    singleUpload(req, res, (err) => {
        if(err){
          res.sendStatus(400)
        } else {
            res.sendStatus(201);
            resizeImage(req.file, res);
        }
    });
});

app.post('/api/files', (req, res) => {      // Multi Upload
    multiUpload(req, res, (err) => {
        if(err){
            res.sendStatus(400)
        } else {
            res.sendStatus(201);
            console.log(req.files[0]);
            for (var i = 0; i < req.files.length; i++) {
                resizeImage(req.files[i], res);
            }
        }
    });
});


const mySizes = [720, 1280, 1920];
const myImgSizeNames = ['small_', 'medium_', 'big_'];

function resizeImage(file, res){
            for (var i = 0; i < 3; i++) {
                gm('./files/' + file.originalname)                                      // It takes the current uploaded file
                    .resize(mySizes[i])                                                                 // Changes the height to 720/1280/1920 px
                    .write('./files/' + myImgSizeNames[i] + file.originalname, function (err) {     // Rename the created image (small, medium and big)
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Image created");
                        }
                    })
            }
    }