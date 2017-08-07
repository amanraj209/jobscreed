$(document).ready(function () {

    function getUrlParams() {
        var p = {};
        var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }, query = window.location.search.substring(1);
        while (match = search.exec(query)) {
            p[decode(match[1])] = decode(match[2]);
        }
        return p;
    }

    var urlParams = getUrlParams();

    $.post('/check-connection', function (data, status) {
        if (data.connection === "NoConnection" && data.invitation === "NoConnectionRequest" && data.invitationByOtherUser === "NoConnectionRequestByOtherUser") {
            $("#connectionStatus").html('Add Connection');
        }
        else if (data.connection === "Connected") {
            $("#connectionStatus").html('Remove Connection');
            $("#open-chat-thread").removeClass('hidden');
        }
        else if (data.invitation === "ConnectionRequested") {
            $("#connectionStatus").html('Cancel Request');
        }
        else if (data.invitationByOtherUser === "ConnectionRequestedByOtherUser") {
            $("#connectionStatus").html('Accept Request');
        }
        $("#connectionStatus").removeClass('hidden');
    });

    $("#connectionStatus").click(function () {
        if ($("#connectionStatus").text() === "Add Connection") {
            $.post('/send-connection-request', function (data, status) {
                $("#connectionStatus").html('Cancel Request');
            });
        }
        else if ($("#connectionStatus").text() === "Remove Connection") {
            $.post('/remove-connection', function (data, status) {
                $("#connectionStatus").html('Add Connection');
                $("#open-chat-thread").addClass('hidden');
            });
        }
        else if ($("#connectionStatus").text() === "Cancel Request") {
            $.post('/remove-connection-request', function (data, status) {
                $("#connectionStatus").html('Add Connection');
                $("#open-chat-thread").addClass('hidden');
            });
        }
        else if ($("#connectionStatus").text() === "Accept Request") {
            var time = "" + new Date() + 19800 + "", timeInSec = new Date().getTime() + 19800;
            $.post('/confirm-connection-request', {
                time: time,
                timeInSec: timeInSec
            }, function (data, status) {
                $("#connectionStatus").html('Remove Connection');
                $("#open-chat-thread").removeClass('hidden');
            });
        }
    });

    showBlog = function (e) {
        if ($(e).hasClass("active")) {
            $(e).removeClass("active");
            $("#active-content").html('');
        }
        else {
            $(e).siblings("li").removeClass("active");
            $(e).addClass("active");
            $("#active-content").html('');
            $("#active-content").html('<h5 style="text-align: center">Loading...</h5>');

            $.post('/get-all-blogs',{uid: urlParams['uid']}, function (data, status) {
                if (data.Item === undefined) {
                    $("#active-content").html('<h5 style="text-align: center">No Blog Entries</h5>');
                }
                else {
                    var blogs = data.Item.blogList.L;
                    sortFunction = function (a, b) {
                        a = a.M.timeInSec.S;
                        b = b.M.timeInSec.S;
                        return (a === b) ? 0 : (a > b) ? -1 : 1;
                    };
                    blogs.sort(sortFunction);
                    var items = [];
                    blogs.forEach(function (value) {
                        items.push('<li class="tx b abj" style="word-break: break-all; white-space: pre-wrap">' +
                            '<a class="tz" href="/profile?uid=' + value.M.uid.S + '">' +
                            '<img class="ud" src="' + value.M.photoURL.S + '">' +
                            '</a>' +
                            '<div class="ty">' +
                            '<div class="bin">' +
                            '<div class="ue">' +
                            '<small class="xw apv">' + value.M.time.S + '</small>' +
                            '<h6>' + value.M.name.S + '</h6>' +
                            '</div>' +
                            '<h2 style="font-style: italic">' + value.M.blogTitle.S + '</h2>' +
                            '<p>' + value.M.blogInput.S + '</p>' +
                            '</div>' +
                            '</div>' +
                            '</li>');
                    });
                    $("#active-content").html('<ul id="blog-post-list" class="ca uf bii zw">' + items.join('') + '</ul>');
                }
            });
        }
    };

    if (window.location.hash === "#blog") {
        showBlog($("#blog")[0]);
    }

    $.post('/get-user-info', {uid: urlParams['uid']}, function (data, status) {
        var items = [];
        if (data.university !== undefined) {
            items.push('<li>Studies at <a style="text-decoration: none; color: #0275d8">' + data.university + '</a></li>');
        }
        if (data.company !== undefined) {
            items.push('<li>Works at <a style="text-decoration: none; color: #0275d8">' + data.company + '</a></li>');
        }
        if (data.residence !== undefined) {
            items.push('<li>Lives in <a style="text-decoration: none; color: #0275d8">' + data.residence + '/a></li>');
        }
        if (data.hometown !== undefined) {
            items.push('<li>From <a style="text-decoration: none; color: #0275d8">' + data.hometown + '</a></li>');
        }
        if (data.dob !== undefined) {
            items.push('<li>Born on <a style="text-decoration: none; color: #0275d8">' + data.dob + '</a></li>');
        }
        $("#user-info-list").append(items.join(''));
    });

});