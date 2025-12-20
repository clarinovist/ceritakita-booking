import BookingForm from '@/components/BookingForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <BookingForm />

      <div className="text-center mt-8 text-gray-400 text-sm">
        <a href="/admin" className="hover:underline">Login Admin</a>
      </div>
    </main>
  );
}
