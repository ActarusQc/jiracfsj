import React from 'react';
import { useTicketStore } from '../../store/ticketStore';
import { useProjectStore } from '../../store/projectStore';
import { TIMELINE_COLORS, COLUMNS } from '../../constants/kanban';
import { formatDate, isToday, getMonthDays } from '../../utils/dateUtils';
import { useTimelineDragAndDrop } from '../../hooks/useTimelineDragAndDrop';

interface MonthViewProps {
  currentDate: Date;
  selectedProjectId: string | null;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  currentDate,
  selectedProjectId 
}) => {
  const tickets = useTicketStore((state) => state.tickets);
  const getProject = useProjectStore((state) => state.getProject);
  const days = getMonthDays(currentDate);
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
    days.slice(i * 7, (i + 1) * 7)
  );
  const { handleDragStart, isDragging } = useTimelineDragAndDrop(currentDate, days);

  const getStatusLabel = (status: string) => {
    const column = COLUMNS.find(col => col.id === status);
    return column ? column.title : status;
  };

  const getMonthTickets = () => {
    return tickets.filter((ticket) => {
      if (ticket.status === 'DONE') return false;
      if (selectedProjectId && ticket.projectId !== selectedProjectId) return false;
      if (!ticket.startDate) return false;
      
      const startDate = new Date(ticket.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      const monthStart = days[0];
      const monthEnd = days[days.length - 1];
      monthEnd.setHours(23, 59, 59, 999);
      
      return startDate <= monthEnd && endDate >= monthStart;
    });
  };

  const calculateTicketLevels = () => {
    const ticketsByWeek: { [key: string]: string[] } = {};
    const ticketSpans: { [key: string]: { startWeek: number; endWeek: number } } = {};
    const levels: { [key: string]: number } = {};

    // Calculer les spans pour chaque ticket
    getMonthTickets().forEach(ticket => {
      if (!ticket.startDate) return;

      const startDate = new Date(ticket.startDate);
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
      const monthStart = days[0];

      const startDay = Math.floor((startDate.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000));
      const endDay = Math.floor((endDate.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000));
      
      const startWeek = Math.floor(startDay / 7);
      const endWeek = Math.floor(endDay / 7);

      ticketSpans[ticket.id] = { startWeek, endWeek };

      // Ajouter le ticket à chaque semaine qu'il couvre
      for (let week = startWeek; week <= endWeek; week++) {
        const weekKey = `week-${week}`;
        if (!ticketsByWeek[weekKey]) {
          ticketsByWeek[weekKey] = [];
        }
        ticketsByWeek[weekKey].push(ticket.id);
      }
    });

    // Trier les tickets par date de début
    const sortedTickets = getMonthTickets()
      .filter(t => t.startDate)
      .sort((a, b) => {
        const aStart = new Date(a.startDate!).getTime();
        const bStart = new Date(b.startDate!).getTime();
        return aStart - bStart;
      });

    // Attribuer les niveaux
    sortedTickets.forEach(ticket => {
      const span = ticketSpans[ticket.id];
      if (!span) return;

      // Trouver le premier niveau disponible pour toutes les semaines couvertes par le ticket
      let level = 0;
      let levelFound = false;

      while (!levelFound) {
        levelFound = true;
        for (let week = span.startWeek; week <= span.endWeek; week++) {
          const weekKey = `week-${week}`;
          const ticketsAtLevel = ticketsByWeek[weekKey]
            .filter(id => levels[id] === level);

          if (ticketsAtLevel.length > 0) {
            levelFound = false;
            level++;
            break;
          }
        }
      }

      levels[ticket.id] = level;
    });

    return levels;
  };

  const calculateTicketPosition = (ticket: typeof tickets[0]) => {
    if (!ticket.startDate) return null;
    
    const startDate = new Date(ticket.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    const monthStart = days[0];
    
    const start = Math.max(startDate.getTime(), monthStart.getTime());
    const end = Math.min(endDate.getTime(), days[days.length - 1].getTime());
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const startDay = Math.floor((start - monthStart.getTime()) / msPerDay);
    const endDay = Math.floor((end - monthStart.getTime()) / msPerDay);
    
    const startWeek = Math.floor(startDay / 7);
    const endWeek = Math.floor(endDay / 7);
    const startDayInWeek = startDay % 7;
    const endDayInWeek = endDay % 7;
    
    return {
      startWeek,
      endWeek,
      startDayInWeek,
      endDayInWeek,
      span: endDay - startDay + 1
    };
  };

  const getTicketStyle = (ticket: typeof tickets[0]) => {
    const project = ticket.projectId ? getProject(ticket.projectId) : null;
    
    if (project) {
      return {
        backgroundColor: `${project.color}20`,
        borderLeftColor: project.color
      };
    }
    if (ticket.customColor) {
      return {
        backgroundColor: `${ticket.customColor}20`,
        borderLeftColor: ticket.customColor
      };
    }
    return {};
  };

  const getTicketTitle = (ticket: typeof tickets[0]) => {
    const project = ticket.projectId ? getProject(ticket.projectId) : null;
    return project ? `${project.name} - ${ticket.title}` : ticket.title;
  };

  const levels = calculateTicketLevels();

  return (
    <div className="border border-gray-200 rounded-lg timeline-container">
      <div className="grid grid-cols-7">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
          <div 
            key={day} 
            className={`p-2 text-center text-sm font-medium text-gray-500 border-b border-gray-200 ${
              index < 6 ? 'border-r border-gray-200' : ''
            }`}
          >
            {day}
          </div>
        ))}
        <div className="col-span-7 relative">
          <div className="grid grid-cols-7">
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((date, dayIndex) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isLastWeek = weekIndex === weeks.length - 1;
                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-40 ${
                        !isLastWeek ? 'border-b border-gray-200' : ''
                      } ${
                        dayIndex < 6 ? 'border-r border-gray-200' : ''
                      } ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`p-1 text-sm ${
                          isToday(date)
                            ? 'text-indigo-600 font-bold'
                            : isCurrentMonth
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="absolute inset-0">
            {getMonthTickets().map((ticket) => {
              const position = calculateTicketPosition(ticket);
              if (!position) return null;

              const rows = [];
              for (let week = position.startWeek; week <= position.endWeek; week++) {
                const isFirstWeek = week === position.startWeek;
                const isLastWeek = week === position.endWeek;
                const startCol = isFirstWeek ? position.startDayInWeek : 0;
                const endCol = isLastWeek ? position.endDayInWeek : 6;
                const span = endCol - startCol + 1;

                rows.push(
                  <div
                    key={`${ticket.id}-${week}`}
                    className="absolute h-[32px] pointer-events-auto"
                    style={{
                      top: `${week * 160 + 24 + (levels[ticket.id] * 34)}px`,
                      left: `${(startCol * 100) / 7}%`,
                      width: `${(span * 100) / 7}%`,
                      paddingRight: '4px'
                    }}
                  >
                    <div
                      className={`mx-1 h-full border-l-4 rounded-r-lg cursor-move select-none ${
                        !ticket.customColor && !ticket.projectId ? TIMELINE_COLORS[ticket.priority] : ''
                      } ${isDragging ? 'cursor-grabbing' : ''}`}
                      style={getTicketStyle(ticket)}
                      onMouseDown={(e) => handleDragStart(e, ticket, 'move')}
                    >
                      <div className="px-2 py-1.5">
                        <div className="text-xs font-medium truncate">
                          {getTicketTitle(ticket)}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {getStatusLabel(ticket.status)}
                        </div>
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleDragStart(e, ticket, 'resize')}
                      >
                        <div className="w-1 h-4 bg-gray-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                );
              }
              return rows;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};