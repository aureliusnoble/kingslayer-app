interface TimerProps {
  seconds?: number;
  label: string;
}

export default function Timer({ seconds, label }: TimerProps) {
  const formatTime = (sec?: number) => {
    if (sec === undefined || sec === null) return 'Ready';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isReady = !seconds || seconds === 0;

  return (
    <div className="text-center">
      <p className="text-sm text-neutral-medium">{label}</p>
      <p className={`font-mono text-2xl font-bold ${isReady ? 'text-green-600' : 'text-neutral-dark'}`}>
        ⏱ {formatTime(seconds)}
      </p>
    </div>
  );
}