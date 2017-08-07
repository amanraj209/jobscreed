var $input = $('<div class="modal-body"><input type="text" class="form-control" placeholder="Message" id="input-message"></div>');

$(document).on("click", ".js-msgGroup", function () {
    $("#chat-list").addClass("hidden-chat");
    $(".js-msgGroup, .js-newMsg").addClass("hidden-chat");
    $(".js-conversation").removeClass("hidden-chat");
    $(".modal-title").html('<a href="" class="js-gotoMsgs">Back</a>');
    $("#chat-username").removeClass('hidden-chat');
    $("#chat-body").animate({
        scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
    });
    $input.insertAfter(".js-conversation");
}),
$(function () {
    function o () {
        return $(window).width() - ($('[data-toggle = "popover"]').offset().left + $('[data-toggle = "popover"]').outerWidth());
    }
    $(window).on("resize", function () {
        var t = $('[data-toggle="popover"]').data("bs.popover");
        t && (t.config.viewport.padding = o());
    }),
    $('[data-toggle = "popover"]').popover({
        template: '<div class="popover" role="tooltip"><div class="popover-content px-0"></div></div>',
        title: "",
        html: !0,
        trigger: "manual",
        placement: "bottom",
        viewport: {
            selector: "body",
            padding: o()
        },
        content: function () {
            var o = $("#js-popoverContent").clone();
            return '<ul class="nav nav-pills nav-stacked" style="width: 120px">'+o.html()+'</ul>';
        }
    }),
    $('[data-toggle = "popover"]').on("click", function (o) {
        o.stopPropagation();
        $($('[data-toggle = "popover"]').data("bs.popover").getTipElement()).hasClass("in") ? ($('[data-toggle = "popover"]').popover("hide"), $(document).off("click.app.popover")) : ($('[data-toggle = "popover"]').popover("show"), setTimeout( function () { $(document).one("click.app.popover", function () {$('[data-toggle = "popover"]').popover("hide");});},1));
    });
}),

$(document).on("click", ".js-gotoMsgs", function () {
    $.get('/get-all-chats', function (data, status) {
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
                '<div class="biq">' +
                chatInfo[j + 1].M.chatList.L[chatInfo[j + 1].M.chatList.L.length - 1].M.message.S +
                '</div>' +
                '</div>' +
                '</div>' +
                '</a>');
        }
        $("#messagesCount").html((totalUnreadCount === 0 ? "" : totalUnreadCount.toString()));
        showMessages = function (e) {
            var chat = data.Item[$(e).attr("id")].M;
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
            }
            $("#chat-body").animate({
                scrollTop: $("#chat-body").scrollTop() + $("#chat-body").height() + $("#chat-messages").height()
            });
        };
    });

    $input.remove();
    $(".js-conversation").addClass("hidden-chat");
    $("#chat-list").removeClass("hidden-chat");
    $(".js-msgGroup, .js-newMsg").removeClass("hidden-chat");
    $(".modal-title").html("Messages");
    $("#chat-username").addClass('hidden-chat');
}),

$(document).on("click", "[data-action=growl]", function (o) {
    o.preventDefault();
    $("#app-growl").append('<div class="alert alert-dark alert-dismissible fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>Click the x on the upper right to dismiss this little thing. Or click growl again to show more growls</div>');
}),

$(document).on("focus", '[data-action="grow"]', function () {
    $(window).width() > 1e3 && $(this).animate({width:300});
}),

$(document).on("blur", '[data-action="grow"]', function () {
    if ($(window).width() > 1e3) {
        $(this).animate({width:180});
    }
}),

$(function () {
    function o () {
        $(window).scrollTop() > $(window).height() ? $(".docs-top").fadeIn() : $(".docs-top").fadeOut();
    }
    $(".docs-top").length && (o(), $(window).on("scroll",o));
}),

$(function () {
    function o () {
        i.width() > 768 ? e() : t();
    }
    function t () {
        i.off("resize.theme.nav");
        i.off("scroll.theme.nav");
        n.css({position:"",left:"",top:""});
        }
        function e () {
            function o () {
                e.containerTop = $(".docs-content").offset().top-40,
                e.containerRight = $(".docs-content").offset().left + $(".docs-content").width() + 45,
                t();
            }
            function t () {
                var o = i.scrollTop(), t = Math.max(o - e.containerTop, 0);
                return t ? void n.css({position:"fixed", left:e.containerRight, top:40}) : ($(n.find("li a")[1]).addClass("active"), n.css({position:"",left:"",top:""}));
            }
            var e = {};
            o(),
            $(window).on("resize.theme.nav", o).on("scroll.theme.nav", t),
            $("body").scrollspy({target: "#markdown-toc", children: "li > a"}),
            setTimeout(function () {
                $("body").scrollspy("refresh");
            }, 1e3);
    }
    var n = $("#markdown-toc");
    $("#markdown-toc li").addClass("nav-item");
    $("#markdown-toc li > a").addClass("nav-link");
    var i = $(window);
    n[0] && (o(), i.on("resize",o));
});