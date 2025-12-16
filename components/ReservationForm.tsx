import React, { useState, useEffect, useMemo } from 'react';
import { Reservation, ReservationInput } from '../types';
import { TIME_SLOTS } from '../constants';
import { getServiceOptions } from '../services/storageService';
import { Button } from './Button';

interface ReservationFormProps {
  initialDate: string;
  reservationToEdit?: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReservationInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  initialDate,
  reservationToEdit,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState<ReservationInput>({
    customerName: '',
    customerPhone: '',
    date: initialDate,
    time: '12:00',
    serviceType: '컷', // Default fallback
    memo: ''
  });

  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load Service Options
  useEffect(() => {
    if (isOpen) {
      getServiceOptions().then(options => {
        setServiceOptions(options);
        // If not editing, set default service to the first option available
        if (!reservationToEdit && options.length > 0) {
           setFormData(prev => ({ ...prev, serviceType: options[0] }));
        }
      });
      setShowDeleteConfirm(false); // Reset delete confirm state when opening
    }
  }, [isOpen, reservationToEdit]);

  useEffect(() => {
    if (isOpen) {
      if (reservationToEdit) {
        setFormData({
          customerName: reservationToEdit.customerName,
          customerPhone: reservationToEdit.customerPhone,
          date: reservationToEdit.date,
          time: reservationToEdit.time,
          serviceType: reservationToEdit.serviceType,
          memo: reservationToEdit.memo
        });
      } else {
        // New Reservation Logic
        let defaultTime = TIME_SLOTS[0]; // Default start time (10:10)

        // Check if the selected date is "Today" (Local Time)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localTodayStr = `${year}-${month}-${day}`;

        if (initialDate === localTodayStr) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          
          // Find the first slot that is equal to or later than the current time
          const nextSlot = TIME_SLOTS.find(slot => {
            const [h, m] = slot.split(':').map(Number);
            return (h * 60 + m) >= currentMinutes;
          });

          if (nextSlot) {
            defaultTime = nextSlot;
          }
        }

        setFormData(prev => ({
          customerName: '',
          customerPhone: '',
          date: initialDate,
          time: defaultTime,
          serviceType: serviceOptions.length > 0 ? serviceOptions[0] : '컷',
          memo: ''
        }));
      }
      setError('');
    }
  }, [isOpen, reservationToEdit, initialDate, serviceOptions.length]);

  // Filter available time slots
  const availableTimeSlots = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    // If selected date is NOT today, show all slots
    if (formData.date !== todayStr) return TIME_SLOTS;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return TIME_SLOTS.filter(slot => {
      // Always keep the currently selected time in the list to prevent UI issues
      // (e.g. if editing a past reservation, or if the default time was set just before the minute changed)
      if (slot === formData.time) return true;

      const [h, m] = slot.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      
      // Show only future or current time slots
      return slotMinutes >= currentMinutes;
    });
  }, [formData.date, formData.time]);

  const handleChange = (field: keyof ReservationInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() && !formData.customerPhone.trim()) {
      setError('고객명 또는 전화번호 중 하나는 반드시 입력해야 합니다.');
      return;
    }
    onSave(formData, reservationToEdit?.id);
  };

  // Handler to show confirmation UI
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // Handler to actually perform delete
  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (reservationToEdit && onDelete) {
      onDelete(reservationToEdit.id);
    }
  };

  if (!isOpen) return null;

  // Compact input styling
  const inputClass = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm placeholder-slate-400 transition-shadow";
  const labelClass = "block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-700 animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center shrink-0">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            {reservationToEdit ? '✏️ 예약 수정' : '✨ 새 예약 등록'}
          </h2>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Row 1: Date & Time */}
          <div className="flex gap-3">
            <div className="flex-[3]">
              <label className={labelClass}>📅 날짜</label>
              <input
                type="date"
                required
                className={inputClass}
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
            <div className="flex-[2]">
              <label className={labelClass}>⏰ 시간</label>
              <select
                className={`${inputClass} appearance-none cursor-pointer`}
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
              >
                {availableTimeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Customer Info */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>👤 고객명</label>
              <input
                type="text"
                placeholder="이름"
                className={inputClass}
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
              />
            </div>
            <div className="flex-[1.2]">
              <label className={labelClass}>📞 연락처</label>
              <input
                type="tel"
                placeholder=""
                className={inputClass}
                value={formData.customerPhone}
                onChange={(e) => handleChange('customerPhone', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-300 bg-red-900/30 border border-red-800/50 p-2 rounded-lg">{error}</p>}

          {/* Service Selection (Chips) */}
          <div>
            <label className={labelClass}>✂️ 서비스 선택</label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.length === 0 ? (
                  <span className="text-xs text-slate-500">서비스 목록을 불러오는 중...</span>
              ) : (
                serviceOptions.map(service => {
                  const isSelected = formData.serviceType === service;
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleChange('serviceType', service)}
                      className={`
                        px-3 py-1.5 text-xs font-bold rounded-full border transition-all transform active:scale-95
                        ${isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/50 scale-105 ring-1 ring-blue-400'
                          : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600 hover:text-slate-200'}
                      `}
                    >
                      {service}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className={labelClass}>📝 메모</label>
            <textarea
              rows={2}
              placeholder="특이사항 (선택)"
              className={`${inputClass} resize-none py-2`}
              value={formData.memo}
              onChange={(e) => handleChange('memo', e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2 shrink-0 min-h-[72px] items-center">
          {showDeleteConfirm ? (
             <div className="w-full flex flex-col gap-2 animate-[fadeIn_0.2s]">
                <p className="text-red-400 text-xs font-bold text-center">정말로 삭제하시겠습니까? 복구할 수 없습니다.</p>
                <div className="flex gap-2 w-full">
                    <Button variant="secondary" size="sm" type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                        취소
                    </Button>
                    <Button variant="danger" size="sm" type="button" onClick={handleConfirmDelete} className="flex-1">
                        삭제 확인
                    </Button>
                </div>
             </div>
          ) : (
             <>
               {reservationToEdit && onDelete && (
                 <Button variant="danger" size="sm" type="button" onClick={handleDeleteClick} className="w-16">
                   삭제
                 </Button>
               )}
               <Button variant="secondary" size="sm" type="button" onClick={onClose} className="flex-1">
                 취소
               </Button>
               <Button type="button" onClick={handleSubmit} size="sm" className="flex-[2] shadow-lg shadow-blue-900/20">
                 {reservationToEdit ? '저장하기' : '등록하기'}
               </Button>
             </>
          )}
        </div>
      </div>
    </div>
  );
};