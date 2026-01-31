import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
    title: 'Galeri Foto | CeritaKita Studio',
    description: 'Lihat galeri hasil sesi foto CeritaKita Studio dan temukan inspirasi untuk momenmu.',
    alternates: {
        canonical: '/gallery',
    },
};

export default function GalleryPage() {
    return <GalleryClient />;
}
