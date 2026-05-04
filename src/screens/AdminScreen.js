import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { useBookmarks } from '../context/BookmarksContext';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

const COVER_COLORS = [
  '#6C63FF', '#FF6584', '#43B89C', '#F7B731', '#26de81',
  '#fd9644', '#a55eea', '#2bcbba', '#eb3b5a', '#4b7bec',
];

const EMPTY_FORM = {
  title: '',
  author: '',
  description: '',
  category: '',
  pages: '',
  coverColor: COVER_COLORS[0],
  pdfUri: null,
  pdfName: null,
  rating: '',
};

export default function AdminScreen({ navigation }) {
  const { books, addBook, updateBook, deleteBook, categories } = useBooks();
  const { deleteAllBookmarksForBook } = useBookmarks();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      description: book.description || '',
      category: book.category || '',
      pages: book.pages?.toString() || '',
      coverColor: book.coverColor || COVER_COLORS[0],
      pdfUri: book.pdfUri || null,
      pdfName: book.pdfUri ? 'Current PDF' : null,
      rating: book.rating?.toString() || '',
    });
    setModalVisible(true);
  };

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const destDir = FileSystem.documentDirectory + 'pdfs/';
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const safeTitle = (form.title || 'book').replace(/[^a-z0-9]/gi, '_');
      const destUri = destDir + `${safeTitle}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      setForm((f) => ({ ...f, pdfUri: destUri, pdfName: asset.name }));
    } catch (e) {
      Alert.alert('Error', 'Could not pick PDF.');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!form.author.trim()) {
      Alert.alert('Validation', 'Author is required.');
      return;
    }
    setSaving(true);
    try {
      const bookData = {
        title: form.title.trim(),
        author: form.author.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'Uncategorized',
        pages: parseInt(form.pages, 10) || 0,
        coverColor: form.coverColor,
        pdfUri: form.pdfUri || null,
        isLocal: !!form.pdfUri,
        rating: parseFloat(form.rating) || 0,
      };
      if (editingBook) {
        await updateBook(editingBook.id, bookData);
      } else {
        await addBook(bookData);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save book.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.title}"? All bookmarks for this book will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAllBookmarksForBook(book.id);
            await deleteBook(book.id);
          },
        },
      ]
    );
  };

  const renderBook = ({ item }) => (
    <View style={styles.bookRow}>
      <View style={[styles.bookRowCover, { backgroundColor: item.coverColor || COLORS.primary }]}>
        <Text style={styles.bookRowInitials}>
          {item.title
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.bookRowInfo}>
        <Text style={styles.bookRowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookRowAuthor} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.bookRowMeta}>
          {item.category}  ·  {item.pages} pages
          {item.pdfUri ? '  ·  📄 PDF' : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
        <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>{books.length} books in library</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        renderItem={renderBook}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No books yet. Add your first book!</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Book title"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* Author */}
              <Text style={styles.label}>Author *</Text>
              <TextInput
                style={styles.input}
                value={form.author}
                onChangeText={(v) => setForm((f) => ({ ...f, author: v }))}
                placeholder="Author name"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Short description..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Category */}
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="e.g. Fiction, Science..."
                placeholderTextColor={COLORS.textMuted}
              />

              {/* Pages */}
              <Text style={styles.label}>Number of Pages</Text>
              <TextInput
                style={styles.input}
                value={form.pages}
                onChangeText={(v) => setForm((f) => ({ ...f, pages: v }))}
                placeholder="e.g. 320"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
              />

              {/* Rating */}
              <Text style={styles.label}>Rating (0–5)</Text>
              <TextInput
                style={styles.input}
                value={form.rating}
                onChangeText={(v) => setForm((f) => ({ ...f, rating: v }))}
                placeholder="e.g. 4.5"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />

              {/* Cover color */}
              <Text style={styles.label}>Cover Color</Text>
              <View style={styles.colorRow}>
                {COVER_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      form.coverColor === color && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, coverColor: color }))}
                  />
                ))}
              </View>

              {/* PDF picker */}
              <Text style={styles.label}>PDF File</Text>
              <TouchableOpacity style={styles.pdfPickerBtn} onPress={handlePickPdf}>
                <Ionicons
                  name={form.pdfUri ? 'document-text' : 'folder-open-outline'}
                  size={22}
                  color={form.pdfUri ? COLORS.accentGreen : COLORS.primary}
                />
                <Text
                  style={[
                    styles.pdfPickerText,
                    form.pdfUri && { color: COLORS.accentGreen },
                  ]}
                  numberOfLines={1}
                >
                  {form.pdfName || 'Choose PDF File...'}
                </Text>
                {form.pdfUri && (
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, pdfUri: null, pdfName: null }))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>
                      {editingBook ? 'Save Changes' : 'Add Book'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  list: {
    padding: SPACING.base,
    paddingBottom: SPACING['4xl'],
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookRowCover: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  bookRowInitials: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  bookRowInfo: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  bookRowTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookRowAuthor: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bookRowMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  iconBtn: {
    padding: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.base,
    textAlign: 'center',
  },
  // Modal
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: SPACING.base,
    paddingBottom: SPACING['5xl'],
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: COLORS.white,
    transform: [{ scale: 1.15 }],
  },
  pdfPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  pdfPickerText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.base,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
});
