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

const registerSchema = z.object({
    email: z.string().email('유효한 이메일을 입력해주세요.'),
    nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Backend expects: email, password, nickname
            await api.post('auth/register', {
                json: {
                    email: data.email,
                    password: data.password,
                    nickname: data.nickname
                }
            });
            // Try to login immediately or redirect to login page
            router.push('/login');
        } catch (err: any) {
            if (err.name === 'HTTPError') {
                const errorData = await err.response.json();
                setError(errorData.message || '회원가입에 실패했습니다.');
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
                    <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
                    <CardDescription className="text-center">
                        새로운 계정을 생성하세요.
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
                            label="닉네임"
                            type="text"
                            placeholder="홍길동"
                            error={errors.nickname?.message}
                            {...register('nickname')}
                        />
                        <Input
                            label="비밀번호"
                            type="password"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <Input
                            label="비밀번호 확인"
                            type="password"
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />
                        {error && <div className="text-sm text-red-500 text-center">{error}</div>}
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            회원가입
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-sm text-gray-500">
                    이미 계정이 있으신가요?
                    <Link href="/login" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        로그인
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
