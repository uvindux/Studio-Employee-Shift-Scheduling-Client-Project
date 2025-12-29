
import React, { useMemo } from 'react';
import { Shift, Staff } from '../types';
import { Users } from 'lucide-react';

interface ScheduleCalendarProps {
  shifts: Shift[];
  staff: Staff[];
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ shifts, staff }) => {
  // Determine all months with shifts
  const months = useMemo(() => {
    if (shifts.length === 0) return [];

    const monthSet = new Set<string>();
    shifts.forEach(s => {
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthSet.add(key);
    });

    return Array.from(monthSet)
      .sort()
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return { year, month };
      });
  }, [shifts]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    shifts.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });

    // Sort shifts within each day by start time
    Object.keys(map).forEach(date => {
      map[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [shifts]);

  // Helper to get staff details
  const getStaff = (id?: string) => {
    if (!id) return undefined;
    const found = staff.find(s => s.id === id);
    if (!found) {
      console.warn(`Staff ID not found: "${id}". Available IDs:`, staff.map(s => s.id));
    }
    return found;
  };

  // Render a single month calendar
  const renderMonth = (year: number, monthNum: number) => {
    const startOfMonth = new Date(year, monthNum, 1);
    const endOfMonth = new Date(year, monthNum + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const emptyDays = startOfMonth.getDay();
    const monthLabel = startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const renderDays = () => {
      const days = [];

      // Empty slots for start of month
      for (let i = 0; i < emptyDays; i++) {
        days.push(<div key={`empty-${i}`} className="bg-gray-50/30 min-h-[120px] border-b border-r border-gray-100"></div>);
      }

      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, monthNum, d);
        const dateStr = dateObj.toISOString().split('T')[0];

        const dayShifts = shiftsByDate[dateStr] || [];
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        const getSlotLabel = (start: string) => {
          if (start === '06:30') return { label: 'M', color: 'bg-blue-100 text-blue-800' };
          if (start === '08:30') return { label: 'D', color: 'bg-orange-100 text-orange-800' };
          if (start === '14:45') return { label: 'E', color: 'bg-indigo-100 text-indigo-800' };
          return { label: '?', color: 'bg-gray-100 text-gray-800' };
        };

        days.push(
          <div key={d} className={`bg-white min-h-[120px] border-b border-r border-gray-100 p-1.5 relative hover:bg-gray-50 transition flex flex-col ${isToday ? 'bg-indigo-50/10 ring-1 ring-inset ring-indigo-100' : ''}`}>
            <div className={`text-xs font-bold mb-1 ${isToday ? 'text-primary' : 'text-gray-700'}`}>
              {d}
            </div>

            <div className="flex-1 flex flex-col gap-1">
              {dayShifts.map(shift => {
                const assignedStaff = getStaff(shift.assignedStaffId);
                const { label, color } = getSlotLabel(shift.startTime);

                return (
                  <div key={shift.id} className="flex items-center gap-1 overflow-hidden">
                    <span className={`flex-shrink-0 w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded ${color}`}>
                      {label}
                    </span>
                    <div className={`flex-1 text-[11px] truncate py-0.5 px-1 rounded border ${assignedStaff ? 'bg-white border-gray-100 text-gray-700 font-medium shadow-sm' : 'bg-red-50 border-red-100 text-red-400 italic'}`}>
                      {assignedStaff ? assignedStaff.name : 'Unassigned'}
                    </div>
                  </div>
                );
              })}

              {dayShifts.length === 0 && (
                <div className="flex-1 flex items-center justify-center opacity-20">
                  <div className="h-full w-px bg-gray-300 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        );
      }
      return days;
    };

    return (
      <div key={`${year}-${monthNum}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-bold text-gray-900">{monthLabel}</h3>
        </div>
        <div className="grid grid-cols-7 bg-gray-50 text-[9px] font-bold text-gray-400 tracking-wider text-center py-1 border-b border-gray-200">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>
        <div className="grid grid-cols-7 bg-gray-100 gap-px">
          {renderDays()}
        </div>
      </div>
    );
  };

  return (
    <div id="calendar" className="bg-gray-50/50 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Schedule Overview</h2>
            <p className="text-xs text-gray-500">Staff Assignments</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-gray-600">Morning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span className="text-gray-600">Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-gray-600">Evening</span>
          </div>
        </div>
      </div>

      {/* Calendars Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {months.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-sm">No shifts scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {months.map(({ year, month }) => renderMonth(year, month))}
          </div>
        )}
      </div>
    </div>
  );
};

