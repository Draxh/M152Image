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

const audiostorage = multer.diskStorage({
    destination: './audioFiles',                             // Where the file will be saved
    filename: function(req, file, cb){
        cb(null, file.originalname);                        // This is the filename that will be saved
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

const audioUpload = multer({
    storage: audiostorage
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
app.use('/videoFiles', express.static(__dirname + '/videoFiles'));  // The videos are public they can be seen on the web
app.use('/audioFiles', express.static(__dirname + '/audioFiles'));  // The audios are public they can be seen on the web
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

app.post('/api/audio', (req, res) => {
    // audio Upload
    audioUpload(req, res, (err) => {
        if(err){
            res.sendStatus(400)
        } else {
            res.json({
                audio: req.files[0].path,
                vtt: req.files[1].path
            });
            audioVtt(req.files[0].originalname, req.files[1].originalname)
        }
    });
});

app.post('/api/videos', (req, res) => {
    // Video Upload
    multiVideoUpload(req, res, (err) => {
        if(err){
            res.sendStatus(400)
        } else {
            res.sendStatus(201);
            convertVideo(req.files, req.body.name, res);
        }
    });
});

function convertVideo(files, name, res){
    console.log(files);
    // var videoName = document.getElementById("mergedVideoName").innerT ext;
    files.forEach(function(file){
        mergedVideo = mergedVideo.addInput(file.path);
        console.log(file.path);
    });

    mergedVideo.mergeToFile('./videoFiles/' + name + ".mp4" )
        .on('error', function(err) {
            console.log('Error ' + err.message);
        })
        .on('end', function() {
            console.log('Finished!');

        });
}


function audioVtt(audioName, vttName){

    var reg =  audioName.match(/([^.]+)/);
    console.log("realName: " + audioName);
    var audioFilename = reg.toString().split(',').pop();
    console.log(audioName);
    console.log(audioFilename);


    fs.rename('./audioFiles/'+ audioName, './audioFiles/vttToAudioFiles/' + audioName, (err) => {
    if(err){
        console.log(err);
    } else {
        console.log("Yes");
    }
});
fs.rename('./audioFiles/'+ vttName, './audioFiles/vttToAudioFiles/' + audioFilename + ".vtt", (err) => {
    if(err){
        console.log(err);
    } else {
        console.log("yess");
    }
});

}

function getVttFile(audioName){
    var reg =  audioName.match(/([^.]+)/);
    var audioFilename = reg.toString().split(',').pop();
    console.log(audioFilename);
    return audioFilename;
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

app.get('/play_video', function (req, res) {
    //res.send("Hallo " + req.query.videoName);
    res.render('playVideo', { video : req.query.videoName });
});

app.get('/image/gallery', function(req, res) {
    res.render('index', {myFiles: getImages()})
});

app.get('/video_manager', function(req, res) {
    res.render('video')
});

app.get('/audio-player', function(req, res) {
    var vtt = getVttFile(req.query.audioName);
    res.render('audioPlayer', { audio : req.query.audioName , vtt: vtt });
});

app.get('/start', function(req, res) {
    res.render('start')
});

app.get('/audio-manager', function(req, res) {
    res.render('audioManager')
});
/*app.get('*', function(req, res) {
    res.redirect('/start');
});*/


app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/audioFiles/vttToAudioFiles'));
