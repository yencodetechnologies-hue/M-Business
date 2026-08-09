import { BASE_URL } from "../config";

/**
 * Open PDF/document from Cloudinary.
 *
 * For Cloudinary files:
 * 1. Ask backend for signed URL.
 * 2. Open signed URL in browser.
 *
 * This prevents HTTP 401 from direct raw Cloudinary URLs.
 */
export async function openPdf(fileUrl) {
  if (!fileUrl) {
    console.error("openPdf: file URL is missing");
    return;
  }

  // Open tab immediately so browser popup blocker doesn't block it.
  let popup = null;

  try {
    popup = window.open(
      "about:blank",
      "_blank"
    );
  } catch (error) {
    console.error("Unable to open PDF tab:", error);
  }

  const openUrl = (url) => {
    if (!url) return;

    if (popup && !popup.closed) {
      popup.location.href = url;
    } else {
      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  /*
   * Cloudinary URL
   */
  if (/res\.cloudinary\.com/i.test(fileUrl)) {
    try {
      const endpoint =
        `${BASE_URL}/api/files/pdf-url?url=` +
        encodeURIComponent(fileUrl);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Cloudinary resolver failed:",
          response.status,
          errorText
        );

        throw new Error(
          `Cloudinary resolver failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "✅ Cloudinary signed URL received"
      );

      if (!data?.url) {
        throw new Error(
          "Signed Cloudinary URL was not returned"
        );
      }

      openUrl(data.url);
      return;
    } catch (error) {
      console.error(
        "❌ Failed to open Cloudinary PDF:",
        error
      );

      if (popup && !popup.closed) {
        popup.close();
      }

      return;
    }
  }

  /*
   * Non-Cloudinary / legacy URL
   */
  openUrl(fileUrl);
}