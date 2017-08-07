$(document).ready(function () {

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.");
    }

    var db;

    $("#lostPassword").click(function () {
        if ($("#email").val() === "") {
            $("#emailMessage").html('<small id="emailMessage" style="color: red; display: inline">Empty field</small>');
        }
        else {
            var input = {email : $("#email").val()};
            $.post('/lp', input, function (data, status) {
                $("#email").val("");
                if (data === "NotExist") {
                    $("#result").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> Invalid Email ID.</p>");
                }
                else {
                    $("#result").html("<p class='alert alert-success'><i class='fa fa-check' aria-hidden='true'></i> Request email sent.</p>");
                }
            });
        }
    });

    $("#login").click(function () {
        var flagEL = false, flagPL = false;

        var user = {
            email : $("#emailL").val(),
            password : $("#passwordL").val()
        };

        if(user.email === "") {
            $("#emailLMessage").html("Empty field");
            flagEL = false;
        } else {
            $("#emailLMessage").html("");
            flagEL = true;
        }

        if(user.password === "") {
            $("#passwordLMessage").html("Empty field");
            flagPL = false;
        } else {
            $("#passwordLMessage").html("");
            flagPL = true;
        }

        if(flagEL && flagPL) {
            $.post("/login", user, function (data, status) {
                $("#emailL").val("");
                $("#passwordL").val("");
                if (data === "NotExist") {
                    $("#existLMessage").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> User does not exist.</p>");
                }
                else if (data === "Invalid") {
                    $("#existLMessage").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> Invalid email or password.</p>");
                }
                else {
                    var request = window.indexedDB.open("userInfo", 1);

                    request.onerror = function (event) {
                        console.log(event.target.errorCode);
                    };

                    request.onsuccess = function (event1) {
                        db = request.result;

                        var req = db.transaction(["authUser"], "readwrite")
                            .objectStore("authUser")
                            .add(data);

                        req.onerror = function (event) {
                            console.log(event.target.errorCode);
                        };

                        req.onsuccess = function (event) {
                            window.location = "/";
                        };
                    };

                    request.onupgradeneeded = function (event) {
                        var objectStore = event.target.result.createObjectStore("authUser", {keyPath: "uid"});
                        objectStore.add(data);
                    };
                }
            });
        } else {
            $("#exisLtMessage").html("");
        }
    });

    $(document).keydown(function (e) {
        if(e.keyCode === 13) {
            $("#lostPassword").click();
        }
    });
});