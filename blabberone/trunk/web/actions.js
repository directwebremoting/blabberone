
var viewed;
var mode;
var me;
var myFollowers;
var whoImFollowing;
var followingViewed;
var tweets;

// The 3 sets of tweets that we can display
var EVERYONE = "everyone";
var USER = "user";
var FOLLOWERS = "followers";

// Functions called from the HTML
function init() {
    dwr.engine.setActiveReverseAjax(true);
    existingChanged();

    dwr.engine.beginBatch();
    checkAuthentication(setAuthentication);
    displayViewedUser(null);
    setModeInternal(EVERYONE);
    dwr.engine.endBatch();
}

function setMode(newMode) {
    dwr.engine.beginBatch();
    setModeInternal(newMode);
    dwr.engine.endBatch();
}

function befriendMe() {
    Network.befriendMe();
}

function updateStatus() {
    var status = dwr.util.getValue("info_input");
    dwr.util.setValue("info_input", "");

    dwr.util.setValue("me.status.message", "Sending ...");
    var button = dwr.util.byId("info_send");
    button.disabled = true;
    dwr.util.setValue(button, "Sending ...");

    Network.updateStatus(status, function() {
        dwr.util.setValue("me.status.message", status);
        var button = dwr.util.byId("info_send");
        button.disabled = false;
        dwr.util.setValue(button, "Send Message");

        dwr.util.setValue("info_report", "Message sent ...");
        setTimeout(function() {
            dwr.util.setValue("info_report", "");
        }, 2000);

        //loadTweets();
    });
}

function toggleFollow() {
    if (followingViewed) {
        Network.unfollow(viewed.username, getLoadUserAction(viewed.username, USER));
    }
    else {
        Network.follow(viewed.username, getLoadUserAction(viewed.username, USER));
    }
}

function getLoadUserAction(user, mode) {
    return function() {
        loadUser(user, mode);
    };
}

function loadUser(user, mode) {
    Network.getUser(user, function(data) {
        dwr.engine.beginBatch();
        displayViewedUser(data);
        setModeInternal(mode);
        dwr.engine.endBatch();
    });
}

function existingChanged() {
    if (dwr.util.getValue("existing") == true) {
        dwr.util.byId("password2line").style.display = "none";
        dwr.util.setValue("loginSubmit", "Login");
    }
    else {
        dwr.util.byId("password2line").style.display = "block";
        dwr.util.setValue("loginSubmit", "Create Account");
    }
}

function login() {
    dwr.engine.beginBatch();
    var existing = dwr.util.getValue("existing");
    if (existing) {
        var username = dwr.util.getValue("username");
        var password = dwr.util.getValue("password");
        Network.login(username, password, function(data) {
            if (data == null) {
                alert("Login failed");
            }
            else {
                setAuthentication(data);
                displayViewedUser(data);
                setModeInternal(FOLLOWERS);
            }
        });
    }
    else {
        var username = dwr.util.getValue("username");
        var password = dwr.util.getValue("password");
        var password2 = dwr.util.getValue("password2");
        if (password != password2) {
            alert("Passwords don't match.");
            return;
        }
        else {
            Network.createUser(username, password, function(data) {
                if (data == null) {
                    alert("Failed to create user");
                    return;
                }
                else {
                    setAuthentication(data);
                    displayViewedUser(data);
                    setModeInternal(FOLLOWERS);
                }
            });
        }
    }
    dwr.engine.endBatch();
    return false;
}

// Callback function
function displayTweets(data) {
    tweets = data;

    // Delete all the rows except for the "pattern" row
    dwr.util.removeAllRows("tweets", { filter:function(tr) {
        return (tr.id != "tweet_template");
    }});

    for (var i = tweets.length - 1; i >= 0; i--) {
        var tweet = tweets[i];
        var username = tweet.user.username;
        dwr.util.cloneNode("tweet_template", { idSuffix:"_"+i });
    
        dwr.util.setValue("tweet_message_" + i, tweet.message);
        var age = Math.floor((new Date().getTime() - tweet.timestamp) / 60000);
        dwr.util.setValue("tweet_time_" + i, age);
    
        var link = dwr.util.byId("tweet_user_link_" + i);
        link.href = "#";
        link.title = username;
        link.onclick = function() {
            var u = username;
            return getLoadUserAction(u, USER);
        }();

        var image = dwr.util.byId("tweet_user_img_" + i);
        image.alt = username;
        image.src = tweet.user.avatar;

        var home = dwr.util.byId("tweet_user_home_" + i);
        home.href = "#";
        home.title = username;
        home.innerHTML = username;
        home.onclick = function() {
            var u = username;
            return getLoadUserAction(u, USER);
        }();
    }
}

function displayTweet(tweet) {
    tweets.push(tweet);
    displayTweets(tweets);
}

// Utility functions
function setModeInternal(newMode) {
    if (newMode == "user") {
        mode = USER;
    }
    else if (newMode == "everyone") {
        mode = EVERYONE;
    }
    else {
        mode = FOLLOWERS;
    }
    // updateHash();
    loadTweets();
}

function loadTweets() {
    // Load the tweets
    if (mode == USER) {
        if (viewed == null) {
            console.log("viewed == null when mode == USER");
            return;
        }
        Network.viewUsersTweets(viewed.username, displayTweets);
        dwr.util.byId("tab_followers").className = "";
        dwr.util.byId("tab_user").className = "active";
        dwr.util.byId("tab_everyone").className = "";
    }
    else if (mode == EVERYONE) {
        Network.viewAllTweets(displayTweets);
        dwr.util.byId("tab_followers").className = "";
        dwr.util.byId("tab_user").className = "";
        dwr.util.byId("tab_everyone").className = "active";
    }
    else {
        if (viewed == null) {
            console.log("viewed == null when mode == FOLLOWER");
            return;
        }
        Network.viewFollowersTweets(viewed.username, displayTweets);
        dwr.util.byId("tab_followers").className = "active";
        dwr.util.byId("tab_user").className = "";
        dwr.util.byId("tab_everyone").className = "";
    }
}

function displayViewedUser(user) {
    viewed = user;
    if (user == null) {
        setModeInternal(EVERYONE);
        dwr.util.byId("tab_followers").style.display = "none";
        dwr.util.byId("tab_user").style.display = "none";
        dwr.util.byId("aboutviewed").style.display = "none";
        return;
    }

    // bug? setValues dies with recursive data structures
    user.status.user = null;
    dwr.util.setValues(viewed, { prefix:'viewed' });

    dwr.util.setValue("tab.who1", viewed.username);
    dwr.util.setValue("tab.who2", viewed.username);
    dwr.util.setValue("side.who1", viewed.username);
    dwr.util.setValue("side.who2", viewed.username);

    Network.getFollowing(viewed.username, function(following) {
        dwr.util.removeAllOptions("following");
        if (following.length == 0) {
            dwr.util.addOptions("following", [ "Following no-one." ]);
            return;
        }
        dwr.util.addOptions("following", following, function(user) {
          return getATagForUser(user) +
                 "<img height='24' width='24' src='" + user.avatar + "'/>" +
                 "</a>";
        }, { escapeHtml:false });
    });
    Network.getFollowers(viewed.username, function(followers) {
        // Check to see if the logged in user is following this user
        if (me == null || me.username == viewed.username) {
            dwr.util.byId("follow").style.display = "none";
        }
        else {
            dwr.util.byId("follow").style.display = "inline";
            followingViewed = false;
            for (var i = 0; i < followers.length; i++) {
                if (followers[i].username == me.username) {
                    followingViewed = true;
                }
            }
            if (followingViewed) {
                dwr.util.setValue("follow", "Remove " + user.username);
            }
            else {
                dwr.util.setValue("follow", "Follow " + user.username);
            }
        }
        // Display them all
        dwr.util.removeAllOptions("followers");
        if (followers.length == 0) {
            dwr.util.addOptions("followers", [ "No followers." ]);
            return;
        }
        dwr.util.addOptions("followers", followers, function(user) {
          return getATagForUser(user) +
                 "<img height='24' width='24' src='" + user.avatar + "'/>" +
                 "</a>";
        }, { escapeHtml:false });
    });

    dwr.util.byId("tab_followers").style.display = "inline";
    dwr.util.byId("tab_user").style.display = "inline";
    dwr.util.byId("aboutviewed").style.display = "block";
}

function checkAuthentication(whenDone) {
    Network.getCurrentUser(whenDone);
}

function setAuthentication(user) {
    if (user == null) {
        me = null;
        dwr.util.byId("aboutme").style.display = "none";
        dwr.util.byId("updater").style.display = "none";
        dwr.util.byId("login").style.display = "block";
    }
    else {
        me = user;
        dwr.util.byId("aboutme").style.display = "block";
        dwr.util.byId("updater").style.display = "block";
        dwr.util.byId("login").style.display = "none";
    
        me.status.user = null;
        dwr.util.setValues(me, { prefix:'me' });
        dwr.util.byId("me_user_link").onclick = getLoadUserAction(me.username, USER);
    }
}

function getATagForUser(user) {
    return "<a rel='contact' href='#'" +
           " onclick='loadUser(\"" + user.username + "\", USER);'" +
           " title='" + user.username + "'>"
}

function authFail(message) {
    checkAuthentication(setAuthentication);
    alert(message);
}

/*
function updateHash() {
    setTimeout(function() {
        if (viewed == null) {
            window.location.hash = "#" + mode;
        }
        else {
            window.location.hash = "#" + mode + "-" + viewed.username;
        }
    }, 200);
}

function init() {
    // replace the stuff in the batch with
    hash = window.location.hash;
    if (hash == "" || hash == null) {
        checkAuthentication(setAuthentication);
        displayViewedUser(null);
        setModeInternal(EVERYONE);
    }
    var dashpos = hash.indexOf("-");
    if (dashpos == -1) {
        checkAuthentication(setAuthentication);
        displayViewedUser(null);
        setModeInternal(hash.substring(1));
    }
    else {
        var proposedMode = hash.substring(0, dashpos);
        var proposedUser = hash.substring(dashpos + 1);
        checkAuthentication(setAuthentication);
        setViewed(proposedUser, function(data) {
            displayViewedUser(data);
            if (proposedMode == "#user") {
                setModeInternal(USER);
            }
            else if (proposedMode == "#everyone") {
                setModeInternal(EVERYONE);
            }
            else {
                setModeInternal(FOLLOWERS);
            }
        });
    }
*/
