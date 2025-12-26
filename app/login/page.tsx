'use client';

import { useState } from 'react';
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

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

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
            });
            
            if (!res.accessToken) {
                throw new Error('토큰을 받지 못했습니다.');
            }
            
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('refreshToken', res.refreshToken);
            router.push('/dashboard');
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
