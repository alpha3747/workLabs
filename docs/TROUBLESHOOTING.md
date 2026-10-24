# Troubleshooting

## iOS: `Library 'DoubleConversion' not found`

You opened `worklabs.xcodeproj`. Open `ios/worklabs.xcworkspace` instead, then run Product → Clean Build Folder.

## iOS (Xcode 26): `Call to consteval function 'fmt::basic_format_string…' is not a constant expression`

Newer Apple Clang rejects `fmt` 11.0.2, which ships with React Native 0.79. The `Podfile` works around this by
compiling the `fmt` pod as C++17. Run `pod install` again after pulling.

## `Could not find gem 'cocoapods'`

Run `bundle install` once in the project root, then `bundle exec pod install`. Or use a globally installed
`pod install`.

## Android Studio: `A problem occurred starting process 'command npx'`

Apps opened from the Dock don't see Homebrew's `PATH`. Run this once, then restart your Mac:

```sh
sudo launchctl config user path "/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
```

Or open Android Studio from the terminal: `open -a "Android Studio" android`.

## Reminders arrive late on Android 12

Android 13 and later grant exact alarms automatically. On Android 12 the user can turn them off under
Settings → Apps → WorkLabs → Alarms & reminders. When they're off, reminders still arrive, but Android may delay
them by a few minutes.
