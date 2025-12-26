'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  nickname: string | null;
  userProfileImage: {
    imageUrl: string;
  } | null;
}

interface PostImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

interface Post {
  id: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    nickname: string | null;
    userProfileImage: {
      imageUrl: string;
    } | null;
  };
  postImages: PostImage[];
  comments: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 토큰 확인
      const token = localStorage.getItem('accessToken');
      console.log('Dashboard load - Token exists:', !!token);
      
      if (!token) {
        console.log('No token, redirecting to login');
        router.push('/');
        return;
      }

      try {
        console.log('Fetching user data...');
        // 사용자 프로필 조회
        const userResponse = await api.get('users/me').json<any>();
        const userData = userResponse.data || userResponse;
        console.log('User data received:', !!userData);
        setUser(userData);

        // 게시물 목록 조회
        const postsResponse = await api.get('posts').json<any>();
        const postsData = postsResponse.data || postsResponse;
        setPosts(Array.isArray(postsData) ? postsData : []);
      } catch (err: any) {
        console.error('Dashboard fetch error:', {
          name: err.name,
          status: err.response?.status,
          message: err.message,
          url: err.response?.url,
        });
        
        if (err.name === 'HTTPError') {
          if (err.response.status === 401) {
            console.log('401 error - clearing tokens');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/');
            return;
          } else if (err.response.status === 500) {
            // 500 에러 시 에러 메시지 표시
            try {
              const errorData = await err.response.json();
              setError(errorData.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } catch {
              setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
          } else {
            setError('데이터를 불러오는데 실패했습니다.');
          }
        } else {
          setError('데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('auth/logout', { json: { refreshToken } });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            로그인 페이지로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.userProfileImage ? (
              <Image
                src={user.userProfileImage.imageUrl}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  {user?.nickname?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {user?.nickname || user?.email || '사용자'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/create">
              <Button size="sm">새 게시물</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 게시물 목록 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              아직 게시물이 없습니다.
            </p>
            <Link href="/dashboard/create">
              <Button>첫 게시물 작성하기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/dashboard/posts/${post.id}`}>
                <article className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 게시물 헤더 */}
                  <div className="p-4 flex items-center gap-3">
                    {post.user.userProfileImage ? (
                      <Image
                        src={post.user.userProfileImage.imageUrl}
                        alt={post.user.nickname || post.user.id}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 text-xs">
                          {post.user.nickname?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {post.user.nickname || '익명'}
                    </span>
                  </div>

                  {/* 게시물 이미지 */}
                  {post.postImages.length > 0 && (
                    <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={post.postImages[0].imageUrl}
                        alt={post.caption || '게시물 이미지'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* 게시물 내용 */}
                  <div className="p-4">
                    {post.caption && (
                      <p className="text-gray-900 dark:text-white mb-2">
                        <span className="font-semibold mr-2">
                          {post.user.nickname || '익명'}
                        </span>
                        {post.caption}
                      </p>
                    )}
                    {post.comments.length > 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        댓글 {post.comments.length}개
                      </p>
                    )}
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                      {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

