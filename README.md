# PhoneBook 📚

A mobile application for reading books on your phone — built with React Native & Expo.

## Features

| Feature | Description |
|---|---|
| 📖 **PDF Reader** | Load any local PDF and read it like a digital book. Full-screen experience with page navigation. |
| 🔖 **Bookmarks** | Save any page with an optional note. Jump back to a bookmarked page in one tap. |
| 🔍 **Search** | Full-text search across title, author, and description. |
| 🗂 **Categories** | Filter the library by genre/category via pill tabs. |
| ⭐ **Featured Books** | Highlighted carousel on the home screen for curated picks. |
| 🛠 **Admin Panel** | Add, edit, and delete books. Attach a PDF file and choose a cover color. Changes persist across restarts via AsyncStorage. |
| 📂 **JSON Data Schema** | `data/books.json` acts as the seed catalog. Admin changes are merged on top and stored locally. |
| 📴 **Offline-first** | No network required. All data lives on-device. |

## Project Structure

```
PhoneBook/
├── App.js                        # Root: navigation + context providers
├── app.json                      # Expo configuration
├── babel.config.js
├── package.json
├── data/
│   └── books.json                # Seed book catalog (JSON schema)
└── src/
    ├── theme/
    │   └── index.js              # Colors, typography, spacing tokens
    ├── context/
    │   ├── BooksContext.js       # Book CRUD + search + category filter
    │   └── BookmarksContext.js   # Per-book bookmarks (AsyncStorage)
    ├── screens/
    │   ├── HomeScreen.js         # Library: featured carousel, category pills, grid
    │   ├── BookDetailScreen.js   # Book info, read button, bookmarks list
    │   ├── ReaderScreen.js       # Full-screen PDF reader with progress bar
    │   ├── BookmarksScreen.js    # All bookmarks grouped by book
    │   └── AdminScreen.js        # Admin: add / edit / delete books
    └── components/
        ├── BookCard.js           # Reusable grid card with cover & rating
        ├── BookmarkItem.js       # Bookmark row with page, note, delete
        └── SearchBar.js          # Styled search input with clear button
```

## Data Schema (`data/books.json`)

```json
{
  "version": "1.0",
  "lastUpdated": "<ISO date>",
  "categories": ["Fiction", "Non-Fiction", "Science", ...],
  "books": [
    {
      "id": "unique-id",
      "title": "Book Title",
      "author": "Author Name",
      "description": "Short description...",
      "coverColor": "#6C63FF",
      "category": "Fiction",
      "pages": 320,
      "language": "en",
      "addedDate": "<ISO date>",
      "pdfUri": null,
      "isLocal": false,
      "rating": 4.5,
      "featured": true
    }
  ]
}
```

Admin-added books are merged with this seed data and stored in `AsyncStorage` under the key `@phonebook_books`. Deleting the app storage resets to the seed catalog.

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

> **Note:** `react-native-pdf` requires a bare/development build — `expo run:android` or `expo run:ios`. It does not work in Expo Go.

## Design

- **Color palette:** Deep navy `#1a1a2e`, Purple `#6C63FF`, warm reader background `#F5F0E8`
- **Navigation:** Bottom tabs (Library · Bookmarks · Admin) with nested stack navigators
- **Reader UX:** Tap the screen to toggle the top/bottom control bars; swipe to turn pages
- **Bookmarks:** Sorted by page number per book; add an optional note when saving

## Next Steps

After cloning and running the app locally, complete the following steps to enable cloud builds and OTA updates:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Log in to Expo / EAS**
   ```bash
   npx eas-cli login
   ```

3. **Link the project to your Expo account**
   ```bash
   npx eas-cli build:configure
   ```
   This populates `extra.eas.projectId` and `updates.url` in `app.json`.

4. **Create a development build** (required for PDF reading — does not work in Expo Go)
   ```bash
   # Android
   npx eas-cli build --platform android --profile development

   # iOS
   npx eas-cli build --platform ios --profile development
   ```

5. **Create a production build**
   ```bash
   # Android (AAB)
   npx eas-cli build --platform android --profile production

   # iOS
   npx eas-cli build --platform ios --profile production
   ```

6. **Publish an OTA update** (no new build needed for JS-only changes)
   ```bash
   npx eas-cli update --branch production --message "describe your update"
   ```
