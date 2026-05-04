import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  I18nManager,
} from 'react-native';
import Pdf from 'react-native-pdf';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { useBookmarks } from '../context/BookmarksContext';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme';

export default function ReaderScreen({ route, navigation }) {
  const { bookId, initialPage = 1 } = route.params;
  const { getBook, updateBook, downloadPdf, cancelDownload, downloadProgress } = useBooks();
  const { addBookmark, isPageBookmarked, deleteBookmark, getBookmarks } = useBookmarks();

  const book = getBook(bookId);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [pdfSource, setPdfSource] = useState(
    book?.pdfUri ? { uri: book.pdfUri, cache: true } : null
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const pdfRef = useRef(null);

  const progress = downloadProgress[bookId] ?? null;

  const pageBookmarked = isPageBookmarked(bookId, currentPage);
  const readProgress = totalPages > 0 ? currentPage / totalPages : 0;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const localUri = await downloadPdf(bookId);
      setPdfSource({ uri: localUri, cache: true });
    } catch (e) {
      Alert.alert('שגיאה', 'הורדת ה-PDF נכשלה. בדוק חיבור לאינטרנט.');
    } finally {
      setDownloading(false);
    }
  }, [bookId, downloadPdf]);

  const handleCancelDownload = useCallback(async () => {
    await cancelDownload(bookId);
    setDownloading(false);
  }, [bookId, cancelDownload]);

  const pickPdf = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      // Copy PDF to app document directory for persistence
      const destDir = FileSystem.documentDirectory + 'pdfs/';
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      const destUri = destDir + `book_${bookId}.pdf`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      await updateBook(bookId, { pdfUri: destUri, isLocal: true });
      setPdfSource({ uri: destUri, cache: true });
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לטעון קובץ PDF.');
    }
  }, [bookId, updateBook]);

  const handleBookmarkToggle = useCallback(async () => {
    if (pageBookmarked) {
      const bms = getBookmarks(bookId);
      const bm = bms.find((b) => b.page === currentPage);
      if (bm) {
        Alert.alert('הסרת סימנייה', `להסיר סימנייה לעמוד ${currentPage}?`, [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'הסר',
            style: 'destructive',
            onPress: () => deleteBookmark(bookId, bm.id),
          },
        ]);
      }
    } else {
      setNoteText('');
      setNoteModalVisible(true);
    }
  }, [pageBookmarked, currentPage, bookId, getBookmarks, deleteBookmark]);

  const handleSaveBookmark = useCallback(async () => {
    await addBookmark(bookId, currentPage, noteText.trim());
    setNoteModalVisible(false);
  }, [bookId, currentPage, noteText, addBookmark]);

  if (!book) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>הספר לא נמצא.</Text>
      </View>
    );
  }

  // No PDF loaded yet — show download / picker placeholder
  if (!pdfSource) {
    return (
      <View style={styles.noPdfContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.noPdfContent}>
          <Ionicons name="document-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.noPdfTitle}>{book.title}</Text>
          <Text style={styles.noPdfSubtitle}>אין קובץ PDF מצורף לספר זה.</Text>

          {book.remoteUrl ? (
            // Remote PDF available — show download button
            downloading ? (
              <View style={styles.downloadingBlock}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.downloadingText}>
                  {progress !== null
                    ? `מוריד... ${Math.round(progress * 100)}%`
                    : 'מוריד...'}
                </Text>
                {progress !== null && (
                  <View style={styles.downloadTrack}>
                    <View style={[styles.downloadFill, { width: `${Math.round(progress * 100)}%` }]} />
                  </View>
                )}
                <TouchableOpacity style={styles.downloadCancelBtn} onPress={handleCancelDownload}>
                  <Text style={styles.downloadCancelBtnText}>ביטול</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickBtn} onPress={handleDownload}>
                <Ionicons name="cloud-download-outline" size={22} color={COLORS.white} />
                <Text style={styles.pickBtnText}>הורד ספר</Text>
              </TouchableOpacity>
            )
          ) : (
            // No remote URL — manual file picker
            <TouchableOpacity style={styles.pickBtn} onPress={pickPdf}>
              <Ionicons name="folder-open-outline" size={22} color={COLORS.white} />
              <Text style={styles.pickBtnText}>בחר קובץ PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* PDF viewer */}
      <TouchableOpacity
        style={styles.pdfWrapper}
        activeOpacity={1}
        onPress={() => setShowControls((v) => !v)}
      >
        <Pdf
          ref={pdfRef}
          source={pdfSource}
          page={initialPage}
          onLoadComplete={(pages) => {
            setTotalPages(pages);
            setLoading(false);
          }}
          onPageChanged={(page) => setCurrentPage(page)}
          onError={() => {
            Alert.alert('שגיאה', 'טעינת ה-PDF נכשלה.', [
              { text: 'אישור', onPress: () => navigation.goBack() },
            ]);
          }}
          onLoadProgress={() => setLoading(true)}
          style={styles.pdf}
          enablePaging
          horizontal={false}
          fitPolicy={0}
          spacing={0}
          trustAllCerts={false}
        />
        {loading && (
          <View style={styles.pdfLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Overlay controls */}
      {showControls && (
        <>
          {/* Top bar */}
          <View style={[styles.topBar, SHADOWS.md]}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.topTitle}>
              <Text style={styles.topTitleText} numberOfLines={1}>
                {book.title}
              </Text>
              <Text style={styles.topPageText}>
                {currentPage} / {totalPages || '—'}
              </Text>
            </View>
            <TouchableOpacity style={styles.controlBtn} onPress={handleBookmarkToggle}>
              <Ionicons
                name={pageBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={pageBookmarked ? COLORS.accentYellow : COLORS.text}
              />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${readProgress * 100}%` }]} />
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, SHADOWS.md]}>
            <TouchableOpacity
              style={styles.navBtn}
              disabled={currentPage <= 1}
              onPress={() => pdfRef.current?.setPage(currentPage - 1)}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                size={28}
                color={currentPage <= 1 ? COLORS.textMuted : COLORS.text}
              />
            </TouchableOpacity>
            <Text style={styles.bottomPageText}>
              עמוד {currentPage}{totalPages > 0 ? ` מתוך ${totalPages}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.navBtn}
              disabled={totalPages > 0 && currentPage >= totalPages}
              onPress={() => pdfRef.current?.setPage(currentPage + 1)}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={28}
                color={
                  totalPages > 0 && currentPage >= totalPages
                    ? COLORS.textMuted
                    : COLORS.text
                }
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Bookmark note modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>הוספת סימנייה</Text>
            <Text style={styles.modalSubtitle}>עמוד {currentPage}</Text>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="הוסף הערה (אופציונלי)..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              textAlign="right"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveBookmark}
              >
                <Text style={styles.saveBtnText}>שמור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.readerBg,
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
  pdfWrapper: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.readerBg,
  },
  pdfLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.readerBg,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 44 : SPACING.base,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    zIndex: 20,
  },
  controlBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
  },
  topTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  topTitleText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  topPageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressBarTrack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 64,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.surface,
    zIndex: 19,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.base,
    zIndex: 20,
  },
  navBtn: {
    padding: SPACING.sm,
  },
  bottomPageText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    fontWeight: '600',
  },
  // No PDF state
  noPdfContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : SPACING.xl,
    left: SPACING.base,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.full,
    padding: SPACING.sm,
  },
  noPdfContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  noPdfTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.base,
    textAlign: 'center',
  },
  noPdfSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  pickBtnText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  downloadingBlock: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    width: '100%',
  },
  downloadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  downloadTrack: {
    width: '80%',
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.base,
  },
  downloadFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  downloadCancelBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  downloadCancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
  },
  noteInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.base,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
