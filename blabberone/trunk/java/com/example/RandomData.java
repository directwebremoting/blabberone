/*
 * Copyright 2005 Joe Walker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Random;

/**
 * @author Joe Walker [joe at getahead dot ltd dot uk]
 */
public class RandomData
{
    static interface Factory<T>
    {
        T create();
    }

    public static <T> Factory<T> getRandomInstanceFactory(Collection<T> source)
    {
        final List<T> list = new ArrayList<T>(source);
        return new Factory<T>()
        {
            public T create()
            {
                return list.get(random.nextInt(list.size()));
            }
        };
    }

    public static String getFirstName()
    {
        return FIRSTNAMES[random.nextInt(FIRSTNAMES.length)];
    }

    public static String getSurname()
    {
        return SURNAMES[random.nextInt(SURNAMES.length)];
    }

    public static String getFullName()
    {
        return getFirstName() + " " + getSurname();
    }

    protected static final Random random = new Random();

    private static final String[] FIRSTNAMES =
    {
        "Fred", "Jim", "Shiela", "Jack", "Betty", "Jacob", "Martha", "Kelly",
        "Luke", "Matt", "Gemma", "Joe", "Ben", "Jessie", "Leanne", "Becky",
        "William", "Jo", "Frank", "Alex", "Chris", "Sarah", "Dylan", "Jake",
        "John", "James", "Mark", "Doug", "Dustin", "Mike", "Peter", "Robert",
        "Sam", "Paul", "Aimee", "Kevin", "Patrick", "Brian", "Tim", "Joshua",
        "David", "Sheila", "Billy", "Bob", "Harry", "Liz", "Betty", "Mary"
    };

    private static final String[] SURNAMES =
    {
        "Sutcliffe", "MacDonald", "Duckworth", "Smith", "Wisner", "Russell",
        "Nield", "Turton", "Trelfer", "Wilson", "Johnson", "Daniels",
        "Jones", "Wilkinson", "Wilton", "Lea", "Bloch", "Gosling",
        "Wilcox", "Foster", "Hakman", "Schiemann", "Jones"
    };
}
