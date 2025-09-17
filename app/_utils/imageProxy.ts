// Konvertera Vercel Blob URL till proxy URL för att undvika COEP-problem
export const getProxyImageUrl = (blobUrl: string): string => {
  if (!blobUrl) return "";
  if (blobUrl.includes("blob.vercel-storage.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(blobUrl)}`;
  }
  return blobUrl;
};