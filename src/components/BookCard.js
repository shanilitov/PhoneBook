import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

export default function BookCard({ book, onPress, style }) {
  const initials = book.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(book)}
      activeOpacity={0.85}
    >
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: book.coverColor || COLORS.primary }]}>
        <Text style={styles.initials}>{initials}</Text>
        {book.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={COLORS.accentYellow} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{book.category}</Text>
          {book.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color={COLORS.accentYellow} />
              <Text style={styles.rating}>{book.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  initials: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },
  featuredBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: RADIUS.full,
    padding: 4,
  },
  info: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  author: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.accentYellow,
    fontWeight: '600',
  },
});
