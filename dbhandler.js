const neo4j = require('neo4j-driver').v1;
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-west-2"
});

const dynamodb = new AWS.DynamoDB({endpoint: "https://dynamodb.us-west-2.amazonaws.com"});
const ses = new AWS.SES({endpoint: "https://email.us-west-2.amazonaws.com"});

const driver = neo4j.driver("bolt://hobby-cigccaohojekgbkeenajpcol.dbs.graphenedb.com:24786", neo4j.auth.basic("jobscreed", "b.yF4RVnHdRWXm.5XlJD03131u5IFIf"));

module.exports = {

    putitem: function (newuser, callback) {
        var query = "MATCH (user:Person {email: '" + newuser.email + "'}) RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    query = "CREATE (user:Person {name: '" + newuser.name + "', " +
                        "email: '" + newuser.email + "', " +
                        "password: '" + newuser.password + "', " +
                        "contact: '" + newuser.contact + "', " +
                        "gender: '" + newuser.gender + "', " +
                        "profession: '" + newuser.profession + "', " +
                        "uid: '" + newuser.uid + "', " +
                        "dob: '" + newuser.dob + "', " +
                        "token: '" + newuser.token + "', " +
                        "photoURL: '" + newuser.photoURL + "', " +
                        "verified: '" + newuser.verified + "'}) " +
                        "RETURN user";
                    const sess = driver.session();
                    sess.run(query)
                        .then(function (result1) {
                            const subject = "Account Verification on JobsCreed";
                            const verificationLink = "http://jobscreed.com/verify?email=" + encodeURIComponent(newuser.email) + "&token=" + newuser.token;
                            const params = {
                                Destination: {ToAddresses: [newuser.email]},
                                Message: {
                                    Body: {
                                        Html: {
                                            Data: '<html><head>'
                                            + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
                                            + '<title>' + subject + '</title>'
                                            + '</head><body>'
                                            + 'Please <a href="' + verificationLink + '">click here to verify your email address</a> or copy & paste the following link in a browser :'
                                            + '<br><br>'
                                            + '<a href="' + verificationLink + '">' + verificationLink + '</a><br><br>'
                                            + 'Do not reply to this mail. This is a computer generated email.'
                                            + '</body></html>',
                                            Charset: "utf-8"
                                        },
                                        Text: {
                                            Data: "Email Verification",
                                            Charset: "utf-8"
                                        }
                                    },
                                    Subject: {
                                        Data: subject,
                                        Charset: "utf-8"
                                    }
                                },
                                Source: "no-reply@jobscreed.com",
                                SourceArn: "arn:aws:ses:us-west-2:921720508836:identity/jobscreed.com"
                            };
                            ses.sendEmail(params, function (err, data) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            callback(result1.records[0]._fields[0].properties);
                            sess.close();
                        })
                        .catch(function (error1) {
                            console.log(error1);
                        });
                }
                else {
                    callback("ConditionalCheckFailedException");
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    getitem: function (user, callback) {
        const query = "MATCH (user:Person {email: '" + user.email + "'}) RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    callback("NotExist");
                }
                else {
                    callback(result.records[0]._fields[0].properties);
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    updateVerifyState: function (input, callback) {
        const query = "MATCH (user:Person {email: '" + input.email + "'}) " +
            "SET user.verified = 'true' " +
            "REMOVE user.token " +
            "RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback(result.records[0]._fields[0].properties);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    storeLostToken: function (input, callback) {
        const query = "MATCH (user:Person {email: '" + input.email + "'}) SET user.lostToken = '" + input.lostToken + "' RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                const subject = "Reset Password Request";
                const lostLink = "http://jobscreed.com/fp?email=" + encodeURIComponent(input.email) + "&token=" + input.lostToken;
                const params = {
                    Destination: {ToAddresses: [input.email]},
                    Message: {
                        Body: {
                            Html: {
                                Data: '<html><head>'
                                + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
                                + '<title>' + subject + '</title>'
                                + '</head><body>'
                                + 'Please <a href="' + lostLink + '">click here to reset your password</a> or copy & paste the following link in a browser :'
                                + '<br><br>'
                                + '<a href="' + lostLink + '">' + lostLink + '</a><br><br>'
                                + 'Do not reply to this mail. This is a computer generated email.'
                                + '</body></html>',
                                Charset: "utf-8"
                            },
                            Text: {
                                Data: "Reset Passworod Request Email",
                                Charset: "utf-8"
                            }
                        },
                        Subject: {
                            Data: subject,
                            Charset: "utf-8"
                        }
                    },
                    Source: "no-reply@jobscreed.com",
                    SourceArn: "arn:aws:ses:us-west-2:921720508836:identity/jobscreed.com"
                };
                ses.sendEmail(params, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
                callback(result.records[0]._fields[0].properties);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    resetPassword: function (input, callback) {
        const query = "MATCH (user:Person {email: '" + input.email + "'}) " +
            "SET user.password = '" + input.password + "' " +
            "REMOVE user.lostToken " +
            "RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                const subject = "Password Changed on JobsCreed Account";
                const params = {
                    Destination: {ToAddresses: [input.email]},
                    Message: {
                        Body: {
                            Html: {
                                Data: '<html><head>'
                                + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
                                + '<title>' + subject + '</title>'
                                + '</head><body>'
                                + 'Password successfully changed on your JobsCreed account.'
                                + '<br><br>'
                                + 'Do not reply to this mail. This is a computer generated email.'
                                + '</body></html>',
                                Charset: "utf-8"
                            },
                            Text: {
                                Data: "Password Changed Email",
                                Charset: "utf-8"
                            }
                        },
                        Subject: {
                            Data: subject,
                            Charset: "utf-8"
                        }
                    },
                    Source: "no-reply@jobscreed.com",
                    SourceArn: "arn:aws:ses:us-west-2:921720508836:identity/jobscreed.com"
                };
                ses.sendEmail(params, function (err, data2) {
                    if (err) {
                        console.log(err);
                    }
                });
                callback(result.records[0]._fields[0].properties);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    getProfile: function (user, callback) {
        const query = "MATCH (user:Person {uid: '" + user.uid + "'}) RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    callback("NotExist");
                }
                else {
                    callback(result.records[0]._fields[0].properties);
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    updatePhotoURL: function (input, callback) {
        const query = "MATCH (user:Person {email: '" + input.email + "'}) " +
            "SET user.photoURL = '" + input.photoURL + "' " +
            "RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback(result.records[0]._fields[0].properties);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    searchUsers: function (input, callback) {
        const query = "MATCH (user:Person) WHERE user.name=~ '(?i).*" + input.searchkey + ".*' RETURN user";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                const users = [];
                for (let i = 0; i < result.records.length; i++) {
                    users[i] = {
                        name: result.records[i]._fields[0].properties.name,
                        email: result.records[i]._fields[0].properties.email,
                        uid: result.records[i]._fields[0].properties.uid
                    };
                }
                callback(JSON.stringify(users));
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    requestToConnect: function (input, callback) {
        const query = "MATCH (a:Person),(b:Person) " +
            "WHERE a.uid = '" + input.authProfile + "' " +
            "AND b.uid = '" + input.requestProfile + "' " +
            "CREATE UNIQUE (a)-[r:ConnectionRequest]->(b) " +
            "RETURN r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback("Success");
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    confirmConnectionRequest: function (input, callback) {
        var query = "MATCH (a:Person),(b:Person) " +
            "WHERE a.uid = '" + input.authProfile + "' " +
            "AND b.uid = '" + input.requestProfile + "' " +
            "CREATE UNIQUE (a)-[r1:Connection]->(b) " +
            "CREATE UNIQUE (b)-[r2:Connection]->(a) " +
            "RETURN r1, r2";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                query = "MATCH (a {uid:'" + input.authProfile + "'})-[r:ConnectionRequest]-(b {uid:'" + input.requestProfile + "'}) " +
                    "DELETE r";
                const sess = driver.session();
                sess.run(query)
                    .then(function (result1) {
                        dynamodb.updateItem({
                            'TableName': 'Notifications',
                            'Key': {
                                'uid': {'S': input.requestProfile}
                            },
                            'UpdateExpression': 'SET notificationList = list_append(notificationList, :notificationVal)',
                            'ExpressionAttributeValues': {
                                ':notificationVal': {'L': [{'M': {'name': {'S': input.authProfileName}, 'uid': {'S': input.authProfile}, 'status': {'S': 'unread'}, 'photoURL': {'S': input.authphotoURL}, 'time': {'S': input.time}, 'timeInSec': {'S': input.timeInSec}}}]}
                            },
                            'ReturnValues': 'UPDATED_NEW'
                        }, function (err, data) {
                            if (err) {
                                dynamodb.updateItem({
                                    'TableName' : 'Notifications',
                                    'Key': {
                                        'uid': {'S': input.requestProfile}
                                    },
                                    'AttributeUpdates' : {
                                        'notificationList' : {
                                            'Action' : 'PUT',
                                            'Value': {'L': [{'M': {'name': {'S': input.authProfileName}, 'uid': {'S': input.authProfile}, 'status': {'S': "unread"}, 'photoURL': {'S': input.authphotoURL}, 'time': {'S': input.time}, 'timeInSec': {'S': input.timeInSec}}}]}
                                        }
                                    }
                                }, function (err1, data1) {
                                    if(err1) {
                                        console.log(err1);
                                    }
                                    else {
                                        callback("NotificationSent");
                                    }
                                });
                            }
                            else {
                                callback("NotificationSent");
                            }
                        });
                        sess.close();
                    })
                    .catch(function (error1) {
                        console.log(error1);
                    });
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    removeConnectionRequest: function (input, callback) {
        const query = "MATCH (a {uid:'" + input.authProfile + "'})-[r:ConnectionRequest]-(b {uid:'" + input.requestProfile + "'}) " +
            "DELETE r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback("Success");
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });

    },

    removeConnection: function (input, callback) {
        const query = "MATCH (a {uid:'" + input.authProfile + "'})-[r:Connection]-(b {uid:'" + input.requestProfile + "'}) " +
            "DELETE r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback("Success");
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    checkConnection: function (input, callback) {
        const query = "MATCH (a {uid:'" + input.authProfile + "'})-[r:Connection]-(b {uid:'" + input.requestProfile + "'}) RETURN r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    callback("NoConnection");
                }
                else {
                    callback("Connected");
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    checkInvitation: function (input, callback) {
        const query = "MATCH (a {uid:'" + input.authProfile + "'})-[r:ConnectionRequest]->(b {uid:'" + input.requestProfile + "'}) RETURN r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    callback("NoConnectionRequest");
                }
                else {
                    callback("ConnectionRequested");
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    checkInvitationByOtherUser: function (input, callback) {
        const query = "MATCH (a {uid:'" + input.authProfile + "'})<-[r:ConnectionRequest]-(b {uid:'" + input.requestProfile + "'}) RETURN r";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                if (result.records.length === 0) {
                    callback("NoConnectionRequestByOtherUser");
                }
                else {
                    callback("ConnectionRequestedByOtherUser");
                }
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    getAllConnections: function (input, callback) {
        const query = "MATCH (n {uid:'" + input.uid + "'})-[r:Connection]->(c) " +
            "RETURN {name: c.name, uid: c.uid, photoURL: c.photoURL, email: c.email}";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                var connections = [];
                for (let i = 0; i < result.records.length; i++) {
                    connections.push(result.records[i]._fields[0]);
                }
                function sortFunction(a, b) {
                    a = a.name;
                    b = b.name;
                    return (a === b) ? 0 : (a < b) ? -1 : 1;
                }
                connections.sort(sortFunction);
                callback(connections);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    getAllInvitations: function (input, callback) {
        const query = "MATCH (n {uid:'" + input.uid + "'})<-[r:ConnectionRequest]-(c) " +
            "RETURN {name: c.name, uid: c.uid, photoURL: c.photoURL, email: c.email}";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback(result.records);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    getNotifications: function (input, callback) {
        dynamodb.getItem({
            'TableName': 'Notifications',
            'Key': {'uid': {'S': input.authProfile}},
        }, function (err, data) {
            if(err) {
                console.log(err);
            }
            else {
                callback(data);
            }
        });
    },

    changeNotificationStatus: function (input, callback) {
        dynamodb.updateItem({
            'TableName' : 'Notifications',
            'Key': {
                'uid': {'S': input.uid}
            },
            'AttributeUpdates' : {
                'notificationList' : {
                    'Action' : 'PUT',
                    'Value': {'L': input.notificationList}
                }
            }
        }, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                callback(data);
            }
        });
    },

    putChatConversation: function (input, callback) {
        dynamodb.updateItem({
            'TableName': 'Chats',
            'Key': {
                'uid': {'S': input.uid}
            },
            'UpdateExpression': 'SET #MESSAGEID.chatList = list_append(#MESSAGEID.chatList, :messageVal)',
            'ExpressionAttributeNames': {
                '#MESSAGEID': input.chattingWithID
            },
            'ExpressionAttributeValues': {
                ':messageVal': {'L': [{'M': {'from': {'S': input.from}, 'message': {'S': input.message}, 'status': {'S': input.status}, 'timeInSec': {'S': input.timeInSec}, 'time': {'S': input.time}}}]}
            },
            'ReturnValues': 'UPDATED_NEW'
        }, function (err, data) {
            if (err) {
                dynamodb.updateItem({
                    'TableName' : 'Chats',
                    'Key': {
                        'uid': {'S': input.uid}
                    },
                    'AttributeUpdates' : {
                        [input.chattingWithID] : {
                            'Action' : 'PUT',
                            'Value': {'M': {'chatList': {'L': [{'M': {'from': {'S': input.from}, 'message': {'S': input.message}, 'status': {'S': input.status}, 'timeInSec': {'S': input.timeInSec}, 'time': {'S': input.time}}}]}, 'name': {'S': input.chattingWithName}, 'uid': {'S': input.chattingWithID}, 'photoURL': {'S': input.chattingWithPhotoURL}}}
                        }
                    }
                }, function (err1, data1) {
                    if(err1) {
                        console.log(err1);
                    }
                    else {
                        callback(true);
                    }
                });
            }
            else {
                callback(false);
            }
        });
    },

    getChatConversations: function (input, callback) {
        dynamodb.getItem({
            'TableName': 'Chats',
            'Key': {'uid': {'S': input.uid}},
        }, function (err, data) {
            if(err) {
                callback("NoChats");
            }
            else {
                callback(data);
            }
        });
    },

    updateMessageReadStatus: function (input, callback) {
        dynamodb.updateItem({
            'TableName' : 'Chats',
            'Key': {
                'uid': {'S': input.uid}
            },
            'AttributeUpdates' : {
                [input.chattingWithID] : {
                    'Action' : 'PUT',
                    'Value': {'M': {'chatList': {'L': input.chatList}, 'name': {'S': input.chattingWithName}, 'uid': {'S': input.chattingWithID}, 'photoURL': {'S': input.chattingWithPhotoURL}}}
                }
            }
        }, function (err, result) {
            if (err) {
                console.log(err);
            }
            else {
                callback(result);
            }
        });
    },

    deleteAccount: function (input, callback) {
        var query = "MATCH (user:Person {email: '" + input.email + "'})-[relationships]-() DELETE relationships";
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                query = "MATCH (user:Person {email: '" + input.email + "'}) DELETE user";
                const sess = driver.session();
                sess.run(query)
                    .then(function (result1) {
                        dynamodb.deleteItem({
                            'TableName' : 'Chats',
                            'Key': {
                                'uid': {'S': input.uid}
                            }
                        }, function (err2, result2) {
                            if (err2) {
                                console.log(err2);
                            }
                            dynamodb.deleteItem({
                                'TableName' : 'Notifications',
                                'Key': {
                                    'uid': {'S': input.uid}
                                }
                            }, function (err3, result3) {
                                if (err3) {
                                    console.log(err3);
                                }
                                dynamodb.deleteItem({
                                    'TableName' : 'Blogs',
                                    'Key': {
                                        'uid': {'S': input.uid}
                                    }
                                }, function (err4, result4) {
                                    if (err4) {
                                        console.log(err4);
                                    }
                                    else {
                                        callback("Account Deleted");
                                    }
                                });
                            });
                        });
                        sess.close();
                    })
                    .catch(function (error1) {
                        console.log(error1);
                    });
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    updateAccountSettings: function (query, callback) {
        const session = driver.session();
        session.run(query)
            .then(function (result) {
                callback(result.records[0]._fields[0].properties);
                session.close();
            })
            .catch(function (error) {
                console.log(error);
            });
    },

    addBlog: function (input, callback) {
        dynamodb.updateItem({
            'TableName': 'Blogs',
            'Key': {
                'uid': {'S': input.uid}
            },
            'UpdateExpression': 'SET blogList = list_append(blogList, :blogVal)',
            'ExpressionAttributeValues': {
                ':blogVal': {'L': [{'M': {'name': {'S': input.name}, 'uid': {'S': input.uid}, 'photoURL': {'S': input.photoURL}, 'blogTitle': {'S': input.blogTitle}, 'blogInput': {'S': input.blogInput}, 'timeInSec': {'S': input.timeInSec}, 'time': {'S': input.time}}}]}
            },
            'ReturnValues': 'UPDATED_NEW'
        }, function (err, data) {
            if (err) {
                dynamodb.updateItem({
                    'TableName' : 'Blogs',
                    'Key': {
                        'uid': {'S': input.uid}
                    },
                    'AttributeUpdates' : {
                        'blogList' : {
                            'Action' : 'PUT',
                            'Value': {'L': [{'M': {'name': {'S': input.name}, 'uid': {'S': input.uid}, 'photoURL': {'S': input.photoURL}, 'blogTitle': {'S': input.blogTitle}, 'blogInput': {'S': input.blogInput}, 'timeInSec': {'S': input.timeInSec}, 'time': {'S': input.time}}}]}
                        }
                    }
                }, function (err1, data1) {
                    if(err1) {
                        console.log(err1);
                    }
                    else {
                        callback("Success");
                    }
                });
            }
            else {
                callback("Success");
            }
        });
    },

    getAllBlogs: function (input, callback) {
        dynamodb.getItem({
            'TableName': 'Blogs',
            'Key': {'uid': {'S': input.uid}},
        }, function (err, data) {
            if(err) {
                console.log(err);
            }
            else {
                callback(data);
            }
        });
    },

    updateBlogs: function (input, callback) {
        if (input.blogList === undefined || input.blogList.length <= 0) {
            dynamodb.deleteItem({
                'TableName' : 'Blogs',
                'Key': {
                    'uid': {'S': input.uid}
                }
            }, function (err, result) {
                if (err) {
                    console.log(err);
                }
                else {
                    callback(result);
                }
            });
        }
        else {
            dynamodb.updateItem({
                'TableName' : 'Blogs',
                'Key': {
                    'uid': {'S': input.uid}
                },
                'AttributeUpdates' : {
                    'blogList' : {
                        'Action' : 'PUT',
                        'Value': {'L': input.blogList}
                    }
                }
            }, function (err, result) {
                if (err) {
                    console.log(err);
                }
                else {
                    callback(result);
                }
            });
        }
    }
};
