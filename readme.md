# Telegram Chat ID Viewer

A React + Vite web client that helps you discover chat and topic identifiers for a Telegram bot. Paste any bot token, fetch the latest updates, explore group topics, and even send quick test messages or attachments—all from a clean Tailwind-powered interface.

## Features
- Fetch recent updates from the Telegram Bot API and group them by chat.
- Expand any chat to inspect its forum topics (thread IDs) at a glance.
- Send test text messages, documents, or images directly from the UI.
- Inline validation for missing tokens, large files, and Telegram API errors.
- Lightweight stack: React 18, TypeScript, Tailwind CSS, and Lucide icons on top of Vite.

## Prerequisites
- Node.js 20 (recommended) or 18+ for running the Vite tooling.
- An internet connection so the app can reach `https://api.telegram.org`.
- A Telegram bot token created with [@BotFather](https://t.me/BotFather).

## Getting Started
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
Open the printed localhost URL (usually `http://localhost:5173`) in your browser.

## Using the App
1. Create or reuse a bot via @BotFather and copy the bot token.
2. Send a message to the bot (directly, in a group, or within a forum topic) so Telegram has recent updates.
3. Paste the token into the input field and choose **Get Chat IDs**.
4. Click any chat row to reveal its topics. Use the paper airplane icon to send a test message or file.

> **Security note:** The token is only stored in-memory within the browser session and sent directly to Telegram's API. Avoid sharing your token publicly.

## Available Scripts
- `npm run dev` - Launch the Vite development server with hot reloading.
- `npm run build` - Produce a production build under `dist/`.
- `npm run preview` - Preview the production build locally.
- `npm run lint` - Run ESLint for static analysis.
- `npm run deploy` - Build and publish `dist/` to GitHub Pages (relies on `gh-pages`).

## Deployment
The project ships with a GitHub Pages workflow:
```bash
npm run deploy
```
This command runs the production build and pushes the `dist/` directory to the `gh-pages` branch using the `gh-pages` CLI. Ensure the repository is configured to serve GitHub Pages from that branch.

## Contributing
Pull requests and issue reports are welcome. Please run `npm run lint` and `npm run build` before submitting changes to keep the codebase tidy.

## License
This project is released under the MIT License unless otherwise specified in the repository.
