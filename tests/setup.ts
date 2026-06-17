// Env vars required by webpush module at load time
process.env.VAPID_SUBJECT = 'mailto:test@example.com'
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public-key'
process.env.VAPID_PRIVATE_KEY = 'test-private-key'
process.env.CRON_SECRET = 'test-cron-secret'
