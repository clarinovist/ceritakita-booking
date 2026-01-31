import type { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
    title: 'Login Admin | CeritaKita Studio',
    alternates: {
        canonical: '/login',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function LoginPage() {
    return <LoginClient />;
}
