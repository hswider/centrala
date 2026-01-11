import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(__dirname, '../data/tokens.json');

let tokens = loadTokens();

function loadTokens() {
  try {
    const data = fs.readFileSync(TOKENS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { accessToken: null, refreshToken: null, expiresAt: null };
  }
}

function saveTokens(newTokens) {
  tokens = { ...tokens, ...newTokens };
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

async function getNewTokens(grantType, code) {
  const { APILO_BASE_URL, APILO_CLIENT_ID, APILO_CLIENT_SECRET } = process.env;

  const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

  const body = { grantType, token: code };

  const response = await axios.post(
    `${APILO_BASE_URL}/rest/auth/token/`,
    body,
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  const { accessToken, refreshToken, accessTokenExpireAt } = response.data;
  const expiresAt = accessTokenExpireAt
    ? new Date(accessTokenExpireAt).getTime() - 60000 // 1 min buffer
    : Date.now() + 3600000; // fallback: 1 hour

  saveTokens({ accessToken, refreshToken, expiresAt });
  console.log('[Auth] Tokens refreshed successfully');

  return accessToken;
}

async function getAccessToken() {
  // If we have a valid token, return it
  if (tokens.accessToken && tokens.expiresAt && Date.now() < tokens.expiresAt) {
    return tokens.accessToken;
  }

  // Try to refresh using refresh token
  if (tokens.refreshToken) {
    try {
      return await getNewTokens('refresh_token', tokens.refreshToken);
    } catch (error) {
      console.log('[Auth] Refresh token failed, trying auth code...');
    }
  }

  // Use initial auth code
  const authCode = process.env.APILO_INITIAL_AUTH_CODE;
  if (authCode) {
    return await getNewTokens('authorization_code', authCode);
  }

  throw new Error('No valid authentication method available');
}

// Create axios instance with interceptors
const apiloClient = axios.create();

apiloClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.baseURL = process.env.APILO_BASE_URL;
  config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['Accept'] = 'application/json';
  config.headers['Content-Type'] = 'application/json';
  return config;
});

apiloClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Force token refresh
      tokens.accessToken = null;
      tokens.expiresAt = null;

      try {
        const token = await getAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiloClient(originalRequest);
      } catch (refreshError) {
        console.error('[Auth] Token refresh failed:', refreshError.message);
        throw refreshError;
      }
    }

    throw error;
  }
);

export { apiloClient, getAccessToken };
