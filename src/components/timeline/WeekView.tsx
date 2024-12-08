import React from 'react';
import { useTicketStore } from '../../store/ticketStore';
import { useProjectStore } from '../../store/projectStore';
import { TIMELINE_COLORS, COLUMNS } from '../../constants/kanban';
import { useTimelineDragAndDrop } from '../../hooks/useTimelineDragAndDrop';
import { formatDate, isToday, getWeekDays } from '../../utils/dateUtils';

interface WeekViewProps {
  currentDate: Date;
  selectedProjectId: string | null;
}

export const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate,
  selectedProjectId 
}) => {
  const tickets = useTicketStore((state) => state.tickets);
  const getProject = useProjectStore((state) => state.getProject);
  const days = getWeekDays(currentDate);
  const { handleDragStart, isDragging } = useTimelineDragAndDrop(currentDate, days);

  const getStatusLabel = (status: string) => {
    const column = COLUMNS.find(col => col.id === status);
    return column ? column.title : status;
  };

  const getWeekTickets = () => {
    return tickets.filter((ticket) => {
      if (ticket.status === 'DONE') return false;
      if (selectedProjectId && ticket.projectId !== selectedProjectId) return false;
      if (!ticket.startDate) return false;
      
      const startDate = new Date(ticket.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      
      const weekStart = new Date(currentDate);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(days[6]);
      weekEnd.setHours(23, 59, 59, 999);
      
      return startDate <= weekEnd && endDate >= weekStart;
    });
  };

  const calculateTicketLevels = () => {
    const ticketsByDay: { [key: string]: string[] } = {};
    const ticketSpans: { [key: string]: { start: number; end: number } } = {};
    const levels: { [key: string]: number } = {};
    const maxLevelByDay: { [key: string]: number } = {};

    // Calculer les spans pour chaque ticket
    getWeekTickets().forEach(ticket => {
      if (!ticket.startDate) return;

      const startDate = new Date(ticket.startDate);
      const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
      const weekStart = new Date(currentDate);

      const start = Math.max(
        0,
        Math.floor((startDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
      );
      const end = Math.min(
        6,
        Math.floor((endDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
      );

      ticketSpans[ticket.id] = { start, end };

      // Ajouter le ticket à chaque jour qu'il couvre
      for (let day = start; day <= end; day++) {
        const dayKey = `day-${day}`;
        if (!ticketsByDay[dayKey]) {
          ticketsByDay[dayKey] = [];
        }
        ticketsByDay[dayKey].push(ticket.id);
      }
    });

    // Trier les tickets par date de début
    const sortedTickets = getWeekTickets()
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

      // Trouver le premier niveau disponible pour tous les jours couverts par le ticket
      let level = 0;
      let levelFound = false;

      while (!levelFound) {
        levelFound = true;
        for (let day = span.start; day <= span.end; day++) {
          const dayKey = `day-${day}`;
          const ticketsAtLevel = ticketsByDay[dayKey]
            .filter(id => levels[id] === level);

          if (ticketsAtLevel.length > 0) {
            levelFound = false;
            level++;
            break;
          }
        }
      }

      levels[ticket.id] = level;

      // Mettre à jour le niveau maximum pour chaque jour
      for (let day = span.start; day <= span.end; day++) {
        const dayKey = `day-${day}`;
        maxLevelByDay[dayKey] = Math.max(maxLevelByDay[dayKey] || 0, level);
      }
    });

    return { levels, maxLevelByDay };
  };

  const calculateTicketPosition = (ticket: typeof tickets[0]) => {
    if (!ticket.startDate) return null;
    
    const startDate = new Date(ticket.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = ticket.endDate ? new Date(ticket.endDate) : new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(currentDate);
    weekStart.setHours(0, 0, 0, 0);
    
    const start = Math.max(startDate.getTime(), weekStart.getTime());
    const end = Math.min(endDate.getTime(), new Date(days[6]).getTime());
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const startDay = Math.floor((start - weekStart.getTime()) / msPerDay);
    const endDay = Math.floor((end - weekStart.getTime()) / msPerDay);
    
    return {
      startColumn: startDay,
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

  const { levels } = calculateTicketLevels();

  return (
    <div className="relative timeline-container border border-gray-200 rounded-lg">
      <div className="grid grid-cols-7">
        {days.map((date, index) => (
          <div
            key={date.toISOString()}
            className={`p-2 border-b border-gray-200 ${
              index < 6 ? 'border-r border-gray-200' : ''
            }`}
          >
            <div
              className={`text-sm mb-2 ${
                isToday(date)
                  ? 'text-indigo-600 font-bold'
                  : 'text-gray-600'
              }`}
            >
              {formatDate(date)}
            </div>
          </div>
        ))}
      </div>
      <div className="relative min-h-[400px] border-t border-gray-200">
        <div className="grid grid-cols-7 absolute inset-0">
          {days.map((_, index) => (
            <div
              key={index}
              className={`h-full ${index < 6 ? 'border-r border-gray-200' : ''}`}
            />
          ))}
        </div>
        <div className="relative z-10 p-2">
          {getWeekTickets().map((ticket) => {
            const position = calculateTicketPosition(ticket);
            if (!position) return null;
            
            return (
              <div
                key={ticket.id}
                className="absolute h-16"
                style={{
                  left: `${(position.startColumn * 100) / 7}%`,
                  width: `${(position.span * 100) / 7}%`,
                  top: `${levels[ticket.id] * 72}px`
                }}
              >
                <div
                  className={`group h-full border-l-4 rounded-r-lg mx-2 cursor-move select-none ${
                    !ticket.customColor && !ticket.projectId ? TIMELINE_COLORS[ticket.priority] : ''
                  } ${isDragging ? 'cursor-grabbing' : ''}`}
                  style={getTicketStyle(ticket)}
                  onMouseDown={(e) => handleDragStart(e, ticket, 'move')}
                >
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">{getTicketTitle(ticket)}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {getStatusLabel(ticket.status)}
                    </div>
                    {ticket.assignee && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {ticket.assignee}
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleDragStart(e, ticket, 'resize')}
                  >
                    <div className="w-1 h-4 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};