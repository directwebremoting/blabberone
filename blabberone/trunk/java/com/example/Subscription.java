/**
 * 
 */
package com.example;

import java.util.HashMap;
import java.util.Map;

/**
 * @author joe
 *
 */
public class Subscription
{
    public static final Subscription ALL = new Subscription(Mode.All, null);

    public static Subscription user(User user)
    {
        Subscription sub = subscriptions.get(user);
        if (sub == null)
        {
            sub = new Subscription(Mode.User, user);
            subscriptions.put(user, sub);
        }
        return sub;
    }

    public static Subscription follower(User user)
    {
        Subscription sub = subscriptions.get(user);
        if (sub == null)
        {
            sub = new Subscription(Mode.Follower, user);
            subscriptions.put(user, sub);
        }
        return sub;
    }

    private Mode mode;
    private User user;

    private Subscription(Mode mode, User user)
    {
        this.mode = mode;
        this.user = user;
    }

    public User getUser()
    {
        return user;
    }

    public Mode getMode()
    {
        return mode;
    }

    /* (non-Javadoc)
     * @see java.lang.Object#equals(java.lang.Object)
     */
    @Override
    public boolean equals(Object obj)
    {
        if (obj == null)
        {
            return false;
        }
        if (obj == this)
        {
            return true;
        }
        if (!this.getClass().equals(obj.getClass()))
        {
            return false;
        }
        Subscription that = (Subscription) obj;

        if (!this.mode.equals(that.mode))
        {
            return false;
        }

        if (!this.user.equals(that.user))
        {
            return false;
        }

        return true;
    }

    public static enum Mode
    {
        All,
        User,
        Follower,
    }

    private static final Map<User, Subscription> subscriptions = new HashMap<User, Subscription>();
}
