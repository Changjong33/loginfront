import ky, { HTTPError } from 'ky';
import { Ok, Err, Result } from 'oxide';

// API URL 설정 (환경 변수 또는 기본값)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// URL 정리: 끝의 슬래시 제거, 도메인만 추출 (프로토콜 + 도메인 + 포트)
let cleanApiUrl = API_URL.replace(/\/$/, '');
try {
  const url = new URL(cleanApiUrl);
  cleanApiUrl = `${url.protocol}//${url.host}`;
} catch {
  // URL 파싱 실패 시 원본 사용
  cleanApiUrl = cleanApiUrl.split('/').slice(0, 3).join('/');
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables. Using default:', cleanApiUrl);
}

// 디버깅용
if (typeof window !== 'undefined') {
  console.log('API Base URL:', cleanApiUrl);
}

export const api = ky.create({
  prefixUrl: cleanApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // CORS credentials 허용
  hooks: {
    beforeRequest: [
      (request) => {
        // 디버깅: 실제 요청 URL 확인
        if (typeof window !== 'undefined') {
          console.log('API Request URL:', request.url);
        }
        
        // SSR 환경에서는 localStorage 접근 불가
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          console.log('Token in request:', !!token, token ? token.substring(0, 20) + '...' : 'NO TOKEN');
          
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
            console.log('Authorization header set');
          } else {
            console.warn('No token found for request:', request.url);
          }
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // 401 에러 시 토큰 제거 및 상세 로깅
        if (response.status === 401 && typeof window !== 'undefined') {
          console.error('401 Unauthorized:', {
            url: request.url,
            status: response.status,
            hasToken: !!localStorage.getItem('accessToken'),
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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