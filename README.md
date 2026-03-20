
# See – React Native Mobile App

This repository contains the React Native implementation of **See**, an AI-powered search and social platform.  
The app integrates Gemini AI for search, content generation, and translation, and uses Supabase for authentication and data storage.

## Features

- 🔍 **AI Search** – Real‑time search with Gemini and Google grounding
- 📰 **Trending Feed** – Curated news articles with infinite scroll
- 💬 **Social Feed** – Mini‑blogs with likes, reposts, comments, and swipe‑to‑delete
- ✉️ **Messaging** – Real‑time chat with self‑destructing messages, voice notes, and media sharing
- 👤 **Profiles** – Follow/unfollow, edit profile, and view followers/following
- 🌙 **Theming** – Dark, dim, and light modes with system auto‑switch
- 🌍 **Multilingual** – Built‑in translations (supports 60+ languages)
- 📍 **Location tagging** – Search and attach locations to posts
- 🔐 **Authentication** – Sign up / login with email, phone, or handle (secure password storage via Supabase)

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- For iOS development: macOS with [Xcode](https://developer.apple.com/xcode/) installed
- For Android development: [Android Studio](https://developer.android.com/studio) with Android SDK
- (Optional) [Expo CLI](https://docs.expo.dev/get-started/installation/) if you plan to use Expo (this project uses bare React Native, but can be adapted)

## Environment Variables

Create a .env file in the project root with your Gemini API key:



API_KEY=your_gemini_api_key_here



If you are using Supabase, also add your Supabase URL and anon key:



SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key



The app uses "react-native-dotenv" to load these variables. For TypeScript, ensure you have an "env.d.ts" file:

typescript
declare module '@env' {
  export const API_KEY: string;
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}


Installation

1. Clone the repository and navigate into the folder:

   git clone <your-repo-url>
   cd see-mobile
   
2. Install dependencies:
   
   npm install
   # or
   yarn install
   
3. Install iOS pods (if developing on macOS):

   cd ios && pod install && cd ..
   

Running the App

Using React Native CLI

· Start Metro bundler:

  npm start
  # or
  yarn start
  
· Run on Android:
  
  npm run android
  # or
  yarn android
  
· Run on iOS:
  
  npm run ios
  # or
  yarn ios
  

Using Expo (if you choose to eject)

If you prefer Expo, you can convert the project by installing Expo modules and using expo start. However, this project is currently set up as a bare React Native project.

Building for Production

Android

Generate a signed APK or App Bundle using Android Studio or the command line:

cd android
./gradlew bundleRelease


iOS

Open ios/See.xcworkspace in Xcode, select a development team, and archive the app.

Folder Structure


.
├── App.tsx                 # Main app component with providers and routing
├── components/             # Reusable UI components
├── context/                # React Context providers (Auth, Theme, Language, Share)
├── services/               # API calls (Gemini, Supabase) and dbService
├── types/                  # TypeScript interfaces
├── utils/                  # Helper functions (translations)
├── android/                # Android native code
├── ios/                    # iOS native code
├── metro.config.js         # Metro bundler configuration
├── babel.config.js         # Babel configuration
└── .env                    # Environment variables


Permissions

The app requests the following permissions (declared in android/app/src/main/AndroidManifest.xml and ios/See/Info.plist):

· Camera – Take photos/videos for posts
· Microphone – Record voice messages and audio notes
· Location – Tag posts with current location and provide location‑aware search
· Photo Library – Upload images from gallery

Built With

· React Native
· Supabase – Database and authentication
· Gemini API – AI search, translation, and content generation
· lucide-react-native – Icons
· react-native-markdown-display – Markdown rendering
· expo-av – Audio/video playback and recording
· @react-native-async-storage/async-storage – Local storage
· react-native-tts – Text‑to‑speech

Contributing

Feel free to open issues or pull requests. For major changes, please discuss them first.

License

MIT

