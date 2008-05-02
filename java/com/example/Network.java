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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.directwebremoting.Browser;
import org.directwebremoting.ScriptSession;
import org.directwebremoting.ScriptSessionFilter;
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
            ScriptProxy.addFunctionCall("auth.fail", "No session found. Are cookies enabled?");
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
            ScriptProxy.addFunctionCall("auth.fail", "No session found. Are cookies enabled?");
            return;
        }

        createTweet(currentUser, message);
    }

    public User setBackground(String color)
    {
        User currentUser = getCurrentUser();
        if (currentUser == null)
        {
            ScriptProxy.addFunctionCall("auth.fail", "No session found. Are cookies enabled?");
            return null;
        }

        if (color.length() != 3 && color.length() != 6)
        {
            ScriptProxy.addFunctionCall("error.display", "Invalid color. Value must be 3 or 6 hex-digits.");
            return null;
        }

        for (int i = 0; i < color.length(); i++)
        {
            char ch = Character.toLowerCase(color.charAt(i));
            if (!Character.isDigit(ch) && (ch < 'a' || ch > 'f'))
            {
                ScriptProxy.addFunctionCall("error.display", "Invalid color. Contains non-hex-digits.");
                return null;
            }
        }

        currentUser.setBackground(color);
        return currentUser;
    }

    public void follow(String toFollow)
    {
        User me = getCurrentUser();
        if (me == null)
        {
            ScriptProxy.addFunctionCall("auth.fail", "No session found. Are cookies enabled?");
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
            ScriptProxy.addFunctionCall("auth.fail", "No session found. Are cookies enabled?");
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
            Subscription sub = Subscription.user(user);
            scriptSession.setAttribute("subscription", sub);
            log.debug("Putting " + scriptSession.getId() + " into " + sub);
        }

        return userTweets.get(user);
    }

    public List<Tweet> viewAllTweets()
    {
        if (REVERSE_AJAX)
        {
            ScriptSession scriptSession = WebContextFactory.get().getScriptSession();
            scriptSession.setAttribute("subscription", Subscription.ALL);
            log.debug("Putting " + scriptSession.getId() + " into " + Subscription.ALL);
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
            Subscription sub = Subscription.follower(user);
            scriptSession.setAttribute("subscription", sub);
            log.debug("Putting " + scriptSession.getId() + " into " + sub);
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

    public Collection<User> getAllUsers()
    {
        return users.values();
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

        ScriptSessionFilter filter = new InterestedScriptSessionFilter(currentUser);
        Browser.withAllSessionsFiltered(filter, new Runnable()
        {
            public void run()
            {
                ScriptProxy.addFunctionCall("tweet.push", tweet);
            }
        });
    }

    private class InterestedScriptSessionFilter implements ScriptSessionFilter
    {
        private User currentUser;

        public InterestedScriptSessionFilter(User currentUser)
        {
            this.currentUser = currentUser;
        }

        /* (non-Javadoc)
         * @see org.directwebremoting.ScriptSessionFilter#match(org.directwebremoting.ScriptSession)
         */
        public boolean match(ScriptSession session)
        {
            Subscription sub = (Subscription) session.getAttribute("subscription");
            if (sub == null)
            {
                return false;
            }

            Subscription.Mode mode = sub.getMode();
            switch (mode)
            {
            case All:
                return true;

            case User:
                return sub.getUser().equals(currentUser);

            case Follower:
                for (User test : whoUserIsFollowing.get(currentUser))
                {
                    if (sub.getUser().equals(test))
                    {
                        return true;
                    }
                }
                break;
            }

            return false;
        }
    }

    private static final boolean REVERSE_AJAX = true;
    private Map<String, User> users = new HashMap<String, User>();
    protected Map<User, Set<User>> whoUserIsFollowing = new HashMap<User, Set<User>>();
    private Map<User, Set<User>> usersFollowers = new HashMap<User, Set<User>>();
    private Map<User, List<Tweet>> userTweets = new HashMap<User, List<Tweet>>();
    private List<Tweet> allTweets = new LimitedSizeList<Tweet>(20);
    private User system = createUserInternal("System", "5y5t3m");
    private static final Log log = LogFactory.getLog(Network.class);
}
