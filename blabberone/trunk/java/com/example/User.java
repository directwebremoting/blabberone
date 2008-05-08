/**
 * 
 */
package com.example;


/**
 * @author joe
 */
public class User
{
    public User(String username)
    {
        this.username = username;
    }

    public User(String username, String password)
    {
        this.username = username;
        this.password = password;
        this.avatar = "images/" + (Math.abs(username.hashCode()) % 75) + ".png";
        this.background = RandomData.getColor();
    }

    /**
     * The PK for a user
     */
    private String username;
    public String getUsername() { return username; }

    private String password;
    public void setPassword(String password) { this.password = password; }
    public String getPassword() { return password; }

    private String status = "No status update so far";
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    private String avatar;
    // public void setAvator(String avatar) { this.avatar = avatar; }
    public String getAvatar() { return avatar; }

    private String background;
    public String getBackground() { return background; }
    public void setBackground(String background) { this.background = background; }

    /* (non-Javadoc)
     * @see java.lang.Object#hashCode()
     */
    @Override
    public int hashCode()
    {
        return username.hashCode();
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

        User that = (User) obj;
        return this.username.equals(that.username);
    }
}
