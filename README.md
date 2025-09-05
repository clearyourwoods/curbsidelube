# Curbside Lube Co. — Vite + React

Production-ready single-page site for booking mobile oil changes.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Build for production

```bash
npm run build
npm run preview
```

## Email sending

- By default, clicking **Send via Mail App** opens a prefilled email to `clearyourwoods@gmail.com`.
- Optional in-app sending via **EmailJS**: set `useEmailJS` to `true` in `src/App.jsx` and provide your keys.
  ```js
  const EMAILJS_CONFIG = {
    useEmailJS: true,
    service_id: "YOUR_SERVICE_ID",
    template_id: "YOUR_TEMPLATE_ID",
    public_key: "YOUR_PUBLIC_KEY",
  };
  ```

## Logos

Replace the placeholder images in `public/logos/logo1.png` … `logo4.png` with your exported logo files.

## Notes

- The site includes a small oil/filter knowledge base and VIN decode (NHTSA API). Always verify oil specs and filter part numbers before service.
- A tiny self-test harness is included under the **How it works** section.
