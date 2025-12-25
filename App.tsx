
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDay, Reservation, ReservationInput } from './types';
import { getReservations, saveReservation, deleteReservation } from './services/storageService';
import { ReservationForm } from './components/ReservationForm';
import { UpcomingListModal } from './components/UpcomingListModal';
import { CustomerHistoryModal } from './components/CustomerHistoryModal';
import { LoginScreen } from './components/LoginScreen';

// Utility for date handling - Fixed to use Local Time instead of UTC
const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthDays = (year: number, month: number): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];
  
  // Pad start
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.unshift({
      dateStr: '', // Padding
      dayOfMonth: 0,
      isCurrentMonth: false,
      isToday: false,
      isPast: true
    });
  }

  // Days
  const todayStr = getTodayStr();
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const yearStr = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const fullDateStr = `${yearStr}-${monthStr}-${dayStr}`;

    days.push({
      dateStr: fullDateStr,
      dayOfMonth: i,
      isCurrentMonth: true,
      isToday: fullDateStr === todayStr,
      isPast: fullDateStr < todayStr
    });
  }
  return days;
};

// Korean Holiday Logic
const isKoreanHoliday = (dateStr: string) => {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-');
  const md = `${month}-${day}`;
  const fixedHolidays = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'];
  if (fixedHolidays.includes(md)) return true;
  const variableHolidays = [
    '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12',
    '2024-04-10', '2024-05-06', '2024-05-15', '2024-09-16', '2024-09-17', '2024-09-18',
    '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-03', '2025-05-06', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08',
  ];
  return variableHolidays.includes(dateStr);
};

interface CustomerRecord {
  Name: string;
  Phone: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getTodayStr());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filteredCustomerReservations, setFilteredCustomerReservations] = useState<Reservation[]>([]);
  const [searchedCustomerName, setSearchedCustomerName] = useState('');
  const [nowTimeStr, setNowTimeStr] = useState(new Date().toTimeString().slice(0, 5));
  const [allCustomers, setAllCustomers] = useState<CustomerRecord[]>([]);

  useEffect(() => {
    const auth = localStorage.getItem('salon_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('salon_auth', 'true');
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimeStr(new Date().toTimeString().slice(0, 5));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadCustomerListRaw = async (): Promise<CustomerRecord[]> => {
    try {
      const response = await fetch('/all.csv');
      if (!response.ok) return [];
      const buffer = await response.arrayBuffer();
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch (e) {
        text = new TextDecoder('euc-kr').decode(buffer);
      }
      text = text.replace(/^\uFEFF/, '').trim();
      
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) return [];

      const result: CustomerRecord[] = [];
      const delimiter = text.includes('\t') ? '\t' : (text.includes(',') ? ',' : ' ');

      for (const line of lines.slice(1)) {
        const parts = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          result.push({ Name: parts[0], Phone: parts[1] });
        }
      }
      return result;
    } catch (err) {
      return [];
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomerListRaw().then(data => setAllCustomers(data));
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setNowTimeStr(new Date().toTimeString().slice(0, 5));
    await loadData();
    const freshCustomers = await loadCustomerListRaw();
    setAllCustomers(freshCustomers);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(getTodayStr());
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const filtered = reservations.filter(r => {
      const nameMatch = (r.customerName || '').toLowerCase().includes(query.toLowerCase());
      const cleanQuery = query.replace(/[^0-9]/g, '');
      const cleanPhone = (r.customerPhone || '').replace(/[^0-9]/g, '');
      
      let phoneMatch = false;
      if (cleanQuery !== '') {
        // 검색어가 숫자 4자리인 경우, 전화번호 뒷자리와 정확히 일치하는지 확인 (중간 번호 노이즈 제거)
        if (cleanQuery.length === 4 && query.length === 4) {
          phoneMatch = cleanPhone.endsWith(cleanQuery);
        } else {
          phoneMatch = cleanPhone.includes(cleanQuery);
        }
      }
      
      return nameMatch || phoneMatch;
    });

    setFilteredCustomerReservations(filtered);
    setSearchedCustomerName(query);
    setIsSearchOpen(true);
    setSearchQuery('');
  };

  const handleSave = async (input: ReservationInput, id?: string) => {
    try {
      setIsLoading(true);
      const saved = await saveReservation(input, id);
      if (id) { setReservations(prev => prev.map(r => r.id === id ? saved : r)); } 
      else { setReservations(prev => [...prev, saved]); }
      setIsFormOpen(false);
      setEditingReservation(null);
    } catch (e) { alert("저장 실패"); } finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteReservation(id);
      setReservations(prev => prev.filter(r => r.id !== id));
      setIsFormOpen(false);
      setEditingReservation(null);
    } catch (e) { alert("삭제 실패"); } finally { setIsLoading(false); }
  };

  const openAddForm = () => { setEditingReservation(null); setIsFormOpen(true); };
  const openEditForm = (res: Reservation) => { setEditingReservation(res); setIsFormOpen(true); };

  const calendarDays = useMemo(() => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);
  const selectedDateReservations = useMemo(() => 
    reservations.filter(r => r.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time)),
    [reservations, selectedDateStr]
  );
  const upcomingReservations = useMemo(() => {
    const today = getTodayStr();
    return reservations.filter(r => (r.date > today) || (r.date === today && r.time >= nowTimeStr));
  }, [reservations, nowTimeStr]);
  const todayRemainingCount = useMemo(() => {
    const today = getTodayStr();
    return reservations.filter(r => r.date === today && r.time >= nowTimeStr).length;
  }, [reservations, nowTimeStr]);

  const monthLabel = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
  const todayStr = getTodayStr();

  if (!isAuthenticated) return <LoginScreen onLogin={handleLoginSuccess} />;

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 relative">
      <header className="bg-slate-800 shadow-md z-10 px-4 py-3 flex justify-between items-center shrink-0 border-b border-slate-700 gap-4">
        <div className="flex-1 md:flex-none">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-blue-500">✂️</span> Vera
            <button onClick={handleRefresh} disabled={isLoading} className={`p-1 rounded-full hover:bg-slate-700 text-slate-500 transition-all ${isLoading ? 'animate-spin text-blue-500' : 'hover:text-blue-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15" /></svg>
            </button>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 hidden md:block">오늘 남은 예약: <span className="font-bold text-red-500">{todayRemainingCount}</span>건</p>
        </div>
        <div className="flex-1 max-w-xs md:max-w-sm">
           <form onSubmit={handleSearch} className="relative group">
              <input type="text" placeholder="고객명 또는 번호 검색..." className="w-full bg-slate-900/50 text-sm text-slate-200 border border-slate-700 rounded-full py-1.5 pl-9 pr-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-900 transition-all placeholder-slate-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </form>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <div className="hidden md:flex gap-3 items-center">
            <button onClick={() => setIsUpcomingOpen(true)} className="relative group focus:outline-none">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] rounded-xl border border-[#334155] hover:border-[#475569] shadow-lg transition-all transform group-hover:-translate-y-0.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border border-slate-500/30 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-200"><path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" /><path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
                    {upcomingReservations.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-800">{upcomingReservations.length}</span>}
                </div>
                <div className="flex flex-col items-start mr-1">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider leading-none mb-0.5">CHECK</span>
                    <span className="text-sm text-slate-200 font-extrabold leading-none font-sans">남은 예약</span>
                </div>
              </div>
            </button>
            <button onClick={openAddForm} className="relative group focus:outline-none">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] rounded-xl border border-[#334155] hover:border-blue-500/50 shadow-lg transition-all transform group-hover:-translate-y-0.5">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner border border-blue-400/30">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" /></svg>
                 </div>
                 <div className="flex flex-col items-start mr-1">
                    <span className="text-[10px] text-blue-400 font-bold tracking-wider leading-none mb-0.5">NEW</span>
                    <span className="text-sm text-white font-extrabold leading-none font-sans">예약하기</span>
                 </div>
              </div>
            </button>
          </div>
          <div className="flex md:hidden gap-3">
             <button onClick={() => setIsUpcomingOpen(true)} className="p-2.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                {upcomingReservations.length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
             </button>
             <button onClick={openAddForm} className="p-2.5 rounded-full bg-blue-600 text-white border border-blue-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        <div className="md:w-7/12 lg:w-2/3 flex flex-col border-b md:border-b-0 md:border-r border-slate-700 bg-slate-800 shrink-0 h-auto md:h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">◀</button>
            <div className="flex items-center gap-3">
               <h2 className="text-lg font-bold text-slate-100 tracking-wide">{monthLabel}</h2>
               <button onClick={goToToday} className="group p-1.5 rounded-full bg-slate-700/50 hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-600 transition-all shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" /><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" /></svg></button>
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">▶</button>
          </div>
          <div className="md:flex-1 px-2 md:px-4 pb-4 md:overflow-y-auto md:min-h-0 pt-2 md:pt-4">
            <div className="grid grid-cols-7 mb-2 text-center text-xs text-slate-500 font-medium"><div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div></div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day.isCurrentMonth) return <div key={idx} className="bg-slate-800/50 rounded-lg opacity-20 min-h-[50px]"></div>;
                const dayRes = reservations.filter(r => r.date === day.dateStr).sort((a, b) => a.time.localeCompare(b.time));
                const isSelected = day.dateStr === selectedDateStr;
                const isPast = day.dateStr < todayStr;
                const isRedDay = (idx % 7 === 0) || isKoreanHoliday(day.dateStr);

                let cellClasses = `relative p-1 rounded-xl border transition-all cursor-pointer flex flex-col ${isSelected ? "border-blue-500 ring-1 ring-blue-500 bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : (day.isToday ? "bg-slate-700/60 border-orange-500 shadow-sm" : "border-slate-700 hover:border-slate-500 bg-slate-800 hover:bg-slate-750")} ${isPast ? 'min-h-[50px] justify-center' : 'min-h-[110px]'}`;
                return (
                  <div key={idx} onClick={() => setSelectedDateStr(day.dateStr)} className={cellClasses}>
                    <div className={`flex items-center ${isPast ? 'justify-center gap-2' : 'justify-start gap-2 mb-1'}`}><span className={`text-xs md:text-sm font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${day.isToday ? 'bg-blue-600 text-white' : (isRedDay ? 'text-red-500 font-bold' : 'text-slate-400')}`}>{day.dayOfMonth}</span>{dayRes.length > 0 && <span className="text-[9px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded-full min-w-[16px] text-center">{dayRes.length}</span>}</div>
                    {!isPast && (
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        {dayRes.map(r => {
                          const isUpcoming = day.isToday && r.time >= nowTimeStr;
                          const isPastTime = day.isToday && r.time < nowTimeStr;
                          return (
                            <div key={r.id} className={`flex flex-col md:flex-row md:items-center px-1 md:px-1.5 py-1 rounded border overflow-hidden transition-all gap-0.5 md:gap-1.5 ${isUpcoming ? 'bg-slate-700 border-yellow-500/60 shadow-[0_0_8px_rgba(234,179,8,0.2)]' : 'bg-slate-800/80 border-slate-700/50'}`}>
                              <span className={`font-mono text-[9px] md:text-[10px] font-bold leading-none mb-0.5 md:mb-0 ${isPastTime ? 'text-slate-500' : 'text-amber-400'}`}>{r.time}</span>
                              {!isPastTime && <div className="flex flex-col md:flex-row md:items-center overflow-hidden w-full gap-0 md:gap-1"><span className="text-[9px] md:text-[10px] truncate leading-tight flex-1 font-bold text-cyan-300">{r.customerName}</span><span className={`text-[8px] md:text-[9px] truncate leading-tight shrink-0 font-medium ${r.memo ? 'text-pink-400' : 'text-lime-300'}`}>{r.serviceType}</span></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:w-5/12 lg:w-1/3 flex flex-col shrink-0 h-auto md:h-full bg-slate-900 border-l-0 md:border-l border-slate-700">
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center shadow-md z-10 shrink-0 sticky top-0 md:static">
            <div><h3 className="text-base md:text-lg font-bold text-slate-100">{selectedDateStr === getTodayStr() ? "오늘의 예약" : `${selectedDateStr} 예약`}</h3><p className="text-[10px] md:text-xs text-slate-400">총 <span className="text-red-500 font-bold">{selectedDateReservations.length}</span>건</p></div>
            <div className="flex items-center gap-2"><button onClick={openAddForm} className="md:hidden p-1.5 rounded-full bg-blue-600 text-white border border-blue-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button><button onClick={openAddForm} className="hidden md:flex group"><div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-b from-indigo-500 to-indigo-600 border border-indigo-400/30 shadow-[0_2px_0_rgb(55,48,163)]"><div className="bg-white/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg></div><span className="text-white text-xs font-bold">추가</span></div></button></div>
          </div>
          <div className="md:flex-1 md:overflow-y-auto bg-slate-900 p-4 pb-20 md:pb-4 space-y-3 custom-scrollbar min-h-[300px]">
            {selectedDateReservations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10"><div className="p-4 bg-slate-800 rounded-full"><svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div><p className="text-sm font-medium">이 날은 예약이 없습니다</p></div>
            ) : (
              selectedDateReservations.map(res => {
                const isPast = (selectedDateStr < getTodayStr()) || (selectedDateStr === getTodayStr() && res.time < nowTimeStr);
                return (
                    <div key={res.id} onClick={() => openEditForm(res)} className={`group relative flex items-stretch gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isPast ? 'bg-slate-800 border-slate-700 opacity-60' : 'bg-slate-800 border-slate-600 shadow-md hover:border-blue-500/50'}`}>
                       <div className={`flex flex-col items-center justify-center min-w-[3.5rem] border-r pr-4 ${isPast ? 'border-slate-700' : 'border-slate-700/50'}`}><span className={`font-mono text-xl md:text-2xl font-bold tracking-tight ${isPast ? 'text-slate-500' : 'text-amber-400'}`}>{res.time}</span></div>
                       <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <h4 className={`text-base md:text-lg font-bold truncate ${isPast ? 'text-slate-400' : 'text-slate-100'}`}>{res.customerName || "미입력"}</h4>
                                <div className="flex items-center gap-1">
                                  {res.customerPhone && <a href={`tel:${res.customerPhone.replace(/[^0-9]/g, '')}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-xs font-medium"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-500"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" /></svg><span className="text-slate-300">{res.customerPhone}</span></a>}
                                </div>
                             </div>
                             <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full font-bold border ml-2 ${isPast ? 'bg-slate-700/50 text-slate-500 border-slate-700' : res.memo ? 'bg-pink-900/30 text-pink-300 border-pink-700/50' : 'bg-lime-900/30 text-lime-300 border-lime-700/50'}`}>{res.serviceType}</span>
                          </div>
                          {res.memo && <div className={`text-xs leading-relaxed flex items-start gap-1.5 ${isPast ? 'text-purple-500/80' : 'text-purple-400'}`}><span className="shrink-0 mt-0.5 opacity-70">📝</span><span className="line-clamp-1 break-all">{res.memo}</span></div>}
                       </div>
                    </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <ReservationForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} onDelete={handleDelete} initialDate={selectedDateStr} reservationToEdit={editingReservation} />
      <UpcomingListModal isOpen={isUpcomingOpen} onClose={() => setIsUpcomingOpen(false)} onAdd={() => { setIsUpcomingOpen(false); openAddForm(); }} reservations={upcomingReservations} />
      <CustomerHistoryModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        customerName={searchedCustomerName} 
        reservations={filteredCustomerReservations} 
        allCustomers={allCustomers}
      />
    </div>
  );
}
