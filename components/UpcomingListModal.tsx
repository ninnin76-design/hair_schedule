
import React from 'react';
import { Reservation } from '../types';
import { Button } from './Button';

interface UpcomingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  reservations: Reservation[];
}

export const UpcomingListModal: React.FC<UpcomingListModalProps> = ({ isOpen, onClose, onAdd, reservations }) => {
  if (!isOpen) return null;

  // Group by date
  const grouped = reservations.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Reservation[]>);

  // Sort dates
  const sortedDates = Object.keys(grouped).sort();
  
  // Calculate total count
  const totalCount = reservations.length;

  // Helper to format date nicely (e.g., 2024-10-25 -> 10월 25일 (금))
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const getDayLabel = (dateStr: string) => {
     const today = new Date().toISOString().split('T')[0];
     // Simple check for tomorrow
     const d = new Date();
     d.setDate(d.getDate() + 1);
     const tomorrow = d.toISOString().split('T')[0];

     if (dateStr === today) return '오늘';
     if (dateStr === tomorrow) return '내일';
     return formatDate(dateStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden flex flex-col h-[85vh] border border-slate-700 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
               📅 전체 예약 일정
               <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 ml-2">
                 총 {totalCount}건
               </span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">오늘부터 잡혀있는 모든 예약을 한눈에 확인하세요</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 hover:border-slate-500 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto p-4 md:p-6 bg-slate-900 custom-scrollbar">
          {sortedDates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-20">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
               </div>
              <p>현재 잡혀있는 예약이 없습니다.</p>
            </div>
          ) : (
            sortedDates.map((date, idx) => {
                const dayLabel = getDayLabel(date);
                const isToday = dayLabel === '오늘';
                const dayCount = grouped[date].length;
                
                return (
                    <div key={date} className={`relative pl-1 ${idx !== 0 ? 'mt-8' : ''}`}>
                        {/* Date Header - Removed Sticky, Added distinctive colors */}
                        <div className="flex items-center gap-3 mb-3 py-2 border-b border-slate-700/50">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isToday ? 'text-blue-400' : 'text-emerald-400'}`}>
                                {dayLabel === '오늘' && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded mr-1 shadow-sm shadow-blue-500/30">TODAY</span>}
                                {dayLabel !== '오늘' && dayLabel !== '내일' ? formatDate(date) : dayLabel}
                                {dayLabel === '내일' && <span className="text-xs text-slate-500 font-normal ml-1">({formatDate(date)})</span>}
                                <span className="text-sm font-medium text-slate-500 ml-1">({dayCount}건)</span>
                            </h3>
                        </div>

                        {/* Reservation Items Grid/List */}
                        <div className="grid grid-cols-1 gap-3">
                            {grouped[date].sort((a, b) => a.time.localeCompare(b.time)).map(r => (
                                <div 
                                    key={r.id} 
                                    className="group relative flex flex-row items-center bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/30 rounded-xl p-3 md:p-4 transition-all duration-200 shadow-sm"
                                >
                                    {/* Time - Removed "TIME" label */}
                                    <div className="w-16 md:w-20 shrink-0 flex flex-col items-center justify-center border-r border-slate-700/50 pr-3 mr-3">
                                        <span className="text-lg md:text-xl font-mono font-bold text-amber-400 tracking-tight leading-none">{r.time}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <span className="text-base md:text-lg font-bold text-slate-100 truncate">
                                                    {r.customerName || <span className="italic text-slate-500 text-sm">이름 미입력</span>}
                                                </span>
                                            </div>
                                            {/* Service Badge - Toned down colors for memo */}
                                            <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-bold tracking-wide
                                                ${r.memo 
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                                                    : 'bg-lime-500/10 text-lime-300 border-lime-500/20'}
                                            `}>
                                                {r.serviceType}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-400">
                                            {r.customerPhone && (
                                                <a href={`tel:${r.customerPhone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                                                    {/* Phone Icon made RED */}
                                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    {r.customerPhone}
                                                </a>
                                            )}
                                            {r.memo && (
                                                <span className="flex items-center gap-1.5 text-purple-400 truncate">
                                                    <svg className="w-3.5 h-3.5 shrink-0 text-purple-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    <span className="truncate">{r.memo}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/80 flex justify-end gap-2">
            <Button onClick={onAdd} variant="primary" className="px-8 shadow-lg w-full md:w-auto">
                예약하기
            </Button>
            <Button onClick={onClose} variant="secondary" className="px-8 shadow-lg w-full md:w-auto">
                닫기
            </Button>
        </div>
      </div>
    </div>
  );
};
