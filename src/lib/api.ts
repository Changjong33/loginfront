import ky, { HTTPError } from 'ky';
import { Ok, Err, Result } from 'oxide';

// API URL 설정 (환경 변수 또는 기본값)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables. Using default:', API_URL);
}

export const api = ky.create({
  prefixUrl: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // CORS credentials 허용
  hooks: {
    beforeRequest: [
      (request) => {
        // SSR 환경에서는 localStorage 접근 불가
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // 401 에러 시 토큰 제거
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        return response;
      },
    ],
  },
});

export type ApiError = {
  statusCode: number;
  message: string;
  error: string;
};

// Oxide Result를 사용한 API 호출 헬퍼 함수
export async function apiCall<T>(
  apiCall: () => Promise<T>
): Promise<Result<T, ApiError>> {
  try {
    const data = await apiCall();
    return Ok(data);
  } catch (error) {
    if (error instanceof HTTPError) {
      try {
        const errorData = await error.response.json<ApiError>();
        return Err({
          statusCode: error.response.status,
          message: errorData.message || '요청에 실패했습니다.',
          error: errorData.error || 'Unknown Error',
        });
      } catch {
        return Err({
          statusCode: error.response.status,
          message: '요청에 실패했습니다.',
          error: 'Failed to parse error response',
        });
      }
    }
    return Err({
      statusCode: 500,
      message: '알 수 없는 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown Error',
    });
  }
}
