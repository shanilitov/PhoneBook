import React, { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { useBookmarks } from '../context/BookmarksContext';
import BookmarkItem from '../components/BookmarkItem';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme';

export default function BookmarksScreen({ navigation }) {
  const { getBook } = useBooks();
  const { bookmarks, deleteBookmark } = useBookmarks();

  // Build sections: one per book that has bookmarks
  const sections = useMemo(() => {
    const result = [];
    for (const [bookId, list] of Object.entries(bookmarks)) {
      if (!list || list.length === 0) continue;
      const book = getBook(bookId);
      result.push({
        bookId,
        bookTitle: book?.title || 'Unknown Book',
        coverColor: book?.coverColor || COLORS.primary,
        data: [...list].sort((a, b) => a.page - b.page),
      });
    }
    return result.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
  }, [bookmarks, getBook]);

  const totalCount = useMemo(
    () => sections.reduce((acc, s) => acc + s.data.length, 0),
    [sections]
  );

  const handleDelete = (bookId, bm) => {
    Alert.alert('Delete Bookmark', `Remove bookmark for page ${bm.page}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteBookmark(bookId, bm.id),
      },
    ]);
  };

  const handlePress = (bookId, bm) => {
    navigation.navigate('Library', {
      screen: 'Reader',
      params: { bookId, initialPage: bm.page },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <Text style={styles.headerCount}>{totalCount} total</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmarks-outline" size={72} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Open a book and tap the bookmark icon{'\n'}to save pages for later
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING['4xl'] }}
          renderSectionHeader={({ section }) => (
            <View
              style={[styles.sectionHeader, { borderLeftColor: section.coverColor }]}
            >
              <Ionicons name="library-outline" size={16} color={section.coverColor} />
              <Text style={styles.sectionTitle} numberOfLines={1}>
                {section.bookTitle}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: section.coverColor }]}>
                <Text style={styles.sectionCountText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item, section }) => (
            <BookmarkItem
              bookmark={item}
              onPress={(bm) => handlePress(section.bookId, bm)}
              onDelete={(bm) => handleDelete(section.bookId, bm)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '800',
    color: COLORS.text,
  },
  headerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 3,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sectionCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.base,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});
