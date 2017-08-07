$(document).ready(function () {

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.");
    }

    var db;


    $('#uploadProfilePhoto').change(function (e) {
        e.preventDefault();
        const fileName = e.target.files[0].name;
        if (fileName == "") {
            $("#profilePhotoMessage").html('<div id="profilePhotoMessage" style="color: red">Upload a file.</div>');
        }
        else if (fileName.split(".")[1].toLowerCase() == "png" || fileName.split(".")[1].toLowerCase() == "jpg" || fileName.split(".")[1].toLowerCase() == "jpeg") {
            $("#profilePhotoMessage").html('<div id="profilePhotoMessage" style="color: green">Uploading...</div>');
            var file = $(this).get(0).files[0];
            var formData = new FormData();
            formData.append('upload', file, file.name);
            $.ajax({
                url: '/uploadProfilePhoto',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    $("#profilepicImage").replaceWith('<img class="wj ud" src="' + data + '" data-action="zoom" id="profilepicImage">');
                    $("#profilePicImageTopbar").replaceWith('<img class="wj" src="' + data + '" id="profilePicImageTopbar">');
                    $("#profilePhotoMessage").html('<div id="profilePhotoMessage" style="color: green">Profile Picture Updated.</div>');
                }
            });
        }
        else {
            $("#profilePhotoMessage").html('<div id="profilePhotoMessage" style="color: red">Upload a valid file.</div>');
        }
    });

    $('#removeProfilePhoto').click(function () {
        $.get('/removeProfilePhoto', function (data, status) {
            $("#profilepicImage").replaceWith('<img class="wj ud" src="' + data + '" data-action="zoom" id="profilepicImage">');
            $("#profilePicImageTopbar").replaceWith('<img class="wj" src="' + data + '" id="profilePicImageTopbar">');
            $("#profilePhotoMessage").html('<div id="profilePhotoMessage" style="color: red">Profile Photo Removed.</div>');
        });
    });

    showBlog = function (e) {
        if ($(e).hasClass("active")) {
            $(e).removeClass("active");
            $("#active-content").html('');
        }
        else {
            $("#indeed_widget_wrapper").addClass('hidden-chat');
            $("#active-content").removeClass('hidden-chat');
            $(e).siblings("li").removeClass("active");
            $(e).addClass("active");
            $("#active-content").html('');
            $("#active-content").html('<h5 style="text-align: center">Loading...</h5>');

            var request = window.indexedDB.open("userInfo", 1);

            request.onerror = function (event) {
                console.log(event.target.errorCode);
            };

            request.onsuccess = function (event) {
                db = request.result;

                var req = db.transaction(["authUser"])
                    .objectStore("authUser")
                    .openCursor();

                req.onerror = function (event) {
                    console.log(event.target.errorCode);
                };

                req.onsuccess = function (event) {
                    $.post('/get-all-blogs',{uid: req.result.value.uid}, function (data, status) {
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
                                    '<p class="hidden-chat" id="timeInSec">' + value.M.timeInSec.S + '</p>' +
                                    '<button class="cg pr pv xw" onclick="removePost(this)">Remove Post</button>' +
                                    '</div>' +
                                    '</div>' +
                                    '</li>');
                            });
                            $("#active-content").html('<ul id="blog-post-list" class="ca uf bii zw">' + items.join('') + '</ul>');
                            removePost = function (e) {
                                var timeInSec = $(e).siblings("#timeInSec").text();
                                var updatedBlogList = [];
                                for (let i = 0; i < blogs.length; i++) {
                                    if (blogs[i].M.timeInSec.S !== timeInSec) {
                                        updatedBlogList.push(blogs[i]);
                                    }
                                }
                                blogs = updatedBlogList;
                                $.post('/update-blogs',{uid: data.Item.uid.S, blogList: updatedBlogList}, function (data, status) {
                                    $(e).parents("div").parents("div").parents("li").remove();
                                    if ($("#blog-post-list").children("li").length <= 0) {
                                        $("#active-content").html('<h5 style="text-align: center">No Blog Entries</h5>');
                                    }
                                });
                            };
                        }
                    });
                };
            };
        }
    };

    showJobs = function (e) {
        if ($(e).hasClass("active")) {
            $(e).removeClass("active");
            $("#active-content").html('');
            $("#active-content").removeClass('hidden-chat');
            $("#indeed_widget_wrapper").addClass('hidden-chat');
        }
        else {
            $(e).siblings("li").removeClass("active");
            $(e).addClass("active");
            $("#active-content").html('');
            $("#active-content").addClass('hidden-chat');
            $("#indeed_widget_wrapper").removeClass('hidden-chat');
        }
    };

    showAccountSettings = function (e) {
        if ($(e).hasClass("active")) {
            $(e).removeClass("active");
            $("#active-content").html('');
        }
        else {
            $("#indeed_widget_wrapper").addClass('hidden-chat');
            $("#active-content").removeClass('hidden-chat');
            $(e).siblings("li").removeClass("active");
            $(e).addClass("active");
            $("#active-content").html('');

            $("#active-content").html('<div style="width: 100%; height: 100%; position: relative"><table class="form-group" style="margin: 0 auto; position: relative; width: 50%">' +
                '<tr style="position: relative"><td>First Name : </td><td><input type="text" id="fname" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Last Name : </td><td><input type="text" id="lname" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Contact No. : </td><td><input type="tel" id="cno" class="form-control" maxlength="10" minlength="10"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Profession : </td><td><select id="profession" class="form-control">' +
                '<option value="sp" name="profession" disabled selected id="sp">Select Profile</option>' +
                '<option id="Accountant" value="Accountant" name="profession">Accountant</option>' +
                '<option id="Architect" value="Architect" name="profession">Architect</option>' +
                '<option id="Book Publisher" value="Book Publisher" name="profession">Book Publisher</option>' +
                '<option id="Businessman" value="Businessman" name="profession">Businessman</option>' +
                '<option id="Computer Programmer" value="Computer Programmer" name="profession">Computer Programmer</option>' +
                '<option id="Consultant" value="Consultant" name="profession">Consultant</option>' +
                '<option id="Data Analyst" value="Data Analyst" name="profession">Data Analyst</option>' +
                '<option id="Developer" value="Developer" name="profession">Developer</option>' +
                '<option id="Doctor" value="Doctor" name="profession">Doctor</option>' +
                '<option id="Engineer" value="Engineer" name="profession">Engineer</option>' +
                '<option id="Fashion Designer" value="Fashion Designer" name="profession">Fashion Designer</option>' +
                '<option id="Financial Advisor" value="Financial Advisor" name="profession">Financial Advisor</option>' +
                '<option id="Government Officer" value="Government Officer" name="profession">Government Officer</option>' +
                '<option id="Lawyer" value="Lawyer" name="profession">Lawyer</option>' +
                '<option id="Manager" value="Manager" name="profession">Manager</option>' +
                '<option id="Nurse" value="Nurse" name="profession">Nurse</option>' +
                '<option id="Professional Artist" value="Professional Artist" name="profession">Professional Artist</option>' +
                '<option id="Sales" value="Sales" name="profession">Sales</option>' +
                '<option id="Scientist" value="Scientist" name="profession">Scientist</option>' +
                '<option id="Student" value="Student" name="profession">Student</option>' +
                '<option id="Teacher" value="Teacher" name="profession">Teacher</option>' +
                '<option id="Web Designer" value="Web Designer" name="profession">Web Designer</option>' +
                '<option id="Writer/Editor" value="Writer/Editor" name="profession">Writer/Editor</option>' +
                '</select></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Date Of Birth : </td><td><input type="date" class="form-control" id="dob"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>University / Institute / School : </td><td><input type="text" id="university" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Company / Organisation : </td><td><input type="text" id="company" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Current Residence : </td><td><input type="text" id="residence" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Hometown : </td><td><input type="text" id="hometown" class="form-control"></td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr style="position: relative"><td>Gender :</td><td class="form-group">' +
                '<input name="gender" type="radio" value="Male" id="gender">' +
                '<label for="Male" style="margin-left: 10px">Male </label>' +
                '<input name="gender" type="radio" value="Female" id="gender" style="margin-left: 10px">' +
                '<label for="Female" style="margin-left: 10px">Female </label>' +
                '</td></tr>' +
                '<tr><td><br></td></tr>' +
                '<tr><td></td><td><button type="submit" class="cg pr pv" data-toggle="modal" href="#deleteAccountModal" style="text-decoration: none; float: right">Delete Account</button></td></tr>' +
                '<tr><td><button type="submit" class="cg pm" data-toggle="modal" href="#saveSettingsModal">Save Changes</button></td><td><p id="changes-saved" style="color: green; font-size: large"></p></td></tr>' +
                '</table></div>');

            if ( $('[type="date"]').prop('type') != 'date' ) {
                $('[type="date"]').datepicker();
            }

            $("#cno").keydown(function (e) {
                if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    return;
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });

            $("#save-settings").click(function () {
                const newSettings = {};
                var name = "";
                if ($("#fname").val() != "") {
                    name += $("#fname").val();
                }
                if ($("#lname").val() != "") {
                    name += ' ' + $("#lname").val();
                }
                if (name != "") {
                    newSettings.name = name;
                }
                if ($("#cno").val() != "") {
                    newSettings.contact = $("#cno").val();
                }
                if ($("#profession :selected").attr("id") != "sp") {
                    newSettings.profession = $("#profession :selected").attr("id");
                }
                if ($("#dob").val() != "") {
                    newSettings.dob = $("#dob").val();
                }
                if ($("#university").val() != "") {
                    newSettings.university = $("#university").val();
                }
                if ($("#company").val() != "") {
                    newSettings.company = $("#company").val();
                }
                if ($("#residence").val() != "") {
                    newSettings.residence = $("#residence").val();
                }
                if ($("#hometown").val() != "") {
                    newSettings.hometown = $("#hometown").val();
                }
                if ($("input[name='gender']:checked").val() !== undefined) {
                    newSettings.gender = $("input[name='gender']:checked").val();
                }
                const settingsArray = $.map(newSettings, function (value, index) {
                    return [index, value];
                });
                $.post('/update-account-settings',{newSettings: settingsArray}, function (data, status) {
                    $("#fname").val("");
                    $("#lname").val("");
                    $("#cno").val("");
                    $("#dob").val("");
                    $("#university").val("");
                    $("#company").val("");
                    $("#residence").val("");
                    $("#hometown").val("");
                    $("#profession").prop('selectedIndex',0);
                    $("input[name='gender']:checked").prop('checked', false);
                    $("#saveSettingsModal").modal('toggle');
                    $("#changes-saved").html('Changes Saved').fadeIn("slow").delay(10000).fadeOut('slow');
                });
            });

            $("#delete-account").click(function () {
                $.post('/delete-account', function (data, status) {
                    window.location.href = "/";
                });
            });
        }
    };

    openBlog = function () {
        showBlog($("#blog")[0]);
    };

    openJobs = function () {
        showJobs($("#jobs")[0]);
    };

    openAccountSettings = function () {
        showAccountSettings($("#account-settings")[0]);
    };

    if (window.location.hash == "#blog") {
        showBlog($("#blog")[0]);
    }
    else if (window.location.hash == "#jobs") {
        showJobs($("#jobs")[0]);
    }
    else if (window.location.hash == "#account-settings") {
        showAccountSettings($("#account-settings")[0]);
    }
});