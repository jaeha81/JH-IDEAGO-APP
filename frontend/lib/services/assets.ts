// API service: Uploaded Assets
// MOCK → REAL: flip USE_MOCK = false.
// File upload must be multipart/form-data — not JSON.

import { api } from "@/lib/api";
import { authHeaders } from "@/lib/services/auth";
import { MOCK_ASSETS } from "@/lib/mock/workspace";
import type { ApiResponse, UploadedAsset } from "@/types";

const USE_MOCK = true;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function listAssets(projectId: string): Promise<UploadedAsset[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_ASSETS;
  }
  const res = await api.get<ApiResponse<UploadedAsset[]>>(
    `/projects/${projectId}/assets`,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function uploadAsset(
  projectId: string,
  file: File,
): Promise<UploadedAsset> {
  if (USE_MOCK) {
    await delay(800);
    const mockAsset: UploadedAsset = {
      asset_id: "asset-" + Date.now(),
      original_name: file.name,
      mime_type: file.type,
      storage_url: URL.createObjectURL(file), // local object URL for mock preview
      thumbnail_url: null,
      file_size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
    };
    return mockAsset;
  }
  // Real upload: multipart/form-data (not JSON)
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/projects/${projectId}/assets`, {
    method: "POST",
    headers: authHeaders(), // no Content-Type — let browser set boundary
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  const json: ApiResponse<UploadedAsset> = await res.json();
  return json.data;
}

export async function refreshAssetUrl(
  projectId: string,
  assetId: string,
): Promise<{ asset_id: string; url: string; expires_at: string }> {
  if (USE_MOCK) {
    await delay(150);
    return {
      asset_id: assetId,
      url: "#refreshed-mock-url",
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }
  const res = await api.post<ApiResponse<{ asset_id: string; url: string; expires_at: string }>>(
    `/projects/${projectId}/assets/${assetId}/refresh-url`,
    {},
    { headers: authHeaders() },
  );
  return res.data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
