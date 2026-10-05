# Weekly Wins Studio

A buildless weekly team wins email editor. Open the hosted tool or run `python3 -m http.server 5173 --directory dist` and visit http://localhost:5173.

1. Clear the clearly labeled sample wins, then add wins individually or paste team updates. Batch import supports `Team:` headings with one win per line and `Team: win` lines. Review the results before sending.
2. Choose Golden hour, Out of this world, Cue the confetti, or The good news club. Edit the subject, introduction, headline, and closing. Theme switches preserve custom wording.
3. Add a direct HTTPS image/GIF URL, a verified fun fact with a source, or trivia. The answer can optionally appear at the end.
4. Copy the formatted email, open Gmail, paste it into the message body, and copy the subject separately. Add recipients and review in Gmail before sending. Gmail plain-text mode must be off. Rendering and animated GIF behavior can differ by email client. If rich copying is unavailable, download HTML, open it in a browser, select and copy its rendered content.

Drafts save in this browser's local storage; they are not synced across devices. Download/load JSON drafts for backup or transfer. New edition clears the current content after confirmation. No Gmail connection, automatic draft creation, AI rewriting, or email sending is implemented. Remote images and the interface's optional Google Fonts are requested from their hosts.

Run `node --check dist/app.js` and `node tests/email.test.cjs` for validation.
