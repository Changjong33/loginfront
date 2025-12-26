'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const loginSchema = z.object({
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Home() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        // 로그인 상태 확인
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // 이미 로그인되어 있으면 대시보드로 이동
                router.push('/dashboard');
            } else {
                setIsLoggedIn(false);
            }
        }
        setIsChecking(false);
    }, [router]);

    useEffect(() => {
        // 페이지를 떠날 때 자동 로그아웃
        const handleBeforeUnload = () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('auth/login', { json: data }).json<any>();
            
            // TransformInterceptor로 인해 응답이 { success, data, timestamp } 형식으로 래핑됨
            const res = response.data || response;
            
            console.log('Login response:', { 
                fullResponse: response,
                hasAccessToken: !!res.accessToken, 
                hasRefreshToken: !!res.refreshToken,
                accessTokenLength: res.accessToken?.length 
            });
            
            if (!res.accessToken) {
                throw new Error('토큰을 받지 못했습니다.');
            }
            
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
            
            // 토큰 저장 확인
            const savedToken = localStorage.getItem('accessToken');
            console.log('Token saved:', !!savedToken, savedToken ? savedToken.substring(0, 20) + '...' : 'NO TOKEN');
            
            // 약간의 지연 후 리다이렉트 (토큰 저장 보장)
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.name === 'HTTPError') {
                try {
                    const errorData = await err.response.json();
                    setError(errorData.message || '로그인에 실패했습니다.');
                } catch {
                    setError('로그인에 실패했습니다.');
                }
            } else {
                setError(err.message || '알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
                    <CardDescription className="text-center">
                        이메일과 비밀번호를 입력하여 로그인하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="이메일"
                            type="email"
                            placeholder="name@example.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        <Input
                            label="비밀번호"
                            type="password"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        {error && <div className="text-sm text-red-500 text-center">{error}</div>}
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            로그인
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-500">
                    <Link href="/forgot-password" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                        비밀번호를 잊으셨나요?
                    </Link>
                    <div className="flex gap-1 justify-center">
                        계정이 없으신가요?
                        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            회원가입
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
