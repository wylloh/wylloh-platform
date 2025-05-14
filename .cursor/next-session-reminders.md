# Reminders for Next Development Session

## Security Vulnerabilities
- Run `npm audit` to address the 20 security vulnerabilities identified by GitHub:
  - 9 high severity
  - 9 moderate severity
  - 2 low severity
- After running the audit, fix the issues with `npm audit fix` or manually address them as needed

## Port Management
To avoid the "Something is already running on port 3000" issue, use the new utility scripts:

```bash
# Kill any process running on port 3000
cd client
npm run kill-port

# Or use the restart script to kill the port and start the app
npm run restart
```

## Next Development Tasks
- Begin implementing the background task tracking system:
  1. TaskProgressService
  2. TaskProgressStore
  3. TaskNotificationSystem
  4. TaskProgressUI components

Refer to the implementation plan in `.cursor/batch-operations-progress.md` for detailed requirements. 