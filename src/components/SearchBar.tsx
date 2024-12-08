import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useTicketStore } from '../store/ticketStore';
import { TicketDetailsPopup } from './TicketDetailsPopup';
import type { Ticket } from '../types';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const tickets = useTicketStore((state) => state.tickets);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(query.toLowerCase()) ||
      ticket.description.toLowerCase().includes(query.toLowerCase()) ||
      ticket.assignee?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Rechercher un ticket..."
        value={query}
        onChange={handleSearch}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
      {query && (
        <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto z-10">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="font-medium">{ticket.title}</div>
                <div className="text-sm text-gray-500">{ticket.status}</div>
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-500">Aucun résultat trouvé</div>
          )}
        </div>
      )}

      {selectedTicket && (
        <TicketDetailsPopup
          ticket={selectedTicket}
          onClose={() => {
            setSelectedTicket(null);
            setQuery('');
          }}
        />
      )}
    </div>
  );
};