
import React from 'react';
import { Reservation } from '../types';
import { Button } from './Button';

interface CustomerRecord {
  Name: string;
  Phone: string;
}

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string; // This is the search query
  reservations: Reservation[];
  allCustomers: CustomerRecord[];
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  customerName, 
  reservations,
  allCustomers 
}) => {
  if (!isOpen) return null;

  // Grouping and sorting
  const sortedReservations = [...reservations].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  const grouped = sortedReservations.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Reservation[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const totalCount = reservations.length;

  // Helper to find and group matching customer records from all.csv based on search query
  const getGroupedMatches = () => {
    const query = (customerName || '').trim();
    const queryDigits = query.replace(/[^0-9]/g, '');
    
    // 원장님 요청: 검색어가 정확히 숫자 4자리일 때만 장부(all.csv)에서 대조 데이터를 가져옴
    const is4DigitQuery = queryDigits.length === 4 && query.length === 4;

    if (!is4DigitQuery) {
      return {}; // 숫자 4자리 검색이 아니면(이름 검색 등) 장부 데이터를 가져오지 않음
    }

    const matches = allCustomers.filter(c => {
      // 장부 내 전화번호 뒷자리가 일치하는지 확인
      const csvPhoneDigits = c.Phone.replace(/[^0-9]/g, '');
      return csvPhoneDigits.endsWith(queryDigits);
    });

    // Group by full phone string as it appears in CSV
    return matches.reduce((acc, curr) => {
      if (!acc[curr.Phone]) acc[curr.Phone] = [];
      if (!acc[curr.Phone].includes(curr.Name)) {
        acc[curr.Phone].push(curr.Name);
      }
      return acc;
    }, {} as Record<string, string[]>);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const getDayLabel = (dateStr: string) => {
     const today = new Date().toISOString().split('T')[0];
     if (dateStr === today) return '오늘';
     return formatDate(dateStr);
  };

  const isFuture = (dateStr: string) => {
      const today = new Date().toISOString().split('T')[0];
      return dateStr >= today;
  }

  // Pre-calculate matches for this search session
  const groupedMatches = getGroupedMatches();
  const matchEntries = Object.entries(groupedMatches);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl overflow-hidden flex flex-col h-[85vh] border border-slate-700 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
               🔍 <span className="text-blue-400">{customerName}</span> 검색 결과
               <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 ml-2">
                 {totalCount}건
               </span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">상세 예약 내역을 확인하세요.</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
               </div>
              <p>검색된 예약 내역이 없습니다.</p>
            </div>
          ) : (
            sortedDates.map((date, idx) => {
                const dayLabel = getDayLabel(date);
                const isToday = dayLabel === '오늘';
                const isFutureDate = isFuture(date);
                
                return (
                    <div key={date} className={`relative pl-1 ${idx !== 0 ? 'mt-8' : ''}`}>
                        <div className="flex items-center gap-3 mb-3 py-2 border-b border-slate-700/50">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isToday ? 'text-blue-400' : (isFutureDate ? 'text-emerald-400' : 'text-slate-500')}`}>
                                {dayLabel === '오늘' && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded mr-1 shadow-sm shadow-blue-500/30">TODAY</span>}
                                {dayLabel !== '오늘' ? formatDate(date) : dayLabel}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {grouped[date].sort((a, b) => b.time.localeCompare(a.time)).map(r => {
                                return (
                                <div 
                                    key={r.id} 
                                    className={`group relative flex flex-row items-center border rounded-xl p-3 md:p-4 transition-all duration-200 shadow-sm
                                        ${isFutureDate 
                                            ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-blue-500/30' 
                                            : 'bg-slate-800/30 border-slate-800 opacity-75'}`}
                                >
                                    <div className="w-16 md:w-20 shrink-0 flex flex-col items-center justify-center border-r border-slate-700/50 pr-3 mr-3">
                                        <span className={`text-lg md:text-xl font-mono font-bold tracking-tight leading-none ${isFutureDate ? 'text-amber-400' : 'text-slate-500'}`}>{r.time}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 truncate pr-2">
                                                <span className={`text-base md:text-lg font-bold truncate ${isFutureDate ? 'text-slate-100' : 'text-slate-400'}`}>
                                                    {r.customerName}
                                                </span>
                                            </div>
                                            <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border font-bold tracking-wide
                                                ${r.memo 
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                                                    : 'bg-lime-500/10 text-lime-300 border-lime-500/20'}
                                            `}>
                                                {r.serviceType}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1 text-xs text-slate-400">
                                            {matchEntries.length > 0 ? (
                                                matchEntries.map(([phone, names]) => (
                                                    <div key={phone} className="flex items-center gap-1.5 overflow-hidden">
                                                        <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="shrink-0 flex items-center gap-1.5 hover:text-blue-400 transition-colors font-medium">
                                                            <svg className={`w-3.5 h-3.5 ${isFutureDate ? 'text-red-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                            <span>{phone}</span>
                                                        </a>
                                                        <span className="truncate text-slate-500">/ {names.join(' / ')}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                r.customerPhone ? (
                                                    <a href={`tel:${r.customerPhone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 hover:text-blue-400 transition-colors font-medium">
                                                        <svg className={`w-3.5 h-3.5 ${isFutureDate ? 'text-red-500' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                        {r.customerPhone}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-600 italic">연락처 없음</span>
                                                )
                                            )}
                                            
                                            {r.memo && (
                                                <span className="flex items-center gap-1.5 text-purple-400 truncate mt-0.5">
                                                    <svg className="w-3.5 h-3.5 shrink-0 text-purple-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    <span className="truncate">{r.memo}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/80 flex justify-end">
            <Button onClick={onClose} variant="secondary" className="px-8 shadow-lg w-full md:w-auto">
                닫기
            </Button>
        </div>
      </div>
    </div>
  );
};
