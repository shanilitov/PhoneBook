import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = '@phonebook_bookmarks_';
const BookmarksContext = createContext(null);

export function BookmarksProvider({ children }) {
  // bookmarks: { [bookId]: Bookmark[] }
  const [bookmarks, setBookmarks] = useState({});

  // Load all bookmark keys on mount
  useEffect(() => {
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const bmKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
        if (bmKeys.length === 0) return;
        const pairs = await AsyncStorage.multiGet(bmKeys);
        const loaded = {};
        for (const [key, value] of pairs) {
          const bookId = key.replace(STORAGE_PREFIX, '');
          loaded[bookId] = value ? JSON.parse(value) : [];
        }
        setBookmarks(loaded);
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    })();
  }, []);

  const persistForBook = useCallback(async (bookId, list) => {
    try {
      await AsyncStorage.setItem(STORAGE_PREFIX + bookId, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to persist bookmarks for', bookId, e);
    }
  }, []);

  const getBookmarks = useCallback(
    (bookId) => bookmarks[bookId] || [],
    [bookmarks]
  );

  const addBookmark = useCallback(
    async (bookId, page, note = '') => {
      const existing = bookmarks[bookId] || [];
      // Avoid duplicate pages
      if (existing.some((bm) => bm.page === page)) return null;
      const newBm = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        bookId,
        page,
        note,
        date: new Date().toISOString(),
      };
      const updated = [...existing, newBm].sort((a, b) => a.page - b.page);
      const newState = { ...bookmarks, [bookId]: updated };
      setBookmarks(newState);
      await persistForBook(bookId, updated);
      return newBm;
    },
    [bookmarks, persistForBook]
  );

  const deleteBookmark = useCallback(
    async (bookId, bookmarkId) => {
      const existing = bookmarks[bookId] || [];
      const updated = existing.filter((bm) => bm.id !== bookmarkId);
      const newState = { ...bookmarks, [bookId]: updated };
      setBookmarks(newState);
      await persistForBook(bookId, updated);
    },
    [bookmarks, persistForBook]
  );

  const updateBookmarkNote = useCallback(
    async (bookId, bookmarkId, note) => {
      const existing = bookmarks[bookId] || [];
      const updated = existing.map((bm) =>
        bm.id === bookmarkId ? { ...bm, note } : bm
      );
      const newState = { ...bookmarks, [bookId]: updated };
      setBookmarks(newState);
      await persistForBook(bookId, updated);
    },
    [bookmarks, persistForBook]
  );

  const isPageBookmarked = useCallback(
    (bookId, page) => (bookmarks[bookId] || []).some((bm) => bm.page === page),
    [bookmarks]
  );

  const getAllBookmarks = useCallback(() => {
    const all = [];
    for (const [bookId, list] of Object.entries(bookmarks)) {
      for (const bm of list) {
        all.push({ ...bm, bookId });
      }
    }
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bookmarks]);

  const deleteAllBookmarksForBook = useCallback(
    async (bookId) => {
      const newState = { ...bookmarks };
      delete newState[bookId];
      setBookmarks(newState);
      try {
        await AsyncStorage.removeItem(STORAGE_PREFIX + bookId);
      } catch (e) {
        console.error('Failed to delete bookmarks for', bookId, e);
      }
    },
    [bookmarks]
  );

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        getBookmarks,
        addBookmark,
        deleteBookmark,
        updateBookmarkNote,
        isPageBookmarked,
        getAllBookmarks,
        deleteAllBookmarksForBook,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
}
