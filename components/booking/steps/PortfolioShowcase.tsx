import Image from 'next/image';
import { Camera } from 'lucide-react';

interface PortfolioShowcaseProps {
    selectedService: any;
    portfolioImages: string[];
    openLightbox: (imageUrl: string) => void;
}

export const PortfolioShowcase = ({
    selectedService,
    portfolioImages,
    openLightbox
}: PortfolioShowcaseProps) => {
    if (!selectedService || portfolioImages.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-olive-200 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-4 text-olive-800 font-bold">
                <Camera className="text-gold-600" size={20} />
                <h3 className="font-display text-xl">Portfolio {selectedService.name}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {portfolioImages.map((imageUrl, index) => (
                    <div
                        key={index}
                        className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                        onClick={() => openLightbox(imageUrl)}
                    >
                        <Image
                            src={imageUrl}
                            alt={`Portfolio ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, 33vw"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-olive-500 mt-3">Klik gambar untuk memperbesar</p>
        </div>
    );
};
