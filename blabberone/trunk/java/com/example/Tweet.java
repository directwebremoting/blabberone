/**
 * 
 */
package com.example;

public class Tweet implements Comparable<Tweet>
{
    public Tweet(String message, User user)
    {
        this.message = message;
        this.user = user;
        this.timestamp = System.currentTimeMillis();
    }

    private User user;
    public User getUser() { return user; }

    private String message;
    public String getMessage() { return message; }

    private long timestamp;
    public long getTimestamp() { return timestamp; }

    /* (non-Javadoc)
     * @see java.lang.Comparable#compareTo(java.lang.Object)
     */
    public int compareTo(Tweet that)
    {
        return this.timestamp < that.timestamp ? -1 : (this.timestamp == that.timestamp ? 0 : 1);
    }
}
