'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const forgotPasswordSchema = z.object({
    email: z.string().email('유효한 이메일을 입력해주세요.'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        // Mock API call
        console.log('Password reset requested for:', data.email);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show feature unavailable message as per requirements
        setFormError("현재 비밀번호 찾기 기능은 서버에서 지원하지 않습니다. (개발 중)");
        // setIsSubmitted(true); // Uncomment if we want to show success UI instead
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">비밀번호 찾기</CardTitle>
                    <CardDescription className="text-center">
                        가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Input
                                label="이메일"
                                type="email"
                                placeholder="name@example.com"
                                error={errors.email?.message}
                                {...register('email')}
                            />
                            {formError && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                                    ⚠️ {formError}
                                </div>
                            )}
                            <Button type="submit" className="w-full">
                                이메일 전송
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="text-green-600 font-medium">
                                이메일이 전송되었습니다!
                            </div>
                            <p className="text-sm text-gray-500">
                                메일함을 확인해주세요. (현재 데모 모드입니다)
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        로그인 페이지로 돌아가기
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
