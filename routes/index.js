const express = require('express');
const router = express.Router();
const url = require('url');
const dbhandler = require('../dbhandler');
const Cookies = require('cookies');
const uuid = require('uuid');
const njwt = require('njwt');

const appleTouchIcons = [
    {size: '57x57', path: 'favicons/apple-icon-57x57.png'},
    {size: '60x60', path: 'favicons/apple-icon-60x60.png'},
    {size: '72x72', path: 'favicons/apple-icon-72x72.png'},
    {size: '76x76', path: 'favicons/apple-icon-76x76.png'},
    {size: '114x114', path: 'favicons/apple-icon-114x114.png'},
    {size: '120x120', path: 'favicons/apple-icon-120x120.png'},
    {size: '144x144', path: 'favicons/apple-icon-144x144.png'},
    {size: '152x152', path: 'favicons/apple-icon-152x152.png'},
    {size: '180x180', path: 'favicons/apple-icon-180x180.png'}
];

const icons = [
    {size: '192x192', path: 'favicons/android-icon-192x192.png'},
    {size: '32x32', path: 'favicons/favicon-32x32.png'},
    {size: '96x96', path: 'favicons/favicon-96x96.png'},
    {size: '16x16', path: 'favicons/favicon-16x16.png'}
];

const secretKey = uuid.v4();

router.get('/', function (req, res, next) {
    const token = new Cookies(req, res).get('access_token');
    njwt.verify(token, secretKey, function (err, result) {
        if (err) {
            res.render('index', {
                title: 'JobsCreed',
                professionList: ['Accountant', 'Architect', 'Book Publisher', 'Businessman', 'Computer Programmer', 'Consultant', 'Data Analyst', 'Developer', 'Doctor', 'Engineer', 'Fashion Designer', 'Financial Advisor', 'Government Officer', 'Lawyer', 'Manager', 'Nurse', 'Professional Artist', 'Sales', 'Scientist', 'Student', 'Teacher', 'Web Designer', 'Writer/Editor'],
                socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                carouselSliders: [
                    {class: 'item active', image: 'images/sliders/building.jpg', alt: 'building', heading: 'DEDICATION TO WORK'},
                    {class: 'item', image: 'images/sliders/career.jpg', alt: 'career', heading: 'BOOST YOUR CAREER'},
                    {class: 'item', image: 'images/sliders/binary.jpg', alt: 'binary', heading: 'PASSION TO DEVELOP'}
                ],
                cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/index.css'],
                jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/forms.js'],
                appleTouchIcons: appleTouchIcons,
                icons: icons
            });
        }
        else {
            dbhandler.getProfile({uid: result.body.sub}, function (result1) {
                if (result1 === "NotExist") {
                    res.send("NotExist");
                }
                else {
                    dbhandler.getAllConnections({uid: req.session.uid}, function (connectionsInfo) {
                        res.render('home', {
                            title: result1.name,
                            cssPaths: ['http://jobscreed.com/stylesheets/toolkit.css', 'http://jobscreed.com/stylesheets/application.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/topbar.css', 'http://jobscreed.com/stylesheets/home.css'],
                            jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'http://jobscreed.com/socket.io/socket.io.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/typeahead.bundle.min.js', 'http://jobscreed.com/javascripts/crypto-js/crypto-js.js', 'http://jobscreed.com/javascripts/tether.min.js', 'http://jobscreed.com/javascripts/chart.js', 'http://jobscreed.com/javascripts/toolkit.js', 'http://jobscreed.com/javascripts/application.js', 'http://jobscreed.com/javascripts/topbar.js', 'http://jobscreed.com/javascripts/home.js'],
                            appleTouchIcons: appleTouchIcons,
                            icons: icons,
                            photoURL: result1.photoURL,
                            dob: result1.dob,
                            profession: result1.profession,
                            connectionsInfo: connectionsInfo,
                            connectionsCount: connectionsInfo.length,
                            uid: req.session.uid
                        });
                    });
                }
            });
        }
    });
});

router.get('/verify', function (req, res, next) {
    const str = url.parse(req.url, true).query;
    if (str.email === undefined || str.token === undefined) {
        res.send('Cannot GET /verify');
    }
    else {
        const input = {
            email: str.email,
            token: str.token
        };

        dbhandler.getitem(input, function (result) {
            if (result === "NotExist") {
                res.render('verify', {
                    title: 'Account Verification',
                    socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                    cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
                    jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js'],
                    alertClass: 'alert-danger',
                    faClass: 'fa-exclamation-circle',
                    output: ' Invalid Email ID.',
                    appleTouchIcons: appleTouchIcons,
                    icons: icons
                });
            }
            else {
                if (result.verified === true) {
                    res.render('verify', {
                        title: 'Account Verification',
                        socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                        cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
                        jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js'],
                        alertClass: 'alert-info',
                        faClass: 'fa-check',
                        output: ' Account already verified.',
                        appleTouchIcons: appleTouchIcons,
                        icons: icons
                    });
                }
                else {
                    if(result.token !== input.token) {
                        res.render('verify', {
                            title: 'Account Verification',
                            socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                            cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
                            jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js'],
                            alertClass: 'alert-danger',
                            faClass: 'fa-exclamation-circle',
                            output: ' Invalid Token.',
                            appleTouchIcons: appleTouchIcons,
                            icons: icons
                        });
                    }
                    else {
                        dbhandler.updateVerifyState(input, function (result2) {
                            res.render('verify', {
                                title: 'Account Verification',
                                socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                                cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
                                jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js'],
                                alertClass: 'alert-success',
                                faClass: 'fa-check',
                                output: ' Account verified.',
                                appleTouchIcons: appleTouchIcons,
                                icons: icons
                            });
                        });
                    }
                }
            }
        });
    }
});

router.get('/lp', function (req, res, next) {
    const token = new Cookies(req, res).get('access_token');
    njwt.verify(token, secretKey, function (err, result) {
        if (err) {
            res.render('lostPassword', {
                title: 'Reset Password',
                socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
                jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/lostPassword.js'],
                appleTouchIcons: appleTouchIcons,
                icons: icons
            });
        }
        else {
            res.redirect('/profile?uid=' + result.body.sub);
        }
    });
});

router.get('/fp', function (req, res, next) {
    const str = url.parse(req.url, true).query;
    if (str.email === undefined || str.token === undefined) {
        res.send('Cannot GET /fp');
    }
    else {
        res.render('resetPassword', {
            title: 'Reset Password',
            cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css'],
            jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/resetPassword.js'],
            appleTouchIcons: appleTouchIcons,
            icons: icons
        });
    }
});

router.get('/profile', function (req, res) {
    const str = url.parse(req.url, true).query;
    if (str.uid === undefined) {
        res.send('Cannot GET /profile');
    }
    else {
        dbhandler.getProfile({uid: str.uid}, function (result) {
            if (result === "NotExist") {
                res.send("NotExist");
            }
            else {
                const token = new Cookies(req, res).get('access_token');
                njwt.verify(token, secretKey, function (err1, result1) {
                    if (err1) {
                        res.render('profileStatic', {
                            title: result.name,
                            cssPaths: ['https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/toolkit.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/profileStatic.css'],
                            jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/forms.js'],
                            appleTouchIcons: appleTouchIcons,
                            icons: icons,
                            professionList: ['Student', 'Developer', 'Manager', 'Businessman'],
                            socialMediaFA: ['fa-facebook', 'fa-twitter', 'fa-linkedin'],
                            photoURL: result.photoURL,
                            dob: result.dob,
                            profession: result.profession
                        });
                    }
                    else {
                        if (req.session.uid != str.uid) {
                            req.session.requestUser = {};
                            req.session.requestUser.uid = str.uid;
                            req.session.requestUser.name = result.name;
                            req.session.requestUser.email = result.email;

                            res.render('profileSearch', {
                                title: result.name,
                                cssPaths: ['http://jobscreed.com/stylesheets/toolkit.css', 'http://jobscreed.com/stylesheets/application.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/topbar.css', 'http://jobscreed.com/stylesheets/profileSearch.css'],
                                jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'http://jobscreed.com/socket.io/socket.io.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/crypto-js/crypto-js.js', 'http://jobscreed.com/javascripts/typeahead.bundle.min.js', 'http://jobscreed.com/javascripts/tether.min.js', 'http://jobscreed.com/javascripts/chart.js', 'http://jobscreed.com/javascripts/toolkit.js', 'http://jobscreed.com/javascripts/application.js', 'http://jobscreed.com/javascripts/topbar.js', 'http://jobscreed.com/javascripts/profileSearch.js'],
                                appleTouchIcons: appleTouchIcons,
                                icons: icons,
                                photoURL: result.photoURL,
                                dob: result.dob,
                                profession: result.profession,
                                uid: req.session.uid,
                                email: result.email,
                                requestUID: result.uid
                            });
                        }
                        else {
                            res.render('profile', {
                                title: result.name,
                                cssPaths: ['http://jobscreed.com/stylesheets/toolkit.css', 'http://jobscreed.com/stylesheets/application.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/topbar.css', 'http://jobscreed.com/stylesheets/profile.css'],
                                jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'https://www.indeed.com/ads/jobroll-widget-v3.js', 'http://jobscreed.com/socket.io/socket.io.js', 'http://jobscreed.com/javascripts/crypto-js/crypto-js.js', 'http://jobscreed.com/javascripts/findJobs.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/typeahead.bundle.min.js', 'http://jobscreed.com/javascripts/tether.min.js', 'http://jobscreed.com/javascripts/chart.js', 'http://jobscreed.com/javascripts/toolkit.js', 'http://jobscreed.com/javascripts/application.js', 'http://jobscreed.com/javascripts/topbar.js', 'http://jobscreed.com/javascripts/profile.js'],
                                appleTouchIcons: appleTouchIcons,
                                icons: icons,
                                photoURL: result.photoURL,
                                profession: result.profession,
                                uid: req.session.uid
                            });
                        }
                    }
                });
            }
        });
    }
});

router.get('/notifications', function (req, res) {
    const token = new Cookies(req, res).get('access_token');
    njwt.verify(token, secretKey, function (err1, result1) {
        if (err1) {
            res.send('Cannot GET /notifications');
        }
        else {
            dbhandler.getProfile({uid: result1.body.sub}, function (result) {
                if (result === "NotExist") {
                    res.send("NotExist");
                }
                else {
                    dbhandler.getAllConnections({uid: req.session.uid}, function (connections) {
                        res.render('notifications', {
                            title: result.name,
                            cssPaths: ['http://jobscreed.com/stylesheets/toolkit.css', 'http://jobscreed.com/stylesheets/application.css', 'http://jobscreed.com/stylesheets/jqueryUI.css', 'http://jobscreed.com/stylesheets/jquery-ui.structure.min.css', 'http://jobscreed.com/stylesheets/jqueryUITheme.css', 'http://jobscreed.com/stylesheets/font-awesome.min.css', 'http://jobscreed.com/stylesheets/topbar.css', 'http://jobscreed.com/stylesheets/notifications.css'],
                            jsPaths: ['https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', 'http://jobscreed.com/socket.io/socket.io.js', 'http://jobscreed.com/javascripts/jquery-ui.min.js', 'http://jobscreed.com/javascripts/crypto-js/crypto-js.js', 'http://jobscreed.com/javascripts/typeahead.bundle.min.js', 'http://jobscreed.com/javascripts/tether.min.js', 'http://jobscreed.com/javascripts/chart.js', 'http://jobscreed.com/javascripts/toolkit.js', 'http://jobscreed.com/javascripts/application.js', 'http://jobscreed.com/javascripts/topbar.js', 'http://jobscreed.com/javascripts/notifications.js'],
                            appleTouchIcons: appleTouchIcons,
                            icons: icons,
                            photoURL: result.photoURL,
                            uid: req.session.uid,
                            connections: connections,
                        });
                    });
                }
            });
        }
    });
});

module.exports = {
    router: router,
    secretKey: secretKey,
};