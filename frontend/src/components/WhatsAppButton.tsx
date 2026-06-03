import { getSettings } from '@/lib/api';

/**
 * Floating WhatsApp chat button. Renders only when the admin has set
 * a phone number in /admin/settings. Bottom-right, fixed.
 */
export default async function WhatsAppButton() {
  const settings = await getSettings();
  const { whatsappPhone, whatsappMessage } = settings.integrations;
  if (!whatsappPhone) return null;

  const href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage || '')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-black/40 hover:scale-110 active:scale-95 transition-transform"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="w-7 h-7 text-white"
        fill="currentColor"
      >
        <path d="M19.11 17.21c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.39-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49-.16 0-.36-.02-.55-.02s-.5.07-.76.36c-.26.28-1 .98-1 2.39 0 1.41 1.02 2.78 1.16 2.97.14.19 2 3.05 4.85 4.28.68.29 1.21.47 1.62.6.68.22 1.3.18 1.79.11.55-.08 1.66-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33zM16 3C8.83 3 3 8.83 3 16c0 2.49.7 4.81 1.91 6.79L3 29l6.43-1.91A12.98 12.98 0 0016 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.78c-2.06 0-4.07-.55-5.83-1.6l-.42-.25-3.81 1.13 1.14-3.7-.27-.43A10.78 10.78 0 015.22 16C5.22 10.05 10.05 5.22 16 5.22c5.95 0 10.78 4.83 10.78 10.78 0 5.95-4.83 10.78-10.78 10.78z" />
      </svg>
    </a>
  );
}
