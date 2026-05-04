import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

function getSectionTitle(query, selectedCategory) {
  if (query.trim()) return `תוצאות עבור "${query}"`;
  if (selectedCategory === 'הכל') return 'כל הספרים';
  return selectedCategory;
}

export default function HomeScreen({ navigation }) {
  const { books, categories, loading, getFeaturedBooks, getBooksByCategory, searchBooks } =
    useBooks();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('הכל');

  const allCategories = useMemo(() => ['הכל', ...categories], [categories]);

  const displayedBooks = useMemo(() => {
    if (query.trim()) return searchBooks(query);
    return getBooksByCategory(selectedCategory === 'הכל' ? 'All' : selectedCategory);
  }, [query, selectedCategory, books]);

  const featuredBooks = useMemo(() => getFeaturedBooks(), [books]);

  const handleBookPress = useCallback(
    (book) => navigation.navigate('BookDetail', { bookId: book.id }),
    [navigation]
  );

  const renderBook = useCallback(
    ({ item }) => <BookCard book={item} onPress={handleBookPress} style={styles.gridCard} />,
    [handleBookPress]
  );

  // Memoized header element rendered above the grid items
  const listHeader = useMemo(
    () => (
      <View>
        {/* Featured section */}
        {!query.trim() && featuredBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ מומלצים</Text>
            <FlatList
              horizontal
              data={featuredBooks}
              keyExtractor={(b) => b.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              renderItem={({ item }) => <FeaturedCard book={item} onPress={handleBookPress} />}
            />
          </View>
        )}

        {/* Category pills */}
        {!query.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {allCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Section title + count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {getSectionTitle(query, selectedCategory)}
            <Text style={styles.countText}>  {displayedBooks.length}</Text>
          </Text>
        </View>
      </View>
    ),
    [query, featuredBooks, allCategories, selectedCategory, displayedBooks.length, handleBookPress]
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="library-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>לא נמצאו ספרים</Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Fixed header — stays above the scrollable list */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>ברוך הבא 📚</Text>
          <Text style={styles.headerTitle}>הספרייה שלך</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.navigate('Admin')}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Fixed search bar */}
      <View style={styles.searchWrapper}>
        <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} />
      </View>

      {/* Virtualized book grid */}
      <FlatList
        data={displayedBooks}
        numColumns={2}
        keyExtractor={(b) => b.id}
        renderItem={renderBook}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function FeaturedCard({ book, onPress }) {
  const initials = book.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: book.coverColor || COLORS.primary }]}
      onPress={() => onPress(book)}
      activeOpacity={0.85}
    >
      <Text style={styles.featuredInitials}>{initials}</Text>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.featuredAuthor} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.featuredRating}>
          <Ionicons name="star" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.featuredRatingText}>{book.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '800',
    color: COLORS.text,
  },
  headerIcon: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
  },
  searchWrapper: {
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.xs,
  },
  section: {
    paddingTop: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  countText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  featuredList: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  featuredCard: {
    width: 200,
    height: 130,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  featuredInitials: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  featuredInfo: {},
  featuredTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  featuredAuthor: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  featuredRatingText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  categoryList: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  categoryPill: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: COLORS.white,
  },
  columnWrapper: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  gridCard: {
    flex: 1,
    marginBottom: SPACING.sm,
  },
  flatListContent: {
    paddingBottom: SPACING['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyText: {
    marginTop: SPACING.base,
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
  },
});

