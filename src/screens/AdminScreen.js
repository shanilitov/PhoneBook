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
  remoteUrl: '',
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
      remoteUrl: book.remoteUrl || '',
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
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ PDF.');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('שגיאה', 'שדה הכותרת הוא חובה.');
      return;
    }
    if (!form.author.trim()) {
      Alert.alert('שגיאה', 'שדה המחבר הוא חובה.');
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
        remoteUrl: form.remoteUrl.trim() || null,
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
      Alert.alert('שגיאה', 'שמירת הספר נכשלה.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (book) => {
    Alert.alert(
      'מחיקת ספר',
      `האם אתה בטוח שברצונך למחוק את "${book.title}"? כל הסימניות לספר זה יוסרו גם כן.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחיקה',
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
          {item.category}  ·  {item.pages} עמודים
          {item.pdfUri ? '  ·  📄 PDF' : ''}
          {item.remoteUrl && !item.pdfUri ? '  ·  ☁️ Remote' : ''}
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
          <Text style={styles.headerTitle}>לוח ניהול</Text>
          <Text style={styles.headerSubtitle}>{books.length} ספרים בספרייה</Text>
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
            <Text style={styles.emptyText}>אין ספרים עדיין. הוסף את הספר הראשון שלך!</Text>
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
                {editingBook ? 'עריכת ספר' : 'הוספת ספר חדש'}
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
              <Text style={styles.label}>כותרת *</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="שם הספר"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* Author */}
              <Text style={styles.label}>מחבר *</Text>
              <TextInput
                style={styles.input}
                value={form.author}
                onChangeText={(v) => setForm((f) => ({ ...f, author: v }))}
                placeholder="שם המחבר"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* Description */}
              <Text style={styles.label}>תיאור</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="תיאור קצר..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />

              {/* Category */}
              <Text style={styles.label}>קטגוריה</Text>
              <TextInput
                style={styles.input}
                value={form.category}
                onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="למשל: מדע בדיוני, מדע..."
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* Pages */}
              <Text style={styles.label}>מספר עמודים</Text>
              <TextInput
                style={styles.input}
                value={form.pages}
                onChangeText={(v) => setForm((f) => ({ ...f, pages: v }))}
                placeholder="למשל: 320"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                textAlign="right"
              />

              {/* Rating */}
              <Text style={styles.label}>דירוג (0–5)</Text>
              <TextInput
                style={styles.input}
                value={form.rating}
                onChangeText={(v) => setForm((f) => ({ ...f, rating: v }))}
                placeholder="למשל: 4.5"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                textAlign="right"
              />

              {/* Cover color */}
              <Text style={styles.label}>צבע עטיפה</Text>
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
              <Text style={styles.label}>קובץ PDF</Text>
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
                  {form.pdfName || 'בחר קובץ PDF...'}
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

              {/* Remote URL */}
              <Text style={styles.label}>קישור הורדה (URL)</Text>
              <TextInput
                style={styles.input}
                value={form.remoteUrl}
                onChangeText={(v) => setForm((f) => ({ ...f, remoteUrl: v }))}
                placeholder="https://example.com/book.pdf"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                textAlign="right"
              />

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
                      {editingBook ? 'שמור שינויים' : 'הוסף ספר'}
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
