/**
 * 
 */
package com.example;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;

/**
 * @author joe
 *
 */
public class LimitedSizeList<E> implements List<E>
{
    private int maxSize;

    public LimitedSizeList(int maxSize)
    {
        this.maxSize = maxSize;
    }

    private List<E> proxy = new ArrayList<E>();

    /* (non-Javadoc)
     * @see java.util.List#add(java.lang.Object)
     */
    public boolean add(E e)
    {
        boolean added = proxy.add(e);
        checkSize(this, maxSize);
        return added;
    }

    /**
     * 
     */
    public static void checkSize(List<?> list, int maxSize)
    {
        while(list.size() > maxSize)
        {
            list.remove(maxSize);
        }
    }

    /* (non-Javadoc)
     * @see java.util.List#add(int, java.lang.Object)
     */
    public void add(int index, E element)
    {
        proxy.add(index, element);
        checkSize(this, maxSize);
    }

    /* (non-Javadoc)
     * @see java.util.List#addAll(java.util.Collection)
     */
    public boolean addAll(Collection<? extends E> c)
    {
        boolean added = proxy.addAll(c);
        checkSize(this, maxSize);
        return added;
    }

    /* (non-Javadoc)
     * @see java.util.List#addAll(int, java.util.Collection)
     */
    public boolean addAll(int index, Collection<? extends E> c)
    {
        boolean added = proxy.addAll(index, c);
        checkSize(this, maxSize);
        return added;
    }

    /* (non-Javadoc)
     * @see java.util.List#clear()
     */
    public void clear()
    {
        proxy.clear();
    }

    /* (non-Javadoc)
     * @see java.util.List#contains(java.lang.Object)
     */
    public boolean contains(Object o)
    {
        return proxy.contains(o);
    }

    /* (non-Javadoc)
     * @see java.util.List#containsAll(java.util.Collection)
     */
    public boolean containsAll(Collection<?> c)
    {
        return proxy.containsAll(c);
    }

    /* (non-Javadoc)
     * @see java.lang.Object#equals(java.lang.Object)
     */
    @Override
    public boolean equals(Object o)
    {
        return proxy.equals(o);
    }

    /* (non-Javadoc)
     * @see java.util.List#get(int)
     */
    public E get(int index)
    {
        return proxy.get(index);
    }

    /* (non-Javadoc)
     * @see java.lang.Object#hashCode()
     */
    @Override
    public int hashCode()
    {
        return proxy.hashCode();
    }

    /* (non-Javadoc)
     * @see java.util.List#indexOf(java.lang.Object)
     */
    public int indexOf(Object o)
    {
        return proxy.indexOf(o);
    }

    /* (non-Javadoc)
     * @see java.util.List#isEmpty()
     */
    public boolean isEmpty()
    {
        return proxy.isEmpty();
    }

    /* (non-Javadoc)
     * @see java.util.List#iterator()
     */
    public Iterator<E> iterator()
    {
        return proxy.iterator();
    }

    /* (non-Javadoc)
     * @see java.util.List#lastIndexOf(java.lang.Object)
     */
    public int lastIndexOf(Object o)
    {
        return proxy.lastIndexOf(o);
    }

    /* (non-Javadoc)
     * @see java.util.List#listIterator()
     */
    public ListIterator<E> listIterator()
    {
        return proxy.listIterator();
    }

    /* (non-Javadoc)
     * @see java.util.List#listIterator(int)
     */
    public ListIterator<E> listIterator(int index)
    {
        return proxy.listIterator(index);
    }

    /* (non-Javadoc)
     * @see java.util.List#remove(int)
     */
    public E remove(int index)
    {
        return proxy.remove(index);
    }

    /* (non-Javadoc)
     * @see java.util.List#remove(java.lang.Object)
     */
    public boolean remove(Object o)
    {
        return proxy.remove(o);
    }

    /* (non-Javadoc)
     * @see java.util.List#removeAll(java.util.Collection)
     */
    public boolean removeAll(Collection<?> c)
    {
        return proxy.removeAll(c);
    }

    /* (non-Javadoc)
     * @see java.util.List#retainAll(java.util.Collection)
     */
    public boolean retainAll(Collection<?> c)
    {
        return proxy.retainAll(c);
    }

    /* (non-Javadoc)
     * @see java.util.List#set(int, java.lang.Object)
     */
    public E set(int index, E element)
    {
        return proxy.set(index, element);
    }

    /* (non-Javadoc)
     * @see java.util.List#size()
     */
    public int size()
    {
        return proxy.size();
    }

    /* (non-Javadoc)
     * @see java.util.List#subList(int, int)
     */
    public List<E> subList(int fromIndex, int toIndex)
    {
        return proxy.subList(fromIndex, toIndex);
    }

    /* (non-Javadoc)
     * @see java.util.List#toArray()
     */
    public Object[] toArray()
    {
        return proxy.toArray();
    }

    /* (non-Javadoc)
     * @see java.util.List#toArray(T[])
     */
    public <T> T[] toArray(T[] a)
    {
        return proxy.toArray(a);
    }
}
