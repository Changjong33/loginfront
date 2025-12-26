'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Image from 'next/image';

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 이미지를 base64로 변환 (실제로는 서버에 업로드해야 함)
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(img.file);
          });
        })
      );

      await api.post('posts', {
        json: {
          caption: caption || undefined,
          images: imageUrls.length > 0 ? imageUrls.map((url, index) => ({
            imageUrl: url,
            sortOrder: index,
          })) : undefined,
        },
      });

      router.push('/dashboard');
    } catch (err: any) {
      if (err.name === 'HTTPError') {
        try {
          const errorData = await err.response.json();
          setError(errorData.message || '게시물 작성에 실패했습니다.');
        } catch {
          setError('게시물 작성에 실패했습니다.');
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>새 게시물 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이미지 선택
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 캡션 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  캡션
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="게시물에 대한 설명을 입력하세요..."
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  게시하기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

