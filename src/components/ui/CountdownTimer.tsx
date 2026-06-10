import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getNextSundayMidnight(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=dom
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);
  next.setHours(23, 59, 59, 0);
  return next;
}

/** Dígito individual com animação de troca */
function Digit({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlip(true);
      const t = setTimeout(() => {
        setPrev(value);
        setFlip(false);
      }, 280);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-navy-800 shadow-soft-lg sm:h-16 sm:w-16">
        {/* Linha do meio (efeito flip clock) */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-black/20" />
        <span
          className={`font-display text-3xl font-bold text-white transition-none sm:text-4xl ${flip ? "animate-count-flip" : ""}`}
          key={value}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-navy-400">{label}</span>
    </div>
  );
}

interface CountdownTimerProps {
  targetDate?: Date;
  label?: string;
  promoLabel?: string;
}

/** Countdown timer com visual de relógio flip. */
export function CountdownTimer({
  targetDate,
  label = "⚡ Promoção Relâmpago",
  promoLabel = "Aproveite antes que acabe!",
}: CountdownTimerProps) {
  const target = targetDate ?? getNextSundayMidnight();

  const calc = (): TimeLeft => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { hours: Math.min(h, 99), minutes: m, seconds: s };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ended = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (ended) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 px-6 py-6 shadow-soft-lg sm:px-8 sm:py-7">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white animate-pulse-scale">
            <Zap size={13} /> {label}
          </span>
          <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{promoLabel}</p>
          <p className="mt-1 text-sm text-navy-300">Termina em:</p>
        </div>

        <div className="flex items-start gap-2 sm:gap-3">
          <Digit value={timeLeft.hours} label="Horas" />
          <span className="mt-3 font-display text-3xl font-bold text-orange-400 sm:text-4xl">:</span>
          <Digit value={timeLeft.minutes} label="Min" />
          <span className="mt-3 font-display text-3xl font-bold text-orange-400 sm:text-4xl">:</span>
          <Digit value={timeLeft.seconds} label="Seg" />
        </div>
      </div>
    </div>
  );
}
