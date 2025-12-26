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
            setIsLoggedIn(!!token);
        }
        setIsChecking(false);
    }, [router]);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await api.post('auth/login', { json: data }).json<{ accessToken: string }>();
            localStorage.setItem('accessToken', res.accessToken);
            setIsLoggedIn(true);
            // 로그인 성공 후 환영 메시지 표시
        } catch (err: any) {
            if (err.name === 'HTTPError') {
                try {
                    const errorData = await err.response.json();
                    setError(errorData.message || '로그인에 실패했습니다.');
                } catch {
                    setError('로그인에 실패했습니다.');
                }
            } else {
                setError('알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
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

    // 로그인된 상태면 환영 메시지 표시
    if (isLoggedIn) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">환영합니다!</CardTitle>
                        <CardDescription className="text-center">
                            로그인에 성공했습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            대시보드 기능은 추후 구현 예정입니다.
                        </p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                            로그아웃
                        </Button>
                    </CardFooter>
                </Card>
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
