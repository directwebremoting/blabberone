
var myFollowers;
var whoImFollowing;
var followingViewed;
var sendBanned = false;

// Functions called from DOM events
function init() {
    dwr.engine.setActiveReverseAjax(true);
    dwr.engine.setErrorHandler(error.customHandler);
    auth.existingChanged();

    dwr.engine.beginBatch();
    auth.check(auth.display);
    user.display(null);
    mode.setInternal(mode.EVERYONE);
    dwr.engine.endBatch();
}

function befriendMe() {
    Network.befriendMe();
}

function updateStatus() {
    if (sendBanned) {
        return;
    }

    var status = dwr.util.getValue("info_input");
    dwr.util.setValue("info_input", "");

    if (status == null) return;
    status = status.replace(/^\s+|\s+$/, '');;
    if (status == "") return;

    dwr.util.setValue("me.status.message", "Sending ...");
    var button = dwr.util.byId("info_send");
    button.disabled = true;
    dwr.util.setValue(button, "Sending ...");

    sendBanned = true;
    Network.updateStatus(status, function() {
        sendBanned = false;
        dwr.util.setValue("me.status.message", status);
        var button = dwr.util.byId("info_send");
        button.disabled = false;
        dwr.util.setValue(button, "Send Message");

        dwr.util.setValue("info_report", "Message sent ...");
        setTimeout(function() {
            dwr.util.setValue("info_report", "");
        }, 2000);

        //tweet.load();
    });
}

function toggleFollow() {
    if (followingViewed) {
        Network.unfollow(user.current.username, user.getLoadAction(user.current.username, mode.USER));
    }
    else {
        Network.follow(user.current.username, user.getLoadAction(user.current.username, mode.USER));
    }
}

function backgroundFocus() {
    dwr.util.byId('save_background').style.display = "inline";
}

function backgroundSubmit() {
    var background = dwr.util.getValue('me_background');
    dwr.util.byId('save_background').disabled = true;
    Network.setBackground(background, function(currentUser) {
        var save = dwr.util.byId('save_background');
        save.disabled = false;
        save.style.display = "none";
        user.load(auth.current.username, mode.USER);
        //document.body.style.background = "#" + currentUser.background;
    });
}

/**
 * Functions for displaying user data
 */
var user = {

    /**
     * The currently viewed user
     */
    current:null,

    /**
     * Create a parameterless closure to call user.load
     */
    getLoadAction:function(displayUser, displayMode) {
        return function() {
            user.load(displayUser, displayMode);
        };
    },

    /**
     * Display a certain user in a given mode
     */
    load:function(displayUser, displayMode) {
        Network.getUser(displayUser, function(data) {
            dwr.engine.beginBatch();
            user.display(data);
            mode.setInternal(displayMode);
            dwr.engine.endBatch();
        });
    },

    /**
     * Place a user in the display on the RHS
     */
    display:function(displayUser) {
        user.current = displayUser;
        if (displayUser == null) {
            user.displayEveryone();
            return;
        }
    
        // bug? setValues dies with recursive data structures
        displayUser.status.user = null;
        dwr.util.setValues(user.current, { prefix:'viewed' });
    
        dwr.util.setValue("tab.who1", user.current.username);
        dwr.util.setValue("tab.who2", user.current.username);
        dwr.util.setValue("side.who1", user.current.username);
        dwr.util.setValue("side.who2", user.current.username);
        document.body.style.background = "#" + user.current.background;
    
        Network.getFollowing(user.current.username, function(following) {
            dwr.util.removeAllOptions("following");
            if (following.length == 0) {
                dwr.util.addOptions("following", [ "Following no-one." ]);
                return;
            }
            dwr.util.addOptions("following", following, user.getThumb, { escapeHtml:false });
        });
        Network.getFollowers(user.current.username, function(followers) {
            // Check to see if the logged in user is following this user
            if (auth.current == null || auth.current.username == user.current.username) {
                dwr.util.byId("follow").style.display = "none";
            }
            else {
                dwr.util.byId("follow").style.display = "inline";
                followingViewed = false;
                for (var i = 0; i < followers.length; i++) {
                    if (followers[i].username == auth.current.username) {
                        followingViewed = true;
                    }
                }
                if (followingViewed) {
                    dwr.util.setValue("follow", "Unfollow " + user.current.username);
                }
                else {
                    dwr.util.setValue("follow", "Follow " + user.current.username);
                }
            }
            // Display them all
            dwr.util.removeAllOptions("followers");
            if (followers.length == 0) {
                dwr.util.addOptions("followers", [ "No followers." ]);
                return;
            }
            dwr.util.addOptions("followers", followers, user.getThumb, { escapeHtml:false });
        });
    
        dwr.util.byId("tab_followers").style.display = "inline";
        dwr.util.byId("tab_user").style.display = "inline";
        dwr.util.byId("tab_everyone").style.display = "none";
        dwr.util.byId("current_user_info").style.display = "block";
        dwr.util.byId("current_user_network").style.display = "block";
        dwr.util.byId("everyone_network").style.display = "none";
    },

    displayEveryone:function() {
        mode.setInternal(mode.EVERYONE);
        dwr.util.byId("tab_followers").style.display = "none";
        dwr.util.byId("tab_user").style.display = "none";
        dwr.util.byId("tab_everyone").style.display = "inline";
        dwr.util.byId("current_user_info").style.display = "none";
        dwr.util.byId("current_user_network").style.display = "none";
        dwr.util.byId("everyone_network").style.display = "block";
        document.body.style.background = "#9ae4e8";

        Network.getAllUsers(function(allUsers) {
            dwr.util.removeAllOptions("everyone");
            dwr.util.addOptions("everyone", allUsers, user.getThumb, { escapeHtml:false });
        });
    },

    getThumb:function(displayUser) {
        return "<a rel='contact' href='#'" +
               " onclick='user.load(\"" + displayUser.username + "\", mode.USER);'" +
               " title='" + displayUser.username + "'>" +
               "<img height='24' width='24' src='" + displayUser.avatar + "'/>" +
               "</a>";
    }
};

/**
 * Authentication functions
 */
var auth = {

    /**
     * The currently authenticated user
     */
    current:null,

    /**
     * Called by the server when it detects a missing auth
     */
    fail: function(message) {
        auth.check(auth.display);
        alert(message);
    },

    /**
     * As the server if we are authenticated
     * @param {Object} whenDone server callback
     */
    check: function(whenDone) {
        Network.getCurrentUser(whenDone);
    },

    /**
     * Display a users auth details
     */
    display: function(displayUser) {
        if (displayUser == null) {
            auth.current = null;
            dwr.util.byId("aboutme").style.display = "none";
            dwr.util.byId("updater").style.display = "none";
            dwr.util.byId("login").style.display = "block";
        }
        else {
            auth.current = displayUser;
            dwr.util.byId("aboutme").style.display = "block";
            dwr.util.byId("updater").style.display = "block";
            dwr.util.byId("login").style.display = "none";
        
            auth.current.status.user = null;
            dwr.util.setValues(auth.current, { prefix:'me' });
            dwr.util.byId("me_user_link").onclick = user.getLoadAction(auth.current.username, mode.USER);
            dwr.util.setValue("me_background", auth.current.background);
        }
    },

    /**
     * Called from submit button on login form
     */
    login: function() {
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
                    auth.display(data);
                    user.display(data);
                    mode.setInternal(mode.USER);
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
                        auth.display(data);
                        user.display(data);
                        mode.setInternal(mode.FOLLOWERS);
                    }
                });
            }
        }
        dwr.engine.endBatch();
        return false;
    },

    /**
     * Called from checkbox: 'i have an existing account'
     */
    existingChanged: function() {
        if (dwr.util.getValue("existing") == true) {
            dwr.util.byId("password2line").style.display = "none";
            dwr.util.setValue("loginSubmit", "Login");
        }
        else {
            dwr.util.byId("password2line").style.display = "block";
            dwr.util.setValue("loginSubmit", "Create Account");
        }
    }
};

/**
 * Tweet handling functions
 */
var tweet = {

    /**
     * The currently displayed tweets
     */
    current:null,

    /**
     * Request a new set of tweets from the server
     */
    load:function() {
        if (mode.current == mode.USER) {
            if (user.current == null) {
                console.log("user.current == null when mode.current == USER");
                return;
            }
            Network.viewUsersTweets(user.current.username, tweet.display);
            dwr.util.byId("tab_followers").className = "";
            dwr.util.byId("tab_user").className = "active";
            dwr.util.byId("tab_everyone").className = "";
        }
        else if (mode.current == mode.EVERYONE) {
            Network.viewAllTweets(tweet.display);
            dwr.util.byId("tab_followers").className = "";
            dwr.util.byId("tab_user").className = "";
            dwr.util.byId("tab_everyone").className = "active";
        }
        else {
            if (user.current == null) {
                console.log("user.current == null when mode.current == FOLLOWER");
                return;
            }
            Network.viewFollowersTweets(user.current.username, tweet.display);
            dwr.util.byId("tab_followers").className = "active";
            dwr.util.byId("tab_user").className = "";
            dwr.util.byId("tab_everyone").className = "";
        }
    },

    /**
     * Called by the server to display a new tweet
     */
    push:function(newTweet) {
        tweet.current.push(newTweet);
        tweet.display(tweet.current);
    },

    /**
     * Push the current list of tweets to the screen
     */
    display:function(data) {
        tweet.current = data;
    
        // Delete all the rows except for the "pattern" row
        dwr.util.removeAllRows("tweets", { filter:function(tr) {
            return (tr.id != "tweet_template");
        }});
    
        for (var i = tweet.current.length - 1; i >= 0; i--) {
            var t = tweet.current[i];
            var username = t.user.username;
            dwr.util.cloneNode("tweet_template", { idSuffix:"_"+i });
        
            dwr.util.setValue("tweet_message_" + i, t.message, { escapeHtml:false });
            var age = Math.floor((new Date().getTime() - t.timestamp) / 60000);
            age = Math.abs(age);
            dwr.util.setValue("tweet_time_" + i, age);
        
            var link = dwr.util.byId("tweet_user_link_" + i);
            link.href = "#";
            link.title = username;
            link.onclick = function() {
                var u = username;
                return user.getLoadAction(u, mode.USER);
            }();
    
            var image = dwr.util.byId("tweet_user_img_" + i);
            image.alt = username;
            image.src = t.user.avatar;
    
            var home = dwr.util.byId("tweet_user_home_" + i);
            home.href = "#";
            home.title = username;
            home.innerHTML = username;
            home.onclick = function() {
                var u = username;
                return user.getLoadAction(u, mode.USER);
            }();
        }
    }
};

/**
 * Functions to handle the viewing mode
 */
var mode = {
    /**
     * 
     */
    current:null,

    // The 3 sets of tweets that we can display
    EVERYONE:"everyone",
    USER:"user",
    FOLLOWERS:"followers",

    /**
     * Set the display mode, for use from a DOM event
     */
    set:function(newMode) {
        dwr.engine.beginBatch();
        mode.setInternal(newMode);
        dwr.engine.endBatch();
    },

    /**
     * Set the display mode, for when you are already in a batch
     */
    setInternal:function(newMode) {
        mode.current = newMode;
        // if we go back to urlhash addressing we might need to check on the mode here
        // updateHash();
        tweet.load();
    }
};

/**
 * Error handling functions
 */
error = {
    /**
     * for dwr.engine.setErrorHandler
     */
    customHandler: function(message, ex) {
        if (message == null || message == "") error.display("A server error has occurred.");
        // Ignore NS_ERROR_NOT_AVAILABLE if Mozilla is being narky
        else if (message.indexOf("0x80040111") != -1) dwr.engine._debug(message);
        else error.display(message);
    },

    /**
     * Push the error into a div
     */
    display: function(message) {
        dwr.util.setValue("error_message", message);
        dwr.util.byId("error").style.display = "block";
    }
};


/*
function updateHash() {
    setTimeout(function() {
        if (user.current == null) {
            window.location.hash = "#" + mode.current;
        }
        else {
            window.location.hash = "#" + mode.current + "-" + user.current.username;
        }
    }, 200);
}

function init() {
    // replace the stuff in the batch with
    hash = window.location.hash;
    if (hash == "" || hash == null) {
        auth.check(auth.display);
        user.display(null);
        mode.setInternal(mode.EVERYONE);
    }
    var dashpos = hash.indexOf("-");
    if (dashpos == -1) {
        auth.check(auth.display);
        user.display(null);
        mode.setInternal(hash.substring(1));
    }
    else {
        var proposedMode = hash.substring(0, dashpos);
        var proposedUser = hash.substring(dashpos + 1);
        auth.check(auth.display);
        setViewed(proposedUser, function(data) {
            user.display(data);
            if (proposedMode == "#user") {
                mode.setInternal(mode.USER);
            }
            else if (proposedMode == "#everyone") {
                mode.setInternal(mode.EVERYONE);
            }
            else {
                mode.setInternal(mode.FOLLOWERS);
            }
        });
    }
*/
