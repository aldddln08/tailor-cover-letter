const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.remaining = data.remaining;
    throw error;
  }

  return data;
}

export async function getUsageStatus({ userId, isLoggedIn }) {
  const params = new URLSearchParams({
    userId,
    isLoggedIn: String(isLoggedIn),
  });

  const response = await fetch(`${API_BASE_URL}/api/usage-status?${params.toString()}`);
  return parseResponse(response);
}

export async function generateCoverLetter(payload) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
