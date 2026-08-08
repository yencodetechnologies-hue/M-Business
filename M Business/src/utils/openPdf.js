import { BASE_URL } from "../config";

export async function openPdf(url) {
  if (!url) return;

  if (url.includes("res.cloudinary.com")) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/files/pdf-url?url=${encodeURIComponent(url)}`
      );
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
        return;
      }
    } catch {
      // fall through
    }
  }

  window.open(url, "_blank");
}