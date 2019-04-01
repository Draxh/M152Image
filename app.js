const express = require('express');
const multer = require('multer');
const path = require('path');
const gm = require('gm');
const ejs = require('ejs');
const fs = require('fs');
const fluent_ffmpeg = require("fluent-ffmpeg");

var mergedVideo = fluent_ffmpeg();



// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './files',                             // Where the file will be saved
    filename: function(req, file, cb){
        cb(null, file.originalname);   // This is the filename that will be saved
    }
});

const videostorage = multer.diskStorage({
    destination: './videoFiles',                             // Where the file will be saved
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
        checkImageFileType(file, cb);
    }
}).array('files', 20);

const multiVideoUpload = multer({
    storage: videostorage,
    fileFilter: function (req, file, cb) {
        checkVideoFileType(file, cb)
    }
}).array('files', 20);

// Check File Type
function checkImageFileType(file, cb){
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

function checkVideoFileType(file, cb){
    // Allowed ext (regex)
    const filetypes = /webm|mkv|flv|wmv|mp4|mpg/;
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

app.post('/api/videos', (req, res) => {      // Multi Upload
    multiVideoUpload(req, res, (err) => {
        if(err){
            res.sendStatus(400)
        } else {
            res.sendStatus(201);
            convertVideo(req.files, res);
        }
    });
});

function convertVideo(files, res){
    console.log(files);
    files.forEach(function(file){
        mergedVideo = mergedVideo.addInput(file.originalname);
    });

    mergedVideo.mergeToFile('./videoFiles/')
        .on('error', function(err) {
            console.log('Error ' + err.message);
        })
        .on('end', function() {
            console.log('Finished!');
        });
}


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





app.set('view engine', 'ejs');


function getImages() {
    return fs.readdirSync('./files/');
}

app.get('/image/gallery', function(req, res) {
    res.render('index', {myFiles: getImages()})
});
app.get('/video_manager', function(req, res) {
    res.render('video')
});



