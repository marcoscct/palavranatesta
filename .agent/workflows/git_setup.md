---
description: Setup Git and Push to GitHub
---

Since you don't have credentials configured, the easiest way is to use the GitHub CLI (gh) if installed, or the standard Git credential manager which will pop up a browser window.

I will attempt to initialize the repository and push. If authentication fails, I will pause and ask you to authenticate.

1.  **Initialize Git**: `git init`
2.  **Add Files**: `git add .`
3.  **Commit**: `git commit -m "Initial commit v31.20"`
4.  **Rename Branch**: `git branch -M main`
5.  **Add Remote**: `git remote add origin https://github.com/marcoscct/palavranatesta.git`
6.  **Push**: `git push -u origin main`

If step 6 fails with an authentication error, you will need to run:
`git credential-manager-core configure` (or similar depending on your OS)
OR simply run `git push` manually in your terminal, which should trigger the browser login.
