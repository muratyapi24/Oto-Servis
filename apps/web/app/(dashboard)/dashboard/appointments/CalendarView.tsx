"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { dragAndDropAppointment } from '@/lib/actions/appointment.actions';
import { AppointmentDialog } from './AppointmentDialog';
import { Loader2 } from 'lucide-react';
import './calendar-styles.css';

const locales = {
  'tr': tr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Tip hatalarını aşmak için any casting
const DnDCalendar = withDragAndDrop(Calendar as any);

interface CalendarViewProps {
  appointments: any[];
  customers: any[];
  vehicles: any[];
}

export function CalendarView({ appointments, customers, vehicles }: CalendarViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Randevuları takvimin anlayacağı formata (start/end) çeviriyoruz
  const events = useMemo(() => {
    return appointments.map(apt => {
      // Create starting date
      const startDate = new Date(apt.appointmentDate);
      const [hours, minutes] = (apt.appointmentTime || "09:00").split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Default 1 hour duration
      const endDate = new Date(startDate);
      endDate.setHours(hours + 1);

      // Müşteri isteğine özel format: "34ABC123 - Ali Yılmaz (Periyodik Bakım)"
      const plate = apt.vehicle?.plate || "Araçsız";
      const title = `${plate} - ${apt.customerName} (${apt.type})`;

      return {
        id: apt.id,
        title,
        start: startDate,
        end: endDate,
        resource: apt // Orijinal datayı tutuyoruz
      };
    });
  }, [appointments]);

  const onEventDrop = useCallback(
    async ({ event, start, end }: any) => {
      // Uyarı mesajı
      const confirmMove = window.confirm(`Randevuyu ${format(start, 'dd.MM.yyyy HH:mm')} zamanına taşımak istediğinize emin misiniz?`);
      
      if (!confirmMove) return;

      setIsLoading(true);
      try {
        const newTime = format(start, 'HH:mm');
        const res = await dragAndDropAppointment(event.id, start, newTime);
        
        if (res.error) {
          alert(res.error);
        }
      } catch (err) {
        console.error("Yeniden boyutlandırma hatası:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Randevu süresini sürükleyerek (boyutunu) değiştirme
  const onEventResize = useCallback(
    async ({ event, start, end }: any) => {
       // Opsiyonel: Şimdilik sadece drop destekliyoruz, süre değişimi de aktif.
    },
    []
  );

  // Bir randevuya tıklandığında dialog aç
  const handleEventSelect = (event: any) => {
    // Statüsü tamamlandı falan ise edite izin vermeyebiliriz, resource'da status var.
    setSelectedApt(event.resource);
    // Dialog'u tıklama anında oluşturamıyoruz, state ile kontrol edeceğiz
    setDialogOpen(true);
  };

  // Randevuların statüsüne göre renklendirme
  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6'; // Mavi - COMPLETED
    
    if (status === 'CONFIRMED') backgroundColor = '#10b981'; // Yeşil
    else if (status === 'PENDING') backgroundColor = '#f59e0b'; // Sarı
    else if (status === 'CANCELLED') backgroundColor = '#ef4444'; // Kırmızı
    else if (status === 'NO_SHOW') backgroundColor = '#6b7280'; // Gri

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold'
      }
    };
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 font-bold text-gray-700">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            Güncelleniyor...
          </div>
        </div>
      )}

      {/* Tıklanan Randevuyu Düzenleme (Gizli Dialog tetikleyici yapı) */}
      {dialogOpen && selectedApt && (
        <div className="hidden">
           <AppointmentDialog 
             customers={customers} 
             vehicles={vehicles} 
             initialData={selectedApt} 
           />
        </div>
      )}

      <div style={{ height: '70vh', minHeight: '600px' }} className="calendar-container">
        <DnDCalendar
          localizer={localizer}
          events={events}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          resizable
          onSelectEvent={handleEventSelect}
          defaultView="month"
          views={['month', 'week', 'day']}
          step={30}
          showMultiDayTimes
          eventPropGetter={eventStyleGetter}
          culture="tr"
          messages={{
            next: "İleri",
            previous: "Geri",
            today: "Bugün",
            month: "Ay",
            week: "Hafta",
            day: "Gün",
            agenda: "Ajanda",
            date: "Tarih",
            time: "Zaman",
            event: "Olay",
            noEventsInRange: "Bu aralıkta randevu bulunmuyor."
          }}
        />
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs font-bold text-gray-500 flex-wrap">
         <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#f59e0b]"></span> Bekliyor</span>
         <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#10b981]"></span> Onaylı</span>
         <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#3b82f6]"></span> Servise Döndü (Tamamlandı)</span>
         <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#ef4444]"></span> İptal</span>
      </div>
    </div>
  );
}
