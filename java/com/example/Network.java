/**
 * 
 */
package com.example;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpSession;

import org.directwebremoting.Browser;
import org.directwebremoting.ScriptSession;
import org.directwebremoting.WebContext;
import org.directwebremoting.WebContextFactory;
import org.directwebremoting.ui.ScriptProxy;

import com.example.RandomData.Factory;

/**
 *
 */
public class Network
{
    public Network()
    {
        createTweet(system, "System started");
    }

    public void befriendMe()
    {
        User currentUser = getCurrentUser();
        if (currentUser == null)
        {
            ScriptProxy.addFunctionCall("authFail", "No session found. Are cookies enabled?");
            return;
        }

        // Add 10 followers to each user
        Factory<User> factory = RandomData.getRandomInstanceFactory(users.values());
        for (int i = 0; i < 10; i++)
        {
            User popular = factory.create();
            if (!currentUser.equals(popular) && !currentUser.equals(system))
            {
                follow(currentUser, popular);
            }
        }
    }

    public User createUser(String username, String password)
    {
        User user = createUserInternal(username, password);
        if (user != null)
        {
            WebContextFactory.get().getSession(true).setAttribute("user", user);
        }

        return user;
    }

    private User createUserInternal(String username, String password)
    {
        if (users.containsKey(username))
        {
            return null;
        }

        User user = new User(username, password);
        users.put(username, user);
        userTweets.put(user, new LimitedSizeList<Tweet>(20));
        whoUserIsFollowing.put(user, new HashSet<User>());
        usersFollowers.put(user, new HashSet<User>());
        return user;
    }

    public void updateStatus(String message)
    {
        User currentUser = getCurrentUser();
        if (currentUser == null)
        {
            ScriptProxy.addFunctionCall("authFail", "No session found. Are cookies enabled?");
            return;
        }

        createTweet(currentUser, message);
    }

    public void follow(String toFollow)
    {
        User me = getCurrentUser();
        if (me == null)
        {
            ScriptProxy.addFunctionCall("authFail", "No session found. Are cookies enabled?");
            return;
        }

        User interest = users.get(toFollow);
        follow(me, interest);
    }

    public void unfollow(String toFollow)
    {
        User me = getCurrentUser();
        if (me == null)
        {
            ScriptProxy.addFunctionCall("authFail", "No session found. Are cookies enabled?");
            return;
        }

        User interest = users.get(toFollow);
        unfollow(me, interest);
    }

    private void follow(User stalker, User popular)
    {
        Set<User> followers = usersFollowers.get(popular);
        followers.add(stalker);

        Set<User> following = whoUserIsFollowing.get(stalker);
        following.add(popular);
    }

    private void unfollow(User stalker, User popular)
    {
        Set<User> followers = usersFollowers.get(popular);
        followers.remove(stalker);

        Set<User> following = whoUserIsFollowing.get(stalker);
        following.remove(popular);
    }

    public Set<User> getFollowing(String username)
    {
        User user = users.get(username);
        return whoUserIsFollowing.get(user);
    }

    public Set<User> getFollowers(String username)
    {
        User user = users.get(username);
        return usersFollowers.get(user);
    }

    public List<Tweet> viewUsersTweets(String username)
    {
        User user = users.get(username);
        if (user == null)
        {
            throw new IllegalStateException();
        }

        if (REVERSE_AJAX)
        {
            ScriptSession scriptSession = WebContextFactory.get().getScriptSession();
            scriptSession.setAttribute("subscription", Subscription.user(user));
        }

        return userTweets.get(user);
    }

    public List<Tweet> viewAllTweets()
    {
        if (REVERSE_AJAX)
        {
            ScriptSession scriptSession = WebContextFactory.get().getScriptSession();
            scriptSession.setAttribute("subscription", Subscription.ALL);
        }
        return allTweets;
    }

    public List<Tweet> viewFollowersTweets(String username)
    {
        User user = users.get(username);
        if (user == null)
        {
            throw new IllegalStateException();
        }

        if (REVERSE_AJAX)
        {
            ScriptSession scriptSession = WebContextFactory.get().getScriptSession();
            scriptSession.setAttribute("subscription", Subscription.follower(user));
        }

        List<Tweet> candidates = new ArrayList<Tweet>();
        Set<User> allInterested = whoUserIsFollowing.get(user);
        for (User interest : allInterested)
        {
            candidates.addAll(userTweets.get(interest));
        }

        Collections.sort(candidates);
        LimitedSizeList.checkSize(candidates, 20);

        return candidates;
    }

    public User getCurrentUser()
    {
        HttpSession session = WebContextFactory.get().getSession(false);
        if (session == null)
        {
            return null;
        }
        return (User) session.getAttribute("user");
    }

    public User getUser(String username)
    {
        return users.get(username);
    }

    public User login(String username, String password)
    {
        User user = users.get(username);
        if (user == null)
        {
            return null;
        }

        boolean allowed = user.getPassword().equals(password);

        if (allowed)
        {
            WebContextFactory.get().getSession(true).setAttribute("user", user);
            return user;
        }
        else
        {
            return null;
        }
    }

    private void createTweet(User currentUser, String message)
    {
        final Tweet tweet = new Tweet(message, currentUser);
        currentUser.setStatus(tweet);
        userTweets.get(currentUser).add(tweet);
        allTweets.add(tweet);

        Collection<ScriptSession> interested = getInterestedScriptSessions(currentUser);

        Browser.withSessions(interested, new Runnable()
        {
            public void run()
            {
                ScriptProxy.addFunctionCall("displayTweet", tweet);
            }
        });
    }

    private Collection<ScriptSession> getInterestedScriptSessions(User currentUser)
    {
        Collection<ScriptSession> interested = new HashSet<ScriptSession>();
        WebContext webContext = WebContextFactory.get();
        for (ScriptSession session : webContext.getAllScriptSessions())
        {
            Subscription sub = (Subscription) session.getAttribute("subscription");
            if (sub == null)
            {
                continue;
            }

            Subscription.Mode mode = sub.getMode();
            switch (mode)
            {
            case All:
                interested.add(session);
                break;

            case User:
                if (sub.getUser() == currentUser)
                {
                    interested.add(session);
                }
                break;

            case Follower:
                for (User test : whoUserIsFollowing.get(currentUser))
                {
                    if (sub.getUser().equals(test))
                    {
                        interested.add(session);
                    }
                }
                break;
            }
        }
        return interested;
    }

    private static final boolean REVERSE_AJAX = true;
    private Map<String, User> users = new HashMap<String, User>();
    private Map<User, Set<User>> whoUserIsFollowing = new HashMap<User, Set<User>>();
    private Map<User, Set<User>> usersFollowers = new HashMap<User, Set<User>>();
    private Map<User, List<Tweet>> userTweets = new HashMap<User, List<Tweet>>();
    private List<Tweet> allTweets = new LimitedSizeList<Tweet>(20);
    private User system = createUserInternal("System", "5y5t3m");
}
