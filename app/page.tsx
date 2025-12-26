'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 로그인 상태 확인 (간단한 예시)
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      // 토큰이 있으면 대시보드로 (나중에 구현)
      // router.push('/dashboard');
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.push('/login');
    }
  }, [router]);

  // 리다이렉트 중 로딩 화면
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    </div>
  );
}
