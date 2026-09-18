/**
 * Automatically parses and converts Google Drive share URLs into high-res thumbnail API format
 * e.g. https://drive.google.com/file/d/12345/view?usp=sharing -> https://drive.google.com/thumbnail?id=12345&sz=w1000
 */
export function convertImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Check if it's already a direct thumbnail link or regular image link
  if (trimmed.includes('drive.google.com/thumbnail?')) {
    return trimmed;
  }

  // Match /file/d/FILE_ID/
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
  }

  // Match ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1000`;
  }

  return trimmed;
}

/**
 * Validates whether a URL is a direct image asset.
 * Bypasses strict pre-load test for Google-hosted domains.
 */
export async function validateImageUrl(url: string): Promise<{ isValid: boolean; error?: string; convertedUrl: string }> {
  if (!url || url.trim() === '') {
    return { isValid: true, convertedUrl: '' };
  }

  const convertedUrl = convertImageUrl(url);

  // Check if Google domain
  const isGoogleDomain = 
    convertedUrl.includes('drive.google.com') || 
    convertedUrl.includes('docs.google.com') || 
    convertedUrl.includes('googleusercontent.com');

  if (isGoogleDomain) {
    return { isValid: true, convertedUrl };
  }

  // For non-Google links, test loading in background
  return new Promise((resolve) => {
    const img = new Image();
    let isResolved = false;

    img.onload = () => {
      if (!isResolved) {
        isResolved = true;
        resolve({ isValid: true, convertedUrl });
      }
    };

    img.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        resolve({ 
          isValid: false, 
          error: 'This link is not a direct image URL or lacks public permissions. Please use a public direct image URL.',
          convertedUrl 
        });
      }
    };

    img.src = convertedUrl;

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        // If timeout, we still permit with a soft warning or assume success if CORS blocked
        resolve({ isValid: true, convertedUrl });
      }
    }, 5000);
  });
}
