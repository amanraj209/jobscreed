$(document).ready(function () {

    var socket = io();

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.");
    }

    clearIndexedDB = function () {
        indexedDB.deleteDatabase("userInfo");
    };

    const users = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/searchUsers?searchkey=%QUERY',
            wildcard: '%QUERY'
        }
    });

    $("#bloodhound .typeahead").typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'users',
            display: 'name',
            source: users,
            limit: 10
        }).bind('typeahead:select', function (event, suggestion) {
            window.location.href = "/profile?uid=" + suggestion.uid;
    });

    var invitationItems = [];
    var invitationItemsLength = 0;

    confirmRequest = function (e) {
        var time = "" + new Date() + 19800 + "", timeInSec = new Date().getTime() + 19800;
        $.post('/confirm-connection-request', {
            uid: $(e).attr("id"),
            time: time,
            timeInSec: timeInSec
        }, function (data, status) {
            var lengthString = ((invitationItemsLength - 1) <= 0 ? "" : (invitationItemsLength - 1).toString());
            invitationItemsLength--;
            if (invitationItemsLength <= 0) {
                $("#invitationRequests").html('<li class="b" style="text-align: center">No Requests</li>');
            }
            $("#invitationRequestCount").html(lengthString);
            $(e).parents("li").remove();
            $("#connectionStatus").html('Remove Connection');
        });
    };


    removeRequest = function (e) {
        $.post('/remove-connection-request', {uid: $(e).attr("id")}, function (data, status) {
            var lengthString = ((invitationItemsLength - 1) === 0 ? "" : (invitationItemsLength - 1).toString());
            invitationItemsLength--;
            if (invitationItemsLength === 0) {
                $("#invitationRequests").html('<li class="b" style="text-align: center">No Requests</li>');
            }
            $("#invitationRequestCount").html(lengthString);
            $(e).parents("li").remove();
            $("#connectionStatus").html('Add Connection');
        });
    };

    $("#invitationRequests").html('<li class="b" style="text-align: center">Loading...</li>');

    $.get('/get-all-invitations', function (data, status) {
        if (data.length == 0) {
            $("#invitationRequests").html('<li class="b" style="text-align: center">No Requests</li>');
        }
        else {
            for (var i = 0; i < data.length; i++) {
                invitationItems.push('<li class="b">' +
                    '<div class="tx">' +
                    '<a class="tz" href="/profile?uid=' + data[i]._fields[0].uid + '">' +
                    '<img class="ud" src="' + data[i]._fields[0].photoURL + '">' +
                    '</a>' +
                    '<div class="ty">' +
                    '<button class="cg pv xw pm" id="' + data[i]._fields[0].uid + '" style="margin-left: 5px" onclick="confirmRequest(this)">' +
                    ' Accept Request ' +
                    '</button>' +
                    '<button class="cg ph pv xw" id="' + data[i]._fields[0].uid + '" onclick="removeRequest(this)">' +
                    ' Cancel ' +
                    '</button>' +
                    '<strong>' + data[i]._fields[0].name + '</strong>' +
                    '<p>' + data[i]._fields[0].email + '</p>' +
                    '</div>' +
                    '</div>' +
                    '</li>');
            }
            invitationItemsLength = invitationItems.length;
            $("#invitationRequestCount").html(data.length);
            $("#invitationRequests").html(invitationItems.join(''));
        }
    });

    $.get('/get-notifications', function (data, status) {
        if (data.Item !== undefined) {
            var notificationList = data.Item.notificationList.L;
            var notificationCount = 0;
            for (var i = 0; i < notificationList.length; i++) {
                if (notificationList[i].M.status.S === "unread") {
                    notificationCount++;
                }
            }
            $("#notificationCount").html((notificationCount === 0) ? "" : notificationCount.toString());
            $("#notificationCountSymbol").html((notificationCount === 0) ? "" : notificationCount.toString());
        }
        else {
            $("#notificationCount").html("");
            $("#notificationCountSymbol").html("");
        }
    });

    $("#notificationLink").click(function () {
        if ($("#notificationCount").text() !== "") {
            $("#notificationCount").html("");
            $("#notificationCountSymbol").html("");
        }
    });

    $("#notificationLinkSymbol").click(function () {
        $("#notificationLink").click();
    });

    var onlineUserMap = new Map();

    socket.on('user online', function (userOnline) {
        for (var i = 0; i < $("#online-users").children("li").length; i++) {
            if ($("#online-users").children("li")[i].attributes[1].nodeValue === userOnline.uid) {
                $("#online-users").children("li")[i].remove();
                onlineUserMap.delete(userOnline.uid);
            }
        }
        if (userOnline.email !== undefined) {
            $("#online-users").append('<li class="tx zi" id="' + userOnline.uid +'" onclick="showMessages(this)">' +
                '<a class="tz" href="/profile?uid=' + userOnline.uid + '">' +
                '<img class="ud" src="' + userOnline.photoURL + '">' +
                '</a>' +
                '<div class="ty">' +
                '<a style="text-decoration: none; color: black" href="/profile?uid=' + userOnline.uid + '"><strong>' + userOnline.name +'</strong><i class="fa fa-circle" aria-hidden="true"></i></a>' +
                '<p class="hidden-chat">' + userOnline.id + '</p>' +
                '<div class="bil">' +
                '<button class="cg pm pv" id="' + userOnline.uid + '" onclick="openChatThread(this)">' +
                'Send Message' +
                '</button>' +
                '</div>' +
                '</div>' +
                '</li>');
            onlineUserMap.set(userOnline.uid, userOnline.id);
        }
        if ($(".js-conversation").find(".hidden-chat").length <= 0 && $("#chat-id").text() === userOnline.email){
            $("#chat-socket-id").html(userOnline.id);
        }
    });

    socket.on('user offline', function (userOffline) {
        for (var i = 0; i < $("#online-users").children("li").length; i++) {
            if ($("#online-users").children("li")[i].attributes[1].nodeValue === userOffline.uid) {
                $("#online-users").children("li")[i].remove();
                onlineUserMap.delete(userOffline.uid);
            }
        }
    });

    $("#chat-list").html('<p class="b uj js-msgGroup" style="text-align: center">Loading...</p>');

    socket.on('already online users', function (onlineUsers) {
        $("#online-users").empty();
        for (var i = 0; i < onlineUsers.length; i++) {
            if (onlineUsers[i].email !== undefined) {
                $("#online-users").append('<li class="tx zi" id="' + onlineUsers[i].uid +'" onclick="showMessages(this)">' +
                    '<a class="tz" href="/profile?uid=' + onlineUsers[i].uid + '">' +
                    '<img class="ud" src="' + onlineUsers[i].photoURL + '">' +
                    '</a>' +
                    '<div class="ty">' +
                    '<a style="text-decoration: none; color: black" href="/profile?uid=' + onlineUsers[i].uid + '"><strong>' + onlineUsers[i].name +'</strong><i class="fa fa-circle" aria-hidden="true"></i></a>' +
                    '<p class="hidden-chat">' + onlineUsers[i].id + '</p>' +
                    '<div class="bil">' +
                    '<button class="cg pm pv" id="' + onlineUsers[i].uid + '" onclick="openChatThread(this)">' +
                    'Send Message' +
                    '</button>' +
                    '</div>' +
                    '</div>' +
                    '</li>');
                onlineUserMap.set(onlineUsers[i].uid, onlineUsers[i].id);
            }
        }
        $.get('/get-all-chats', function (data, status) {
            if (Object.keys(data).length > 0 && data.constructor === Object) {
                delete data.Item['uid'];
                const chatInfo = $.map(data.Item, function (value, index) {
                    return [index, value];
                });
                sortFunction = function (a, b) {
                    a = a.M.timeInSec.S;
                    b = b.M.timeInSec.S;
                    return (a === b) ? 0 : (a < b) ? -1 : 1;
                };
                for (let i = 0; i < chatInfo.length; i += 2) {
                    chatInfo[i + 1].M.chatList.L.sort(sortFunction);
                }
                $("#chat-list").html('');
                var totalUnreadCount = 0;
                for (var j = 0; j < chatInfo.length; j += 2) {
                    var unreadCount = 0;
                    for (var k = 0; k < chatInfo[j + 1].M.chatList.L.length; k++) {
                        if (chatInfo[j + 1].M.chatList.L[k].M.status.S === "unread") {
                            unreadCount++;
                        }
                    }
                    if (unreadCount > 0) {
                        totalUnreadCount++;
                    }
                    $("#chat-list").append('<a href="#" class="b uj js-msgGroup" id="' + chatInfo[j] + '" onclick="showMessages(this)">' +
                        '<div class="tx">' +
                        '<span class="tz">' +
                        '<img class="wj ud" src="' + chatInfo[j + 1].M.photoURL.S + '">' +
                        '</span>' +
                        '<div class="ty">' +
                        '<strong>' + chatInfo[j + 1].M.name.S + '</strong>' +
                        '<span class="badge" style="margin-left: 10px">' + (unreadCount === 0 ? "" : unreadCount.toString()) + '</span>' +
                        '</div>' +
                        '</div>' +
                        '</a>');
                }
                $("#messagesCount").html((totalUnreadCount === 0 ? "" : totalUnreadCount.toString()));
            }
            else {
                $("#chat-list").html('<p class="b uj js-msgGroup" style="text-align: center">No Chats</p>');
            }
            showMessages = function (e) {
                if (Object.keys(data).length > 0 && data.constructor === Object) {
                    if (totalUnreadCount > 0) {
                        totalUnreadCount--;
                    }
                    var totalUnreadCountString = totalUnreadCount === 0 ? "" : totalUnreadCount.toString();
                    $("#messagesCount").html(totalUnreadCountString);
                    var chat = data.Item[$(e).attr("id")].M;
                    $(e).children("div").children("div").children("span").text('');
                    $("#chat-username").html(chat.name.S);
                    $("#chat-id").html($(e).attr("id"));
                    $("#chat-photo").html(chat.photoURL.S);
                    if (onlineUserMap.has($(e).attr("id"))) {
                        $("#chat-socket-id").html(onlineUserMap.get($(e).attr("id")));
                    }
                    $("#chat-messages").html('');
                    for (var i = 0; i < chat.chatList.L.length; i++) {
                        var msg = JSON.parse(CryptoJS.AES.decrypt(chat.chatList.L[i].M.message.S, 'darklords').toString(CryptoJS.enc.Utf8));
                        if (chat.chatList.L[i].M.status.S === "unread") {
                            msg = '<strong><em>' + JSON.parse(CryptoJS.AES.decrypt(chat.chatList.L[i].M.message.S, 'darklords').toString(CryptoJS.enc.Utf8)) + '</em></strong>';
                        }
                        if (chat.chatList.L[i].M.from.S != $(e).attr("id")) {
                            $("#chat-messages").append('<li class="tx bip zi">' +
                                '<div class="ty">' +
                                '<div class="bin">' +
                                msg +
                                '</div>' +
                                '<div class="bio" style="text-align: right">' +
                                '<small class="apv">' +
                                chat.chatList.L[i].M.time.S +
                                '</small>' +
                                '</div>' +
                                '</div>' +
                                '</li>');
                        }
                        else {
                            $("#chat-messages").append('<li class="tx zw">' +
                                '<div class="ty">' +
                                '<div class="bin">' +
                                msg +
                                '</div>' +
                                '<div class="bio">' +
                                '<small class="apv">' +
                                chat.chatList.L[i].M.time.S +
                                '</small>' +
                                '</div>' +
                                '</div>' +
                                '</li>');
                        }
                        chat.chatList.L[i].M.status.S = "read";
                    }
                    $("#chat-body").animate({
                        scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
                    });
                    $.post('/update-message-read-status', {
                        chattingWithID: $(e).attr("id"),
                        chattingWithName: chat.name.S,
                        chattingWithPhotoURL: chat.photoURL.S,
                        chatList: chat.chatList.L
                    }, function (data, status) {
                        console.log(data);
                    });
                }
            };
        });
    });

    $(document).on('keydown', '#input-message', function (e) {
        if(e.keyCode === 13) {
            if ($("#input-message").val() !== "") {
                var time = "" + new Date() + 19800 + "", timeInSec = new Date().getTime() + 19800;
                time = time.substring(0, time.indexOf("G") - 1);
                const messageObject = {
                    uid: $("#chat-id").text(),
                    socketID: onlineUserMap.get($("#chat-id").text()),
                    message: CryptoJS.AES.encrypt(JSON.stringify($("#input-message").val()), 'darklords').toString(),
                    time: time,
                    timeInSec: timeInSec
                };
                socket.emit('new message', messageObject);
                $("#chat-messages").append('<li class="tx bip zi">' +
                    '<div class="ty">' +
                    '<div class="bin">' +
                    JSON.parse(CryptoJS.AES.decrypt(messageObject.message, 'darklords').toString(CryptoJS.enc.Utf8)) +
                    '</div>' +
                    '<div class="bio" style="text-align: right">' +
                    '<small class="apv">' +
                    messageObject.time +
                    '</small>' +
                    '</div>' +
                    '</div>' +
                    '</li>');
                $("#input-message").val('');
                $("#chat-body").animate({
                    scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
                });
                $.post('/add-chat', {
                    chattingWithID: $("#chat-id").text(),
                    chattingWithName: $("#chat-username").text(),
                    chattingWithPhotoURL: $("#chat-photo").text(),
                    from: "",
                    message: messageObject.message,
                    status: "read",
                    time: messageObject.time,
                    timeInSec: messageObject.timeInSec
                }, function (data, status) {
                    if (data) {
                        $("#chat-list").append('<a href="" class="b uj js-msgGroup hidden-chat" id="' + $("#chat-id").text() + '" onclick="showMessages(this)">' +
                            '<div class="tx">' +
                            '<span class="tz">' +
                            '<img class="wj ud" src="' + $("#chat-photo").text() + '">' +
                            '</span>' +
                            '<div class="ty">' +
                            '<strong>' + $("#chat-username").text() + '</strong>' +
                            '</div>' +
                            '</div>' +
                            '</a>');
                    }
                });
            }
        }
    });

    socket.on('new message', function (messageObject) {
        var status = "unread";
        if ($(".js-conversation").find(".hidden-chat").length <= 0 && $("#chat-id").text() === messageObject.chattingWithID) {
            $("#chat-messages").append('<li class="tx zw">' +
                '<div class="ty">' +
                '<div class="bin">' +
                JSON.parse(CryptoJS.AES.decrypt(messageObject.message, 'darklords').toString(CryptoJS.enc.Utf8)) +
                '</div>' +
                '<div class="bio">' +
                '<small class="apv">' +
                messageObject.time +
                '</small>' +
                '</div>' +
                '</div>' +
                '</li>');
            $("#chat-body").animate({
                scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
            });
            status = "read";
        }
        $.post('/add-chat', {
            chattingWithID: messageObject.chattingWithID,
            chattingWithName: messageObject.chattingWithName,
            chattingWithPhotoURL: messageObject.chattingWithPhotoURL,
            from: messageObject.from,
            message: messageObject.message,
            status: status,
            time: messageObject.time,
            timeInSec: messageObject.timeInSec
        }, function (data, status) {
            if (data) {
                var unreadCount = $("#chat-list #" + messageObject.chattingWithID + " .badge").text();
                unreadCount++;
                $("#chat-list").append('<a href="" class="b uj js-msgGroup hidden-chat" id="' + messageObject.chattingWithID + '" onclick="showMessages(this)">' +
                    '<div class="tx">' +
                    '<span class="tz">' +
                    '<img class="wj ud" src="' + messageObject.chattingWithPhotoURL + '">' +
                    '</span>' +
                    '<div class="ty">' +
                    '<strong>' + messageObject.chattingWithName + '</strong>' +
                    '<span class="badge" style="margin-left: 10px">' + (unreadCount === 0 ? "" : unreadCount.toString()) + '</span>' +
                    '</div>' +
                    '</div>' +
                    '</a>');
            }
        });
    });

    socket.on('user offline put data', function (messageObject) {
        $.post('/add-chat', {
            uid: messageObject.uid,
            chattingWithID: messageObject.chattingWithID,
            chattingWithName: messageObject.chattingWithName,
            chattingWithPhotoURL: messageObject.chattingWithPhotoURL,
            from: messageObject.from,
            message: messageObject.message,
            status: "unread",
            time: messageObject.time,
            timeInSec: messageObject.timeInSec
        }, function (data, status) {
            if (data) {
                var unreadCount = $("#chat-list #" + messageObject.chattingWithID + " .badge").text();
                unreadCount++;
                $("#chat-list").append('<a href="" class="b uj js-msgGroup hidden-chat" id="' + messageObject.chattingWithID + '" onclick="showMessages(this)">' +
                    '<div class="tx">' +
                    '<span class="tz">' +
                    '<img class="wj ud" src="' + messageObject.chattingWithPhotoURL + '">' +
                    '</span>' +
                    '<div class="ty">' +
                    '<strong>' + messageObject.chattingWithName + '</strong>' +
                    '<span class="badge" style="margin-left: 10px">' + (unreadCount === 0 ? "" : unreadCount.toString()) + '</span>' +
                    '</div>' +
                    '</div>' +
                    '</a>');
            }
        });
    });

    $("#msgModal").on('hidden.bs.modal', function () {
        $.get('/get-all-chats', function (data, status) {
            if (Object.keys(data).length > 0 && data.constructor === Object) {
                delete data.Item['uid'];
                const chatInfo = $.map(data.Item, function (value, index) {
                    return [index, value];
                });
                sortFunction = function (a, b) {
                    a = a.M.timeInSec.S;
                    b = b.M.timeInSec.S;
                    return (a === b) ? 0 : (a < b) ? -1 : 1;
                };
                for (var i = 0; i < chatInfo.length; i += 2) {
                    chatInfo[i + 1].M.chatList.L.sort(sortFunction);
                }
                $("#chat-list").html('');
                var totalUnreadCount = 0;
                for (var j = 0; j < chatInfo.length; j += 2) {
                    var unreadCount = 0;
                    for (var k = 0; k < chatInfo[j + 1].M.chatList.L.length; k++) {
                        if (chatInfo[j + 1].M.chatList.L[k].M.status.S === "unread") {
                            unreadCount++;
                        }
                    }
                    if (unreadCount > 0) {
                        totalUnreadCount++;
                    }
                    $("#chat-list").append('<a href="#" class="b uj js-msgGroup" id="' + chatInfo[j] + '" onclick="showMessages(this)">' +
                        '<div class="tx">' +
                        '<span class="tz">' +
                        '<img class="wj ud" src="' + chatInfo[j + 1].M.photoURL.S + '">' +
                        '</span>' +
                        '<div class="ty">' +
                        '<strong>' + chatInfo[j + 1].M.name.S + '</strong>' +
                        '<span class="badge" style="margin-left: 10px">' + (unreadCount === 0 ? "" : unreadCount.toString()) + '</span>' +
                        '</div>' +
                        '</div>' +
                        '</a>');
                }
                $("#messagesCount").html((totalUnreadCount === 0 ? "" : totalUnreadCount.toString()));
                showMessages = function (e) {
                    if (totalUnreadCount > 0) {
                        totalUnreadCount--;
                    }
                    var totalUnreadCountString = totalUnreadCount === 0 ? "" : totalUnreadCount.toString();
                    $("#messagesCount").html(totalUnreadCountString);
                    var chat = data.Item[$(e).attr("id")].M;
                    $(e).children("div").children("div").children("span").text('');
                    $("#chat-username").html(chat.name.S);
                    $("#chat-id").html($(e).attr("id"));
                    $("#chat-photo").html(chat.photoURL.S);
                    $("#chat-messages").html('');
                    for (var i = 0; i < chat.chatList.L.length; i++) {
                        var msg = JSON.parse(CryptoJS.AES.decrypt(chat.chatList.L[i].M.message.S, 'darklords').toString(CryptoJS.enc.Utf8));
                        if (chat.chatList.L[i].M.status.S === "unread") {
                            msg = '<strong><em>' + JSON.parse(CryptoJS.AES.decrypt(chat.chatList.L[i].M.message.S, 'darklords').toString(CryptoJS.enc.Utf8)) + '</em></strong>';
                        }
                        if (chat.chatList.L[i].M.from.S != $(e).attr("id")) {
                            $("#chat-messages").append('<li class="tx bip zi">' +
                                '<div class="ty">' +
                                '<div class="bin">' +
                                msg +
                                '</div>' +
                                '<div class="bio" style="text-align: right">' +
                                '<small class="apv">' +
                                chat.chatList.L[i].M.time.S +
                                '</small>' +
                                '</div>' +
                                '</div>' +
                                '</li>');
                        }
                        else {
                            $("#chat-messages").append('<li class="tx zw">' +
                                '<div class="ty">' +
                                '<div class="bin">' +
                                msg +
                                '</div>' +
                                '<div class="bio">' +
                                '<small class="apv">' +
                                chat.chatList.L[i].M.time.S +
                                '</small>' +
                                '</div>' +
                                '</div>' +
                                '</li>');
                        }
                        chat.chatList.L[i].M.status.S = "read";
                    }
                    $("#chat-body").animate({
                        scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
                    });
                    $.post('/update-message-read-status', {
                        chattingWithID: $(e).attr("id"),
                        chattingWithName: chat.name.S,
                        chattingWithPhotoURL: chat.photoURL.S,
                        chatList: chat.chatList.L
                    }, function (data, status) {
                        console.log(data);
                    });
                };
            }
        });

        $input.remove();
        $(".js-conversation").addClass("hidden-chat");
        $("#chat-list").removeClass("hidden-chat");
        $(".js-msgGroup, .js-newMsg").removeClass("hidden-chat");
        $(".modal-title").html("Messages");
        $("#chat-username").addClass('hidden-chat');
    });

});