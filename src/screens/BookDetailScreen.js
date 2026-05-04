import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { useBookmarks } from '../context/BookmarksContext';
import BookmarkItem from '../components/BookmarkItem';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const { getBook, downloadPdf, cancelDownload, downloadProgress } = useBooks();
  const { getBookmarks, deleteBookmark } = useBookmarks();

  const book = getBook(bookId);
  const bookmarks = getBookmarks(bookId);
  const [downloading, setDownloading] = useState(false);

  const dlProgress = downloadProgress[bookId] ?? null;

  const initials = useMemo(() => {
    if (!book) return '?';
    return book.title
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }, [book]);

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>הספר לא נמצא.</Text>
      </View>
    );
  }

  const handleRead = () => {
    navigation.navigate('Reader', { bookId: book.id });
  };

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadPdf(book.id);
    } catch (e) {
      Alert.alert('שגיאה', 'הורדת ה-PDF נכשלה. בדוק חיבור לאינטרנט.');
    } finally {
      setDownloading(false);
    }
  }, [book, downloadPdf]);

  const handleCancelDownload = useCallback(async () => {
    await cancelDownload(book.id);
    setDownloading(false);
  }, [book, cancelDownload]);

  const handleDeleteBookmark = (bm) => {
    Alert.alert('מחיקת סימנייה', `להסיר סימנייה לעמוד ${bm.page}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחיקה',
        style: 'destructive',
        onPress: () => deleteBookmark(bookId, bm.id),
      },
    ]);
  };

  const handleGoToBookmark = (bm) => {
    navigation.navigate('Reader', { bookId: book.id, initialPage: bm.page });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Hero cover */}
      <View style={[styles.hero, { backgroundColor: book.coverColor || COLORS.primary }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.heroInitials}>{initials}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING['4xl'] }}
      >
        {/* Book meta */}
        <View style={styles.metaCard}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>מאת {book.author}</Text>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Ionicons name="bookmark-outline" size={13} color={COLORS.primary} />
              <Text style={styles.tagText}>{book.category}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="document-text-outline" size={13} color={COLORS.accentGreen} />
              <Text style={styles.tagText}>{book.pages} עמודים</Text>
            </View>
            {book.rating > 0 && (
              <View style={styles.tag}>
                <Ionicons name="star" size={13} color={COLORS.accentYellow} />
                <Text style={styles.tagText}>{book.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {book.description ? (
            <Text style={styles.description}>{book.description}</Text>
          ) : null}
        </View>

        {/* Read button */}
        <TouchableOpacity
          style={[styles.readBtn, { backgroundColor: book.coverColor || COLORS.primary }]}
          onPress={handleRead}
          activeOpacity={0.85}
        >
          <Ionicons name="book-outline" size={22} color={COLORS.white} />
          <Text style={styles.readBtnText}>
            {book.pdfUri ? 'קרא ספר' : 'פתח קורא'}
          </Text>
        </TouchableOpacity>

        {/* Download section — shown only when book has a remote URL */}
        {book.remoteUrl && (
          <View style={styles.downloadSection}>
            {book.pdfUri ? (
              <View style={styles.downloadedRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.accentGreen} />
                <Text style={styles.downloadedText}>הספר מורד ושמור במכשיר</Text>
              </View>
            ) : downloading ? (
              <View style={styles.downloadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.downloadingText}>
                  {dlProgress !== null
                    ? `מוריד... ${Math.round(dlProgress * 100)}%`
                    : 'מוריד...'}
                </Text>
                <TouchableOpacity onPress={handleCancelDownload}>
                  <Ionicons name="close-circle-outline" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                <Ionicons name="cloud-download-outline" size={20} color={COLORS.primary} />
                <Text style={styles.downloadBtnText}>הורד לקריאה אופליין</Text>
              </TouchableOpacity>
            )}
            {downloading && dlProgress !== null && (
              <View style={styles.downloadTrack}>
                <View style={[styles.downloadFill, { width: `${Math.round(dlProgress * 100)}%` }]} />
              </View>
            )}
          </View>
        )}

        {/* Bookmarks */}
        <View style={styles.bookmarksSection}>
          <View style={styles.bookmarkHeader}>
            <Text style={styles.sectionTitle}>
              סימניות
              {bookmarks.length > 0 && (
                <Text style={styles.countBadge}>  {bookmarks.length}</Text>
              )}
            </Text>
          </View>

          {bookmarks.length === 0 ? (
            <View style={styles.emptyBookmarks}>
              <Ionicons name="bookmark-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>אין סימניות עדיין</Text>
              <Text style={styles.emptySubText}>
                לחץ על סמל הסימנייה בזמן הקריאה כדי לשמור עמוד
              </Text>
            </View>
          ) : (
            bookmarks.map((bm) => (
              <BookmarkItem
                key={bm.id}
                bookmark={bm}
                onPress={handleGoToBookmark}
                onDelete={handleDeleteBookmark}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
  },
  hero: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.full,
    padding: SPACING.sm,
    zIndex: 10,
  },
  heroInitials: {
    fontSize: FONT_SIZES['5xl'],
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
  },
  scroll: {
    flex: 1,
  },
  metaCard: {
    backgroundColor: COLORS.backgroundCard,
    margin: SPACING.base,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  author: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  description: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
    marginBottom: SPACING.xl,
  },
  readBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  bookmarksSection: {
    paddingBottom: SPACING.xl,
  },
  bookmarkHeader: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  countBadge: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  emptyBookmarks: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  emptySubText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  downloadSection: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  downloadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  downloadedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accentGreen,
    fontWeight: '600',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  downloadBtnText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  downloadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  downloadingText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  downloadTrack: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  downloadFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
});
