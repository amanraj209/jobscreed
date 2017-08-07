$(document).ready(function () {

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.");
    }
    indexedDB.deleteDatabase("userInfo");
    var db;

    checkEmail = function (email) {
        for (let i = 0; i < email.length; i++) {
            if (email.charAt(i) === '@') {
                return true;
            }
        }
        return false;
    };

    checkP = function () {
        if ($("#passwordS").val() === "" || $("#cpassword").val() === "" || $("#passwordS").val() !== $("#cpassword").val()) {
            $("#cpasswordMessage").html("<div id='cpasswordMessage' style='color: red; display: inline'><i class='fa fa-times' aria-hidden='true'></i></div>");
            flagPC = false;
        }
        else {
            $("#cpasswordMessage").html("<div id='cpasswordMessage' style='color: green; display: inline'><i class='fa fa-check' aria-hidden='true'></i></div>");
            flagPC = true;
        }
    };

    $("#cno").keydown(function (e) {
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110]) !== -1 ||
            (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
            (e.keyCode >= 35 && e.keyCode <= 40)) {
            return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    $(document).keydown(function (e) {
        if(e.keyCode === 13) {
            $("#login").click();
        }
    });

    $("#signup").click(function () {
        var flagPR = false, flagD = false, flagF = false, flagL = false, flagES = false, flagPS = false, flagC = false;

        const newuser = {
            fname : $("#fname").val(),
            lname : $("#lname").val(),
            email : $("#emailS").val(),
            password : $("#passwordS").val(),
            contact : $("#cno").val(),
            gender : $("input[name='gender']:checked").val(),
            profession : $("#profession :selected").attr("id"),
            dob : $("#dob").val()
        };
        if (newuser.profession === "sp") {
            $("#professionMessage").html("Invalid Option");
            flagPR = false;
        }
        else {
            $("#professionMessage").html("");
            flagPR = true;
        }

        if(newuser.dob === "") {
            $("#dobMessage").html("Empty field");
            flagD = false;
        }
        else {
            $("#dobMessage").html("");
            flagD = true;
        }

        if(newuser.fname === "") {
            $("#fnameMessage").html("Empty field");
            flagF = false;
        }
        else {
            $("#fnameMessage").html("");
            flagF = true;
        }

        if(newuser.lname === "") {
            $("#lnameMessage").html("Empty field");
            flagL = false;
        }
        else {
            $("#lnameMessage").html("");
            flagL = true;
        }

        if(newuser.email === "") {
            $("#emailSMessage").html("Empty field");
            flagES = false;
        }
        else {
            if (checkEmail(newuser.email)) {
                $("#emailSMessage").html("");
                flagES = true;
            }
            else {
                $("#emailSMessage").html("Invalid Email ID");
                flagES = false;
            }
        }

        if(newuser.password === "") {
            $("#passwordSMessage").html("Empty field");
            flagPS = false;
        }
        else {
            $("#passwordSMessage").html("");
            flagPS = true;
        }

        if(newuser.contact === "") {
            $("#cnoMessage").html("Empty field");
            flagC = false;
        }
        else {
            if (newuser.contact.length < 10) {
                $("#cnoMessage").html("Enter a 10 digit contact number");
                flagC = false;
            }
            else {
                $("#cnoMessage").html("");
                flagC = true;
            }
        }

        if(flagPR && flagD && flagPS && flagF && flagL && flagES && flagC) {
            $.post("/signup", newuser, function (data, status) {
                $("#fname").val("");
                $("#lname").val("");
                $("#emailS").val("");
                $("#passwordS").val("");
                $("#cpassword").val("");
                $("#cno").val("");
                $("#dob").val("");
                $("#profession").prop('selectedIndex',0);
                if (data.message === "ConditionalCheckFailedException") {
                    $("#existSMessage").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> User already exists.</p>");
                    $("#cpasswordMessage").html("<div id='cpasswordMessage'></div>");
                }
                else {
                    var request = window.indexedDB.open("userInfo", 1);

                    request.onerror = function (event) {
                        console.log(event.target.errorCode);
                    };

                    request.onsuccess = function (event1) {
                        db = request.result;

                        db.transaction(["authUser"], "readwrite")
                            .objectStore("authUser")
                            .delete(data.uid);

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
        }
        else {
            $("#existSMessage").html("");
        }
    });

    $("#login").click(function () {
        var flagEL = false, flagPL = false;

        const user = {
            email : $("#emailL").val(),
            password : $("#passwordL").val()
        };

        if(user.email === "") {
            $("#emailLMessage").html("Empty field");
            flagEL = false;
        }
        else {
            $("#emailLMessage").html("");
            flagEL = true;
        }

        if(user.password === "") {
            $("#passwordLMessage").html("Empty field");
            flagPL = false;
        }
        else {
            $("#passwordLMessage").html("");
            flagPL = true;
        }

        if(flagEL && flagPL) {
            $.post("/login", user, function (data, status) {
                $("#emailL").val("");
                $("#passwordL").val("");
                if (data.message === "NotExist") {
                    $("#existLMessage").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> User does not exist.</p>");
                }
                else if (data.message === "Invalid") {
                    $("#existLMessage").html("<p class='alert alert-danger'><i class='fa fa-exclamation-circle' aria-hidden='true'></i> Invalid email or password.</p>");
                }
                else {
                    var request = window.indexedDB.open("userInfo", 1);

                    request.onerror = function (event) {
                        console.log(event.target.errorCode);
                    };

                    request.onsuccess = function (event1) {
                        db = request.result;

                        db.transaction(["authUser"], "readwrite")
                            .objectStore("authUser")
                            .delete(data.uid);

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
                        event.target.result.createObjectStore("onlineUsers", {keyPath: "uid"});
                        var objectStore = event.target.result.createObjectStore("authUser", {keyPath: "uid"});
                        objectStore.add(data);
                    };
                }
            });
        }
        else {
            $("#exisLtMessage").html("");
        }
    });
});