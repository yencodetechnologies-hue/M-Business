import axios from "axios";
import { BASE_URL } from "../config";

export const CLOUDINARY_FOLDERS = {
  uploads: "mbusiness/uploads",
  logos: "mbusiness/logos",
  proposals: "mbusiness/proposals",
  quotations: "mbusiness/quotations",
  invoices: "mbusiness/invoices",
  resumes: "M-Business/Resumes",
  documents: "M-Business/Documents",
};

function resourceTypeFor(file) {
  const mime = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  if (mime === "image/svg+xml" || name.endsWith(".svg")) return "raw";
  // PDFs must go as raw. Cloudinary rejects PDFs on the image endpoint
  // unless "Allow PDF file delivery" is enabled on the account.
  if (mime === "application/pdf" || mime === "application/x-pdf" || name.endsWith(".pdf")) return "raw";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

function cloudinaryErrorMessage(payload, fallback) {
  return payload?.error?.message || payload?.msg || fallback;
}

/** POST FormData to Cloudinary without axios so app headers never leak onto the request. */
function postToCloudinary(url, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
        resolve(payload);
        return;
      }
      reject(new Error(cloudinaryErrorMessage(payload, `Cloudinary upload failed (${xhr.status || 0})`)));
    };
    xhr.onerror = () => reject(new Error("Cloudinary upload failed (network error)"));
    xhr.ontimeout = () => reject(new Error("Cloudinary upload timed out"));
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(Math.round((evt.loaded * 100) / evt.total));
      };
    }
    xhr.send(form);
  });
}

/** Upload a File directly to Cloudinary using a server-signed request. */
export async function uploadToCloudinary(file, { folder = CLOUDINARY_FOLDERS.uploads, onProgress } = {}) {
  if (!file) throw new Error("No file selected");

  let sign;
  try {
    const res = await axios.get(`${BASE_URL}/api/upload/sign`, { params: { folder } });
    sign = res.data;
  } catch (err) {
    throw new Error(err.response?.data?.msg || err.message || "Could not start upload");
  }
  if (!sign?.signature || !sign?.apiKey || !sign?.cloudName) {
    throw new Error(sign?.msg || "Cloudinary is not configured");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  const data = await postToCloudinary(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceTypeFor(file)}/upload`,
    form,
    onProgress
  );

  return {
    url: data.secure_url,
    public_id: data.public_id,
    name: file.name,
    size: file.size,
    type: file.type || (String(file.name || "").toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
  };
}

/** Upload to Cloudinary and register the file in the media library. */
export async function uploadFile(file, opts) {
  const uploaded = await uploadToCloudinary(file, opts);
  const { data } = await axios.post(`${BASE_URL}/api/upload`, uploaded);
  return data;
}

const PDF_KIND = {
  proposal: { folder: CLOUDINARY_FOLDERS.proposals, endpoint: "/api/proposals/upload" },
  quotation: { folder: CLOUDINARY_FOLDERS.quotations, endpoint: "/api/quotations/upload" },
  invoice: { folder: CLOUDINARY_FOLDERS.invoices, endpoint: "/api/invoices/upload" },
};

export async function attachProjectPdf(kind, file, { projectId, client, project, title } = {}) {
  const cfg = PDF_KIND[kind];
  if (!cfg) throw new Error(`Unknown PDF kind: ${kind}`);
  const attachedFile = await uploadToCloudinary(file, { folder: cfg.folder });
  const { data } = await axios.post(`${BASE_URL}${cfg.endpoint}`, {
    projectId,
    client,
    project,
    title,
    attachedFile,
  });
  return data;
}
