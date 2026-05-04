import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

export default function BookmarkItem({ bookmark, bookTitle, onPress, onDelete }) {
  const formattedDate = new Date(bookmark.date).toLocaleDateString('he-IL', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(bookmark)}
      activeOpacity={0.8}
    >
      <View style={styles.pageIndicator}>
        <Ionicons name="bookmark" size={16} color={COLORS.primary} />
        <Text style={styles.pageNumber}>{bookmark.page}</Text>
      </View>

      <View style={styles.content}>
        {bookTitle && <Text style={styles.bookTitle} numberOfLines={1}>{bookTitle}</Text>}
        <Text style={styles.label}>עמוד {bookmark.page}</Text>
        {bookmark.note ? (
          <Text style={styles.note} numberOfLines={2}>
            {bookmark.note}
          </Text>
        ) : null}
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete && onDelete(bookmark)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.xs,
    padding: SPACING.base,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  pageNumber: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  bookTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  note: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  deleteBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});
