var input = {};
var flagP = false, flagPC = false;

function getUrlParams() {
    var p = {};
    var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }, query = window.location.search.substring(1);
    while (match = search.exec(query)) {
        p[decode(match[1])] = decode(match[2]);
    }
    return p;
}

function init() {
    var urlParams = getUrlParams();

    input = {
        email : urlParams['email'],
        token : urlParams['token']
    };

    checkP = function () {
        if ($("#password").val() === "" || $("#cpassword").val() === "" || $("#password").val() !== $("#cpassword").val()) {
            $("#cpasswordMessage").html("<div id='cpasswordMessage' style='color: red; display: inline'><i class='fa fa-times' aria-hidden='true'></i></div>");
            flagPC = false;
        }
        else {
            $("#cpasswordMessage").html("<div id='cpasswordMessage' style='color: green; display: inline'><i class='fa fa-check' aria-hidden='true'></i></div>");
            flagPC = true;
        }
    };

    $("#resetPassword").click(function () {

        if ($("#password").val() === "") {
            $("#passwordMessage").html('<small id="passwordMessage" style="color: red; display: inline">Empty field</small>');
            flagP = false;
        }
        else {
            $("#passwordMessage").html("");
            flagP = true;
        }

        if(flagP && flagPC) {
            input.password = $("#password").val();

            $.post('/fp', input, function (data, status) {
                if (data === "NotExist") {
                    $("#result").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> Invalid Email ID.</p>");
                }
                else if (data === "InvalidToken") {
                    $("#result").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> Invalid Token.</p>");
                }
                else if (data === "TokenUndefined") {
                    window.location.href = '/index/lp';
                }
                else {
                    $("#result").html("<p class='alert alert-success'><i class='fa fa-check' aria-hidden='true'></i> Password Changed</p>");
                }
            });
        }
    });

    $(document).keydown(function (e) {
        if(e.keyCode === 13) {
            $("#resetPassword").click();
        }
    });
}

window.onload = init();