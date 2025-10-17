This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## Zapier alert forwarding (WhatsApp / SMS)

This project includes a server-side endpoint that forwards health-alert payloads to a Zapier webhook. Use this to send WhatsApp or SMS notifications (via Twilio, WhatsApp Cloud API, 360Dialog, etc.).

File: `app/api/notify/route.ts`

How it works
- Your client (the kiosk) saves vitals. When thresholds (e.g., heart rate, temperature) are exceeded the client posts a JSON payload to `/api/notify`.
- The server endpoint reads the Zapier webhook URL from the `ZAPIER_WEBHOOK` environment variable and forwards the payload to Zapier.

Environment variable
1. Set `ZAPIER_WEBHOOK` to the Zapier Catch Hook URL for your Zap. Example:

PowerShell (temporary in current session):
```powershell
$env:ZAPIER_WEBHOOK = 'https://hooks.zapier.com/hooks/catch/25014724/u5v7qnc/'
npm run dev
```

macOS / Linux (bash):
```bash
export ZAPIER_WEBHOOK='https://hooks.zapier.com/hooks/catch/25014724/u5v7qnc/'
npm run dev
```

Testing the endpoint
You can POST a sample payload to the endpoint to test the forwarding. Replace fields as required.

PowerShell test (example):
```powershell
$payload = @{ 
	appUserId = 'U_001'
	name = 'Heramb Tople'
	phone = '+917499236498'
	checkupId = 'checkup_test_1'
	vitals = @{ heartRate = 122; temperature = 39.2 }
	triggers = @('heartRate')
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri http://localhost:3000/api/notify -Method POST -Body $payload -ContentType 'application/json'
```

curl test (example):
```bash
curl -X POST http://localhost:3000/api/notify \
	-H "Content-Type: application/json" \
	-d '{"appUserId":"U_001","name":"Heramb Tople","phone":"+917499236498","checkupId":"checkup_test_1","vitals":{"heartRate":122},"triggers":["heartRate"]}'
```

Zapier setup
1. Create a new Zap.
2. Trigger: "Webhooks by Zapier" → "Catch Hook". Zapier will give you a webhook URL.
3. Use that webhook URL as `ZAPIER_WEBHOOK` in your environment.
4. Action: Add your WhatsApp provider (Twilio WhatsApp, WhatsApp Cloud API via Webhooks, 360Dialog, etc.) and map fields from the webhook payload (e.g., `name`, `phone`, `vitals.heartRate`).

Message template example for WhatsApp/Twilio:
```
⚠️ Health Alert for {{name}} (ID: {{appUserId}})

Detected abnormal {{triggers}} value(s):
Heart Rate: {{vitals.heartRate}} bpm
Temperature: {{vitals.temperature}} °C

Please take immediate action or contact a doctor.
```

Notes and recommendations
- Use E.164 phone format (e.g., +917499236498) for Twilio/WhatsApp providers.
- Keep `ZAPIER_WEBHOOK` secret (do not commit it to source control). For production hosting (Vercel, Netlify, etc.) set it in the project environment settings.
- If you want stronger delivery guarantees, I can implement persistent logging of alerts to Firebase and retries with exponential backoff.
