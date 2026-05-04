import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import defaultBooks from '../../data/books.json';

const STORAGE_KEY = '@phonebook_books';
const PDFS_DIR = FileSystem.documentDirectory + 'pdfs/';
const BooksContext = createContext(null);

export function BooksProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(defaultBooks.categories);
  const [loading, setLoading] = useState(true);
  // Map of bookId -> download progress (0–1), or null if not downloading
  const [downloadProgress, setDownloadProgress] = useState({});
  const downloadResumables = useRef({});

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
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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

  /**
   * Download a book's PDF from book.remoteUrl, cache it in the app documents
   * directory, and persist the local path in book.pdfUri.
   * Returns the local URI on success, or throws on failure.
   */
  const downloadPdf = useCallback(
    async (id) => {
      const book = books.find((b) => b.id === id);
      if (!book) throw new Error('ספר לא נמצא');
      if (!book.remoteUrl) throw new Error('אין כתובת הורדה לספר זה');
      // Validate that the URL is safe to download from (HTTPS only)
      let parsedUrl;
      try {
        parsedUrl = new URL(book.remoteUrl);
      } catch {
        throw new Error('כתובת ההורדה אינה בפורמט URL תקין');
      }
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('כתובת ההורדה חייבת להשתמש ב-HTTPS');
      }
      // Return cached local file if it already exists
      if (book.pdfUri) {
        const info = await FileSystem.getInfoAsync(book.pdfUri);
        if (info.exists) return book.pdfUri;
      }
      await FileSystem.makeDirectoryAsync(PDFS_DIR, { intermediates: true });
      const destUri = PDFS_DIR + `book_${id}.pdf`;
      setDownloadProgress((prev) => ({ ...prev, [id]: 0 }));
      const resumable = FileSystem.createDownloadResumable(
        book.remoteUrl,
        destUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setDownloadProgress((prev) => ({
              ...prev,
              [id]: totalBytesWritten / totalBytesExpectedToWrite,
            }));
          }
        }
      );
      downloadResumables.current[id] = resumable;
      try {
        const result = await resumable.downloadAsync();
        const localUri = result?.uri || destUri;
        await updateBook(id, { pdfUri: localUri, isLocal: true });
        return localUri;
      } finally {
        delete downloadResumables.current[id];
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [books, updateBook]
  );

  /** Cancel an in-progress download */
  const cancelDownload = useCallback(async (id) => {
    const resumable = downloadResumables.current[id];
    if (resumable) {
      try {
        await resumable.pauseAsync();
        const info = await FileSystem.getInfoAsync(PDFS_DIR + `book_${id}.pdf`);
        if (info.exists) {
          await FileSystem.deleteAsync(PDFS_DIR + `book_${id}.pdf`, { idempotent: true });
        }
      } catch (_) {
        // non-fatal
      }
      delete downloadResumables.current[id];
    }
    setDownloadProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

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
        downloadPdf,
        cancelDownload,
        downloadProgress,
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
