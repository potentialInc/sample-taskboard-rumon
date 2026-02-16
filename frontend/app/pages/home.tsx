import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col items-center justify-center text-white select-none relative"
      style={{ background: 'linear-gradient(180deg, #4A90D9 0%, #3A7BC8 100%)' }}
    >
      {/* Main Content */}
      <main className="flex flex-col items-center z-10 animate-in fade-in zoom-in duration-300">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter animate-pulse">
          TaskBoard
        </h1>
        <div className="mt-6 text-white/90">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </main>

      {/* Background Decoration */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay opacity-20" />
    </div>
  );
}
