Launch the prompt log app.

Steps:
1. Run: `xdg-open ~/.claude/prompt-logger/index.html 2>/dev/null || open ~/.claude/prompt-logger/index.html 2>/dev/null`
2. Tell the user: "Prompt log opened in your browser. All entries are saved in localStorage and persist across sessions. Use Export Markdown to copy the full log at any time."

If the file does not exist at ~/.claude/prompt-logger/index.html, tell the user to re-run /log-prompts after the file has been created, or contact support.
