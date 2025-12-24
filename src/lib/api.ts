import ky from 'ky';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

export const api = ky.create({
  prefixUrl: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});

export type ApiError = {
  statusCode: number;
  message: string;
  error: string;
};
