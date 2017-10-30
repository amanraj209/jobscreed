'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cluster = require('cluster');
const AWS = require('aws-sdk');
const md5 = require('md5');
const sha256 = require('sha256');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const favicon = require('serve-favicon');
const url = require('url');
const fs = require('fs');
const formidable = require('formidable');
const uuid = require('uuid');
const njwt = require('njwt');
const Cookies = require('cookies');
const session = require('express-session');
const dbhandler = require('./dbhandler');
const randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

const app = express();

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'", 'ajax.googleapis.com', 'http://jobscreed.com', 'maxcdn.bootstrapcdn.com', 'www.indeed.com', 'pagead2.googlesyndication.com'],
        styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'jobscreed.com', "'unsafe-inline'"],
        scriptSrc: ["'self'", 'ajax.googleapis.com', 'jobscreed.com', 'maxcdn.bootstrapcdn.com', 'www.indeed.com', 'pagead2.googlesyndication.com', 'www.google-analytics.com', "'unsafe-inline'"],
        imgSrc: ["'self'", 'jobscreed.com', 'www.google-analytics.com', 'www.indeed.com', 'data:'],
        frameSrc: ['googleads.g.doubleclick.net', 'pagead2.googlesyndication.com', 'www.google-analytics.com'],
        fontSrc: ["'self'", 'jobscreed.com', 'maxcdn.bootstrapcdn.com'],
        connectSrc: ["'self'", 'ws://jobscreed.com', 'http://jobscreed.com', 'pagead2.googlesyndication.com'],
        sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
        reportUri: '/report-violation',
        objectSrc: ['css', 'js', 'ttf', 'woff', 'woff2'],
    }
}));
app.use(helmet.hpkp({
    maxAge: 7776000,
    sha256s: [sha256(randomToken(64)), sha256(randomToken(64))]
}));
app.use(helmet.expectCt());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noCache());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

const sess = session({
    resave: false,
    saveUninitialized: false,
    secret: 'darklords'
});

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-west-2"
});

const index = require('./routes/index');
const s3 = new AWS.S3();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('port', 3000 || process.env.PORT);
app.set('trust proxy', true);

app.use(favicon(path.join(__dirname, 'public', 'favicons/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({
    type: ['json', 'application/csp-report']
}));
app.use(bodyParser.urlencoded({extended : true}));

app.use(sess);

var server = require('http').createServer(app);
const io = require('socket.io')(server);
const ios = require('socket.io-express-session');
io.use(ios(sess));

// server.listen(app.get('port'), function () {
//     console.log("localhost on " + app.get('port'));
// });

app.use('/', index.router);
app.use('/', express.static(path.join(__dirname, 'public/')));

const secretKey = index.secretKey;

app.post('/report-violation', function (req, res) {
    if (req.body) {
        console.log('CSP Violation: ', req.body);
    } else {
        console.log('CSP Violation: No data received!');
    }
    res.status(204).end();
});

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.post('/signup', function (req, res) {
    let ppPath = '/images/profileImages/female.png';
    if (req.body.gender === 'Male') {
    ppPath = '/images/profileImages/male.png';
}
    const newuser = {
        name : req.body.fname + " " + req.body.lname,
        email : req.body.email,
        password : md5(sha256(md5(req.body.password))),
        contact : req.body.contact,
        gender : req.body.gender,
        profession : req.body.profession,
        uid : "jc" + md5(sha256(req.body.email)),
        dob : req.body.dob,
        token : randomToken(64),
        photoURL : ppPath,
        verified : false,
    };
    dbhandler.putitem(newuser, function (result) {
        if (result === "ConditionalCheckFailedException") {
            res.send({
                success: false,
                message: "ConditionalCheckFailedException"
            });
        }
        else {
            const claims = {
                sub: result.uid,
                iss: 'http://jobscreed.com',
                permissions: 'uploads, search, message',
            };
            const jwt = njwt.create(claims, secretKey);
            jwt.setExpiration(new Date().getTime() + (24 * 60 * 60 * 1000));
            const token = jwt.compact();
            new Cookies(req, res).set('access_token', token, {
                httpOnly: true,
                // secure: true
            });
            req.session.name = result.name;
            req.session.email = result.email;
            req.session.uid = result.uid;
            req.session.photoURL = result.photoURL;
            res.send({
                name: result.name,
                email: result.email,
                uid: result.uid,
                photoURL: result.photoURL,
                university: result['university'],
                company: result['company'],
                residence: result['residence'],
                hometown: result['hometown'],
                dob: result['dob']
            });
        }
    });
});

app.post('/login', function (req, res) {
    const user = {
        email : req.body.email,
        password : req.body.password,
    };
    dbhandler.getitem(user, function (result) {
        if (result === "NotExist") {
            res.send({
                success: false,
                message: "NotExist"
            });
        }
        else {
            if (result.password !== md5(sha256(md5(req.body.password)))) {
                res.send({
                    success: false,
                    message: "Invalid"
                });
            }
            else {
                const claims = {
                    sub: result.uid,
                    iss: 'http://jobscreed.com',
                    permissions: 'uploads, search, message',
                };
                const jwt = njwt.create(claims, secretKey);
                jwt.setExpiration(new Date().getTime() + (24 * 60 * 60 * 1000));
                const token = jwt.compact();
                new Cookies(req, res).set('access_token', token, {
                    httpOnly: true,
                    // secure: true
                });
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.uid = result.uid;
                req.session.photoURL = result.photoURL;
                res.send({
                    name: result.name,
                    email: result.email,
                    uid: result.uid,
                    photoURL: result.photoURL,
                    university: result['university'],
                    company: result['company'],
                    residence: result['residence'],
                    hometown: result['hometown'],
                    dob: result['dob']
                });
            }
        }
    });
});

app.get('/logout', function (req, res) {
    const claims = {
        sub: '',
        iss: 'http://jobscreed.com',
        permissions: '',
    };
    const jwt = njwt.create(claims, uuid.v4());
    jwt.setExpiration(new Date(0));
    const token = jwt.compact();
    new Cookies(req, res).set('access_token', token, {
        httpOnly: true,
        // secure: true
    });
    req.session.destroy();
    res.redirect('/');
});

app.post('/lp', function (req, res) {
    const input = {
        email : req.body.email,
        lostToken : randomToken(64),
    };
    dbhandler.getitem(input, function (result) {
        if (result === "NotExist") {
            res.send("NotExist");
        }
        else {
            dbhandler.storeLostToken(input, function (result2) {
                res.send(result2);
            });
        }
    });
});

app.post('/fp', function (req, res) {
    const input = {
        email : req.body.email,
        token : req.body.token,
        password : md5(sha256(md5(req.body.password)))
    };
    dbhandler.getitem(input, function (result) {
        if (result === "NotExist") {
            res.send("NotExist");
        }
        else if (result.lostToken === undefined) {
            res.send("TokenUndefined");
        }
        else if(result.lostToken !== input.token) {
            res.send("InvalidToken");
        }
        else {
            dbhandler.resetPassword(input, function (result2) {
                res.send(result2);
            });
        }
    });
});

app.post('/uploadProfilePhoto', function (req, res) {
    const bucketParams = {
        Bucket: req.session.uid,
        ACL: 'private'
    };
    s3.createBucket(bucketParams, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        else {
            const policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AddPerm",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": "arn:aws:s3:::" + req.session.uid + "/*"
                    }
                ]
            };
            s3.putBucketPolicy({Bucket: req.session.uid, Policy: JSON.stringify(policy)}, function (err1, data1) {
                if (err1) {
                    console.log(err1, err1.stack);
                }
            });
        }
        const form = new formidable.IncomingForm();
        form.multiples = false;
        form.uploadDir = path.join(__dirname, '/public/images');

        let fileName = "";
        form.on('file', function (field, file) {
            fs.rename(file.path, path.join(form.uploadDir, file.name));
            fileName = file.name;
        });
        form.on('error', function (err1) {
            console.log(err1, err1.stack);
        });

        form.on('end', function () {
            const buffer = fs.readFileSync(path.join(__dirname, '/public/images/' + fileName));
            const uploadParams = {
                Bucket: req.session.uid,
                Key: Date.now().toString() + 'ProfilePic.png',
                Body: buffer,
                ContentType: 'image/png'
            };
            s3.upload(uploadParams, function (err1, data1) {
                if (err1) {
                    console.log(err1, err1.stack);
                }
                else {
                    fs.unlink(__dirname + '/public/images/' + fileName, function (err2) {
                        if (err2) {
                            console.log(err2, err2.stack);
                        }
                    });
                    const input = {
                        email: req.session.email,
                        photoURL : data1.Location
                    };
                    dbhandler.updatePhotoURL(input, function (result) {
                        res.send(result.photoURL);
                    });
                }
            });
        });
        form.parse(req);
    });
});

app.get('/removeProfilePhoto', function (req, res) {
    dbhandler.getitem({email: req.session.email}, function (result) {
        let ppPath = '/images/profileImages/female.png';
        if (result.gender === 'Male') {
            ppPath = '/images/profileImages/male.png';
        }
        const input = {
            email: req.session.email,
            photoURL : ppPath
        };
        dbhandler.updatePhotoURL(input, function (result1) {
            res.send(result1.photoURL);
        });
    });
});

app.get('/searchUsers', function (req, res) {
    const str = url.parse(req.url, true).query;
    dbhandler.searchUsers({searchkey: str.searchkey}, function (result) {
        res.send(result);
    });
});
// Search Users End

// Check Connection Status Start
app.post('/check-connection', function (req, res) {
    const input = {
        authProfile: req.session.uid,
        requestProfile : req.session.requestUser.uid
    };
    const status = {
        connection: "",
        invitation: "",
        invitationByOtherUser: ""
    };
    dbhandler.checkConnection(input, function (result) {
        status.connection = result;

        dbhandler.checkInvitation(input, function (result1) {
            status.invitation = result1;

            dbhandler.checkInvitationByOtherUser(input, function (result2) {
                status.invitationByOtherUser = result2;
                res.send(status);
            });
        });
    });
});

app.get('/get-all-invitations', function (req, res) {
    dbhandler.getAllInvitations({uid: req.session.uid}, function (result) {
        res.send(result);
    })
});

app.post('/send-connection-request', function (req, res) {
    const input = {
        authProfile: req.session.uid,
        requestProfile : req.session.requestUser.uid
    };
    dbhandler.requestToConnect(input, function (result) {
        res.send('Success');
    });
});

app.post('/confirm-connection-request', function (req, res) {
    const input = {
        authProfile: req.session.uid,
        requestProfile : req.body.uid,
        authProfileName: req.session.name,
        authphotoURL: req.session.photoURL,
        time: req.body.time,
        timeInSec: req.body.timeInSec
    };
    if (req.session.requestUser !== undefined && req.session.requestUser.uid !== undefined) {
        input.requestProfile = req.session.requestUser.uid;
    }
    dbhandler.confirmConnectionRequest(input, function (result) {
        res.send('Success');
    });
});

app.post('/remove-connection-request', function (req, res) {
    const input = {
        authProfile: req.session.uid,
        requestProfile : req.body.uid
    };
    if (req.session.requestUser !== undefined && req.session.requestUser.uid !== undefined) {
        input.requestProfile = req.session.requestUser.uid;
    }
    dbhandler.removeConnectionRequest(input, function (result) {
        res.send('Success');
    });
});

app.post('/remove-connection', function (req, res) {
    const input = {
        authProfile: req.session.uid,
        requestProfile : req.session.requestUser.uid
    };
    dbhandler.removeConnection(input, function (result) {
        res.send('Success');
    });
});

app.get('/get-notifications', function (req, res) {
    dbhandler.getNotifications({authProfile: req.session.uid}, function (result) {
        res.send(result);
    })
});

app.post('/change-notification-status', function (req, res) {
    const input = {
        uid: req.body.uid,
        notificationList: req.body.notificationList
    };
    dbhandler.changeNotificationStatus(input, function (result) {
        res.send(result);
    });
});

io.on('connection', function (socket) {
    var onlineUsersMap = new Map();
    var onlineUsersMapUID = new Map();
    var obj = io.sockets.clients().sockets;
    for (let i = 0; i < Object.keys(obj).length; i++) {
        if (obj[Object.keys(obj)[i]].handshake.session.email !== socket.handshake.session.email) {
            onlineUsersMap.set(obj[Object.keys(obj)[i]].handshake.session.email, i);
            onlineUsersMapUID.set(obj[Object.keys(obj)[i]].handshake.session.uid, i);
        }
    }

    var connectionsOnline = [];
    dbhandler.getAllConnections({
        uid: socket.handshake.session.uid
    }, function (connectionsInfo) {
        for (let i = 0; i < connectionsInfo.length; i++) {

            if (onlineUsersMap.has(connectionsInfo[i].email)) {
                let pos = onlineUsersMap.get(connectionsInfo[i].email);
                connectionsOnline.push({
                    id: obj[Object.keys(obj)[pos]].conn.id,
                    name: connectionsInfo[i].name,
                    email: connectionsInfo[i].email,
                    uid: connectionsInfo[i].uid,
                    photoURL: connectionsInfo[i].photoURL
                });
            }
        }
        io.to(socket.id).emit('already online users', connectionsOnline);
        onlineUsersMap.set(socket.handshake.session.email, Object.keys(obj).length);
        onlineUsersMapUID.set(socket.handshake.session.uid, Object.keys(obj).length);

        const userOnline = {
            id: socket.id,
            name: socket.handshake.session.name,
            email: socket.handshake.session.email,
            uid: socket.handshake.session.uid,
            photoURL: socket.handshake.session.photoURL
        };

        for (let j = 0; j < connectionsOnline.length; j++) {
            io.to(connectionsOnline[j].id).emit('user online', userOnline);
        }
    });

    socket.on('disconnect', function () {
        const userOffline = {
            name: socket.handshake.session.name,
            email: socket.handshake.session.email,
            uid: socket.handshake.session.uid,
            photoURL: socket.handshake.session.photoURL
        };
        onlineUsersMap.delete(socket.handshake.session.email);
        onlineUsersMapUID.delete(socket.handshake.session.uid);
        socket.broadcast.emit('user offline', userOffline);
    });

    socket.on('new message', function (messageObject) {
        messageObject.from = socket.handshake.session.uid;
        messageObject.chattingWithName = socket.handshake.session.name;
        messageObject.chattingWithID = socket.handshake.session.uid;
        messageObject.chattingWithPhotoURL = socket.handshake.session.photoURL;

        if (messageObject.socketID !== "") {
            io.to(messageObject.socketID).emit('new message', messageObject);
        }
        else {
            socket.emit('user offline put data', messageObject);
        }
    });
});

app.post('/add-chat', function (req, res) {
    var from = req.body.from;
    if (req.body.from === "") {
        from = req.session.uid;
    }
    var uid = req.session.uid;
    if (req.body.uid !== undefined) {
        uid = req.body.uid;
    }
    const input = {
        uid: uid,
        chattingWithID: req.body.chattingWithID,
        chattingWithName: req.body.chattingWithName,
        chattingWithPhotoURL: req.body.chattingWithPhotoURL,
        from: from,
        message: req.body.message,
        status: req.body.status,
        time: req.body.time,
        timeInSec: req.body.timeInSec
    };
    dbhandler.putChatConversation(input, function (result) {
        res.send(result);
    });
});

app.get('/get-all-chats', function (req, res) {
    dbhandler.getChatConversations({uid: req.session.uid}, function (result) {
        res.send(result);
    })
});

app.post('/update-message-read-status', function (req, res) {
    const input = {
        uid: req.session.uid,
        chattingWithID: req.body.chattingWithID,
        chattingWithName: req.body.chattingWithName,
        chattingWithPhotoURL: req.body.chattingWithPhotoURL,
        chatList: req.body.chatList
    };
    dbhandler.updateMessageReadStatus(input, function (result) {
        res.send(result);
    });
});

app.post('/delete-account', function (req, res) {
    dbhandler.deleteAccount({
        email: req.session.email,
        uid: req.session.uid
    }, function (result) {
        const claims = {
            sub: '',
            iss: 'http://jobscreed.com',
            permissions: '',
        };
        const jwt = njwt.create(claims, uuid.v4());
        jwt.setExpiration(new Date(0));
        const token = jwt.compact();
        new Cookies(req, res).set('access_token', token, {
            httpOnly: true,
            // secure: true
        });
        req.session.destroy();
        res.send(result);
    });
});

app.post('/update-account-settings', function (req, res) {
    const input = req.body.newSettings;
    var query = "MATCH (user:Person {email: '" + req.session.email + "'}) SET ";
    for (let i = 0; i < input.length; i += 2) {
        if (i == input.length - 2) {
            query += "user." + input[i] + " = '" + input[i + 1] + "' ";
        }
        else {
            query += "user." + input[i] + " = '" + input[i + 1] + "', ";
        }
    }
    query += "RETURN user";
    dbhandler.updateAccountSettings(query, function (result) {
        res.send("Updated");
    });
});

app.post('/get-user-info', function (req, res) {
    dbhandler.getProfile({uid: req.body.uid}, function (result) {
        const userInfo = {
            university: result['university'],
            company: result['company'],
            residence: result['residence'],
            hometown: result['hometown'],
            dob: result['dob']
        };
        res.send(userInfo);
    });
});

app.post('/add-blog', function (req, res) {
    const input = {
        uid: req.session.uid,
        name: req.session.name,
        photoURL: req.session.photoURL,
        blogTitle: req.body.blogTitle,
        blogInput: req.body.blogInput,
        time: req.body.time,
        timeInSec: req.body.timeInSec
    };
    dbhandler.addBlog(input, function (result) {
        res.send('Success');
    });
});

app.get('/get-all-connections-uid', function (req, res) {
    dbhandler.getAllConnections({uid: req.session.uid}, function (connections) {
        var blogs = [];
        blogs.push(req.session.uid);
        for (let i = 0; i < connections.length; i++) {
            blogs.push(connections[i].uid);
        }
        res.send(blogs);
    });
});

app.post('/get-all-blogs', function (req, res) {
    dbhandler.getAllBlogs({uid: req.body.uid}, function (result) {
        res.send(result);
    });
});

app.post('/update-blogs', function (req, res) {
    dbhandler.updateBlogs({
        uid: req.body.uid,
        blogList: req.body.blogList
    }, function (result) {
        res.send(result);
    });
});

module.exports = {
    app: app,
    server: server
};
