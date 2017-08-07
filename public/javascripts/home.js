$(document).ready(function () {

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.");
    }

    var db;

    var request = window.indexedDB.open("userInfo", 1);

    request.onerror = function (event) {
        console.log(event.target.errorCode);
    };

    request.onsuccess = function (event1) {
        db = request.result;

        var req = db.transaction(["authUser"])
            .objectStore("authUser")
            .openCursor();

        req.onerror = function (event) {
            console.log(event.target.errorCode);
        };

        req.onsuccess = function (event) {
            const items = [];
            if (req.result.value.university !== undefined) {
                items.push('<li><i class="fa fa-graduation-cap" style="width: 30px; padding: 4px 0 0 0"></i>Studies at <a style="text-decoration: none; color: #0275d8">' + req.result.value.university + '</a></li>');
            }
            if (req.result.value.company !== undefined) {
                items.push('<li><i class="fa fa-briefcase" style="width: 30px; padding: 4px 0 0 0"></i>Works at <a style="text-decoration: none; color: #0275d8">' + req.result.value.company + '</a></li>');
            }
            if (req.result.value.residence !== undefined) {
                items.push('<li><i class="fa fa-home" style="width: 30px; padding: 4px 0 0 0"></i>Lives in <a style="text-decoration: none; color: #0275d8">' + req.result.value.residence + '</a></li>');
            }
            if (req.result.value.hometown !== undefined) {
                items.push('<li><i class="fa fa-map-marker" style="width: 30px; padding: 4px 0 0 0"></i>From <a style="text-decoration: none; color: #0275d8">' + req.result.value.hometown + '</a></li>');
            }
            if (req.result.value.dob !== undefined) {
                items.push('<li><i class="fa fa-birthday-cake" style="width: 30px; padding: 4px 0 0 0"></i>Born on <a style="text-decoration: none; color: #0275d8">' + req.result.value.dob + '</a></li>');
            }
            $("#user-info-list").append(items.join(''));
        };
    };

    request.onupgradeneeded = function (event) {
        event.target.result.createObjectStore("authUser", {keyPath: "uid"});
    };

    openChatThread = function (e) {
        $("#chat-list").addClass("hidden-chat");
        $(".js-msgGroup, .js-newMsg").addClass("hidden-chat");
        $(".js-conversation").removeClass("hidden-chat");
        $(".modal-title").html('<a href="" class="js-gotoMsgs">Back</a>');
        $("#chat-username").html($(e).parents("div").siblings("a").children("strong").text());
        $("#chat-id").html($(e).attr("id"));
        $("#chat-photo").html($(e).parents("div").parents("div").siblings("a").children("img").attr("src"));
        $("#chat-username").removeClass('hidden-chat');
        $("#chat-socket-id").html($(e).parents("div").siblings("p").text());
        $input.insertAfter(".js-conversation");
        $("#chat-body").animate({
            scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
        });
        $("#msgModal").modal('show');
    };

    changeCss = function (e) {
        $(e).css("border-color", "");
    };

    $("#blog-post-list").html('<li class="tx b abj" style="text-align: center">Loading...</li>');

    $("#post-blog").click(function () {
        if ($("#blog-title").val() === "") {
            $("#blog-title").css("border-color", "red");
        }

        if ($("#blog-input").val() === "") {
            $("#blog-input").css("border-color", "red");
        }

        if ($("#blog-title").val() !== "" && $("#blog-input").val() !== "") {
            let timeInSec = new Date().getTime() + 19800;
            let time = new Date() + 19800;
            time = time.substring(0, time.indexOf("G") - 1);

            var request = window.indexedDB.open("userInfo", 1);

            request.onerror = function (event) {
                console.log(event.target.errorCode);
            };

            request.onsuccess = function (event) {
                var req = db.transaction(["authUser"])
                    .objectStore("authUser")
                    .openCursor();

                req.onerror = function (event) {
                    console.log(event.target.errorCode);
                };

                req.onsuccess = function (event) {
                    const input = {
                        blogTitle: $("#blog-title").val(),
                        blogInput: $("#blog-input").val(),
                        time: time,
                        timeInSec: timeInSec
                    };
                    $("#blog-title").val("");
                    $("#blog-input").val("");
                    if ($("#blog-post-list").children("li").length <= 1 && ($("#blog-post-list").children("li").text() === "Loading..." || $("#blog-post-list").children("li").text() === "No Blog Entries")) {
                        $("#blog-post-list").html('');
                    }
                    $("#blog-post-list").prepend('<li class="tx b abj" style="word-wrap: normal; white-space: pre-wrap">' +
                        '<a class="tz" href="/profile?uid=' + req.result.value.uid + '">' +
                        '<img class="ud" src="' + req.result.value.photoURL + '">' +
                        '</a>' +
                        '<div class="ty">' +
                        '<div class="bin">' +
                        '<div class="ue">' +
                        '<small class="xw apv">' + time + '</small>' +
                        '<h6>' + req.result.value.name + '</h6>' +
                        '</div>' +
                        '<h2 style="font-style: italic">' + input.blogTitle + '</h2>' +
                        '<p>' + input.blogInput + '</p>' +
                        '</div>' +
                        '</div>' +
                        '</li>');
                    $.post('/add-blog', input, function (data, status) {});
                };
            };
        }
    });

    $.get('/get-all-connections-uid', function (data1, status1) {
        var temp = [];
        for (let i = 0; i < data1.length; i++) {
            $.post('/get-all-blogs',{uid: data1[i]}, function (data, status) {
                if (data.Item !== undefined) {
                    temp.push(data.Item);
                }
            });
        }
        setTimeout(function () {
            if (temp.length <= 0) {
                $("#blog-post-list").html('<li class="tx b abj" style="text-align: center">No Blog Entries</li>');
            }
            else {
                var blogs = [];
                for (let i = 0; i < temp.length; i++) {
                    temp[i].blogList.L.forEach(function (value) {
                        blogs.push(value);
                    });
                }
                sortFunction = function (a, b) {
                    a = a.M.timeInSec.S;
                    b = b.M.timeInSec.S;
                    return (a === b) ? 0 : (a > b) ? -1 : 1;
                };
                blogs.sort(sortFunction);
                $("#blog-post-list").html('');
                blogs.forEach(function (value) {
                    $("#blog-post-list").append('<li class="tx b abj" style="word-wrap: normal; white-space: pre-wrap">' +
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
            }
        }, 10000);
    });
});