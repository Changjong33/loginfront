'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

interface User {
  id: string;
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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  replies: Comment[];
}

interface Post {
  id: string;
  caption: string | null;
  createdAt: string;
  user: User;
  postImages: PostImage[];
  comments: Comment[];
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comment, setComment] = useState('');
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [editCaption, setEditCaption] = useState('');

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    try {
      // 현재 사용자 정보 가져오기
      const userResponse = await api.get('users/me').json<any>();
      const userData = userResponse.data || userResponse;
      setCurrentUser(userData);

      // 게시물 정보 가져오기
      const postResponse = await api.get(`posts/${postId}`).json<any>();
      const postData = postResponse.data || postResponse;
      setPost(postData);
      setEditCaption(postData.caption || '');
    } catch (err: any) {
      if (err.name === 'HTTPError' && err.response.status === 404) {
        setError('게시물을 찾을 수 없습니다.');
      } else {
        setError('게시물을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await api.get(`posts/${postId}`).json<any>();
      const data = response.data || response;
      setPost(data);
      setEditCaption(data.caption || '');
    } catch (err: any) {
      if (err.name === 'HTTPError' && err.response.status === 404) {
        setError('게시물을 찾을 수 없습니다.');
      } else {
        setError('게시물을 불러오는데 실패했습니다.');
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post(`posts/${postId}/comments`, {
        json: {
          content: comment,
          parentId: parentCommentId || undefined,
        },
      }).json<any>();
      // TransformInterceptor 응답 처리 (필요시)

      setComment('');
      setParentCommentId(null);
      await fetchPost();
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          setError(errorData.message || '댓글 작성에 실패했습니다.');
        } catch {
          setError('댓글 작성에 실패했습니다.');
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setParentCommentId(commentId);
    // 댓글 입력란으로 스크롤
    document.getElementById('comment-input')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`posts/${postId}`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          alert(errorData.message || '게시물 삭제에 실패했습니다.');
        } catch {
          alert('게시물 삭제에 실패했습니다.');
        }
      } else {
        alert('게시물 삭제에 실패했습니다.');
      }
    }
  };

  const handleUpdatePost = async () => {
    if (!post) return;

    setIsSubmitting(true);
    try {
      // 이미지를 base64로 변환 (기존 이미지 유지)
      const images = post.postImages.map((img, index) => ({
        imageUrl: img.imageUrl,
        sortOrder: index,
      }));

      await api.patch(`posts/${postId}`, {
        json: {
          caption: editCaption || undefined,
          images,
        },
      });

      setEditingPost(false);
      await fetchPost();
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          setError(errorData.message || '게시물 수정에 실패했습니다.');
        } catch {
          setError('게시물 수정에 실패했습니다.');
        }
      } else {
        setError('게시물 수정에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`posts/${postId}/comments/${commentId}`);
      await fetchPost();
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          alert(errorData.message || '댓글 삭제에 실패했습니다.');
        } catch {
          alert('댓글 삭제에 실패했습니다.');
        }
      } else {
        alert('댓글 삭제에 실패했습니다.');
      }
    }
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    setIsSubmitting(true);
    try {
      await api.patch(`posts/${postId}/comments/${commentId}`, {
        json: {
          content: editingCommentContent,
        },
      });

      setEditingCommentId(null);
      setEditingCommentContent('');
      await fetchPost();
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          setError(errorData.message || '댓글 수정에 실패했습니다.');
        } catch {
          setError('댓글 수정에 실패했습니다.');
        }
      } else {
        setError('댓글 수정에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isOwner = currentUser && comment.user.id === currentUser.id;
    const isEditing = editingCommentId === comment.id;

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-2' : 'mt-4'}>
        <div className="flex gap-3">
          {comment.user.userProfileImage ? (
            <img
              src={comment.user.userProfileImage.imageUrl}
              alt={comment.user.nickname || 'User'}
              width={32}
              height={32}
              className="rounded-full w-8 h-8 object-cover flex-shrink-0"
              onError={(e) => {
                console.error('Comment user image load error:', comment.user.userProfileImage?.imageUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 dark:text-gray-300 text-xs">
                {comment.user.nickname?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1">
            {isEditing ? (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <Input
                  value={editingCommentContent}
                  onChange={(e) => setEditingCommentContent(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    isLoading={isSubmitting}
                  >
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditComment}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {comment.user.nickname || '익명'}
                  </p>
                  <p className="text-gray-900 dark:text-white mt-1">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-2">
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    type="button"
                  >
                    답글
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleStartEditComment(comment)}
                        className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                        type="button"
                      >
                        삭제
                      </button>
                    </>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

  if (error || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push('/dashboard')}>대시보드로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← 뒤로가기
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 게시물 헤더 */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {post.user.userProfileImage ? (
                <img
                  src={post.user.userProfileImage.imageUrl}
                  alt={post.user.nickname || post.user.id}
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 object-cover"
                  onError={(e) => {
                    console.error('Post user image load error:', post.user.userProfileImage?.imageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 text-sm">
                    {post.user.nickname?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">
                {post.user.nickname || '익명'}
              </span>
            </div>
            {currentUser && post.user.id === currentUser.id && (
              <div className="flex gap-2">
                {editingPost ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdatePost}
                      isLoading={isSubmitting}
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPost(false);
                        setEditCaption(post.caption || '');
                      }}
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPost(true)}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeletePost}
                      className="text-red-600 hover:text-red-700"
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 게시물 이미지 */}
          {post.postImages.length > 0 && (
            <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <img
                src={post.postImages[0].imageUrl}
                alt={post.caption || '게시물 이미지'}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.error('Image load error:', {
                    url: post.postImages[0].imageUrl,
                    error: img.error,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                  });
                  // 이미지 로드 실패 시 대체 이미지 표시
                  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E';
                  img.onerror = null; // 무한 루프 방지
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', post.postImages[0].imageUrl);
                }}
              />
            </div>
          )}

          {/* 게시물 내용 */}
          <div className="p-4">
            {editingPost ? (
              <div className="mb-4">
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="캡션을 입력하세요..."
                />
              </div>
            ) : (
              post.caption && (
                <p className="text-gray-900 dark:text-white mb-4">
                  <span className="font-semibold mr-2">
                    {post.user.nickname || '익명'}
                  </span>
                  {post.caption}
                </p>
              )
            )}
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            {/* 댓글 목록 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                댓글 {post.comments.length}개
              </h3>
              {post.comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  아직 댓글이 없습니다.
                </p>
              ) : (
                <div>
                  {post.comments.map((comment) => renderComment(comment))}
                </div>
              )}
            </div>

            {/* 댓글 작성 */}
            <form onSubmit={handleSubmitComment} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              {parentCommentId && (
                <div className="mb-2 text-sm text-indigo-600 dark:text-indigo-400">
                  답글 작성 중...{' '}
                  <button
                    type="button"
                    onClick={() => setParentCommentId(null)}
                    className="underline"
                  >
                    취소
                  </button>
                </div>
              )}
              <div className="flex gap-2" id="comment-input">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1"
                />
                <Button type="submit" isLoading={isSubmitting}>
                  작성
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

