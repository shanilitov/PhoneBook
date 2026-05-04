import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import defaultBooks from '../../data/books.json';

const STORAGE_KEY = '@phonebook_books';
const BooksContext = createContext(null);

export function BooksProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(defaultBooks.categories);
  const [loading, setLoading] = useState(true);

  // Load books: merge JSON defaults with any admin-added books from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge: stored books override defaults by id, then append new ones
          const defaultMap = Object.fromEntries(defaultBooks.books.map((b) => [b.id, b]));
          const storedMap = Object.fromEntries(parsed.map((b) => [b.id, b]));
          const merged = Object.values({ ...defaultMap, ...storedMap });
          setBooks(merged);
        } else {
          setBooks(defaultBooks.books);
        }
      } catch (e) {
        console.error('Failed to load books:', e);
        setBooks(defaultBooks.books);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistBooks = useCallback(async (updatedBooks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
    } catch (e) {
      console.error('Failed to persist books:', e);
    }
  }, []);

  const addBook = useCallback(
    async (bookData) => {
      const newBook = {
        id: Date.now().toString(),
        addedDate: new Date().toISOString(),
        rating: 0,
        featured: false,
        isLocal: true,
        ...bookData,
      };
      const updated = [...books, newBook];
      setBooks(updated);
      await persistBooks(updated);
      return newBook;
    },
    [books, persistBooks]
  );

  const updateBook = useCallback(
    async (id, changes) => {
      const updated = books.map((b) => (b.id === id ? { ...b, ...changes } : b));
      setBooks(updated);
      await persistBooks(updated);
    },
    [books, persistBooks]
  );

  const deleteBook = useCallback(
    async (id) => {
      const book = books.find((b) => b.id === id);
      // Remove local PDF copy if it exists in app documents
      if (book?.pdfUri && book.isLocal) {
        try {
          const info = await FileSystem.getInfoAsync(book.pdfUri);
          if (info.exists) {
            await FileSystem.deleteAsync(book.pdfUri, { idempotent: true });
          }
        } catch (_) {
          // non-fatal
        }
      }
      const updated = books.filter((b) => b.id !== id);
      setBooks(updated);
      await persistBooks(updated);
    },
    [books, persistBooks]
  );

  const getBook = useCallback((id) => books.find((b) => b.id === id) || null, [books]);

  const getFeaturedBooks = useCallback(() => books.filter((b) => b.featured), [books]);

  const getBooksByCategory = useCallback(
    (category) => (category === 'All' ? books : books.filter((b) => b.category === category)),
    [books]
  );

  const searchBooks = useCallback(
    (query) => {
      if (!query.trim()) return books;
      const q = query.toLowerCase();
      return books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    },
    [books]
  );

  return (
    <BooksContext.Provider
      value={{
        books,
        categories,
        loading,
        addBook,
        updateBook,
        deleteBook,
        getBook,
        getFeaturedBooks,
        getBooksByCategory,
        searchBooks,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used within BooksProvider');
  return ctx;
}
