$(document).ready(function () {

    $("#notificationList").html('<li class="b tx abj" style="text-align: center">Loading...</li>');

    $.get('/get-notifications', function (data, status) {
        if (data.Item !== undefined) {
            $("#notificationList").html("");
            function sortFunction(a, b) {
                a = a.M.timeInSec.S;
                b = b.M.timeInSec.S;
                return (a === b) ? 0 : (a > b) ? -1 : 1;
            }
            var notificationList = data.Item.notificationList.L;
            notificationList.sort(sortFunction);
            var items = [];
            for (let i = 0; i < notificationList.length; i++) {
                items.push('<li class="b tx abj">' +
                    '<div class="tz">' +
                    '<a href="/profile?uid=' + notificationList[i].M.uid.S + '"><img src="' + notificationList[i].M.photoURL.S + '" class="wj" style="width: 40px"></a>' +
                    '</div>' +
                    '<div class="ty" style="vertical-align: middle">' +
                    '<small class="xw apv">' + notificationList[i].M.time.S.substring(0, notificationList[i].M.time.S.indexOf("G") - 1) + '</small>' +
                    '<div class="ue">' +
                    '<a style="text-decoration: none" href="/profile?uid=' + notificationList[i].M.uid.S + '">' + notificationList[i].M.name.S + '</a> has accepted your request to connect.' +
                    '</div>' +
                    '</div>' +
                    '</li>');
                notificationList[i].M.status.S = "read";
            }
            $("#notificationList").html(items.join(''));
            $.post('/change-notification-status',
                {uid: data.Item.uid.S, notificationList: data.Item.notificationList.L},
                function (data, status) {});
        }
        else {
            $("#notificationList").html('<li class="b tx abj" style="text-align: center">No Notifications</li>');
        }
    });
});