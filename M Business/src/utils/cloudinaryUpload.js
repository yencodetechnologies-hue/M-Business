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
  const mime = file?.type || "";
  if (mime === "image/svg+xml") return "raw";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

/** Upload a File directly to Cloudinary using a server-signed request. */
export async function uploadToCloudinary(file, { folder = CLOUDINARY_FOLDERS.uploads, onProgress } = {}) {
  if (!file) throw new Error("No file selected");
  const { data: sign } = await axios.get(`${BASE_URL}/api/upload/sign`, { params: { folder } });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceTypeFor(file)}/upload`,
    form,
    {
      onUploadProgress: onProgress
        ? (evt) => onProgress(evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0)
        : undefined,
    }
  );
  if (!data?.secure_url) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return {
    url: data.secure_url,
    public_id: data.public_id,
    name: file.name,
    size: file.size,
    type: file.type,
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
