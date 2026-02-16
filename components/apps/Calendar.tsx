
import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate grid padding
  const startDay = monthStart.getDay(); // 0-6

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex bg-white text-slate-800">
       {/* Sidebar - Events */}
       <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
           <h2 className="text-3xl font-light text-slate-800 mb-1">{format(selectedDate, 'd')}</h2>
           <h3 className="text-xl text-slate-500 mb-8">{format(selectedDate, 'EEEE')}</h3>

           <div className="flex-1">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Events</p>
               <div className="text-sm text-slate-500 italic">No events scheduled</div>
           </div>

           <button className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">
               <Plus size={18} /> New Event
           </button>
       </div>

       {/* Main Calendar */}
       <div className="flex-1 flex flex-col p-8">
           <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
               <div className="flex gap-2">
                   <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                   <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={20}/></button>
               </div>
           </div>

           <div className="grid grid-cols-7 mb-4">
               {weekDays.map(d => (
                   <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
               ))}
           </div>

           <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
               {/* Empty slots for start of month */}
               {Array(startDay).fill(null).map((_, i) => (
                   <div key={`empty-${i}`} />
               ))}

               {days.map(day => (
                   <button
                       key={day.toISOString()}
                       onClick={() => setSelectedDate(day)}
                       className={`
                           relative rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200
                           ${isSameDay(day, selectedDate) ? 'bg-blue-600 text-white shadow-md scale-105 z-10' : 'hover:bg-slate-100 text-slate-700'}
                           ${isToday(day) && !isSameDay(day, selectedDate) ? 'text-blue-600 font-bold bg-blue-50' : ''}
                       `}
                   >
                       {format(day, 'd')}
                       {isToday(day) && (
                           <div className={`w-1 h-1 rounded-full mt-1 ${isSameDay(day, selectedDate) ? 'bg-white' : 'bg-blue-600'}`} />
                       )}
                   </button>
               ))}
           </div>
       </div>
    </div>
  );
};
