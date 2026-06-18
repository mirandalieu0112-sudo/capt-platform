import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

export default function WaveformDisplay({ audioUrl }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#06b6d4',
      progressColor: '#fbbf24',
      cursorColor: '#f8fafc',
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 60,
      barGap: 3,
      normalize: true,
      url: audioUrl,
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    waveSurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  };

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 w-full mt-4">
      <button 
        onClick={handlePlayPause}
        className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/30 transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </button>
      <div ref={containerRef} className="flex-1 w-full overflow-hidden" />
    </div>
  );
}
