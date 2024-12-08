import React, { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { useUserStore } from '../store/userStore';
import { useCategoryStore } from '../store/categoryStore';
import { useStatusStore } from '../store/statusStore';
import type { Ticket } from '../types';
import { X } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

interface TicketFormProps {
  onClose: () => void;
  initialData?: Partial<Ticket>;
}

export const TicketForm: React.FC<TicketFormProps> = ({ onClose, initialData }) => {
  const users = useUserStore((state) => state.users);
  const categories = useCategoryStore((state) => state.categories);
  const statuses = useStatusStore((state) => state.statuses);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    assignee: initialData?.assignee || '',
    startDate: initialData?.startDate 
      ? new Date(initialData.startDate).toLocaleDateString('en-CA')
      : '',
    endDate: initialData?.endDate 
      ? new Date(initialData.endDate).toLocaleDateString('en-CA')
      : '',
    customColor: initialData?.customColor || '',
    categoryId: initialData?.categoryId || undefined,
    status: initialData?.status || 'À faire',
  });

  const addTicket = useTicketStore((state) => state.addTicket);
  const updateTicket = useTicketStore((state) => state.updateTicket);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const createDateWithoutTimezone = (dateString: string) => {
      if (!dateString) return undefined;
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(12, 0, 0, 0);
      return date;
    };

    const ticketData = {
      ...formData,
      startDate: createDateWithoutTimezone(formData.startDate),
      endDate: createDateWithoutTimezone(formData.endDate),
    };

    try {
      if (initialData?.id) {
        updateTicket(initialData.id, ticketData);
        addNotification('Ticket mis à jour avec succès', 'success');
      } else {
        addTicket({
          ...ticketData,
        } as Omit<Ticket, 'id' | 'createdAt'>);
        addNotification('Ticket créé avec succès', 'success');
      }
      onClose();
    } catch (error) {
      addNotification('Erreur lors de la sauvegarde du ticket', 'error');
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData?.id ? 'Modifier le ticket' : 'Nouveau ticket'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as Ticket['priority'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: e.target.value ? Number(e.target.value) : undefined,
                    customColor: e.target.value 
                      ? categories.find(cat => cat.id === Number(e.target.value))?.color || ''
                      : ''
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Aucune catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigné à
              </label>
              <select
                value={formData.assignee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignee: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Non assigné</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur personnalisée
            </label>
            <div className="flex gap-4">
              <input
                type="color"
                value={selectedCategory?.color || formData.customColor}
                onChange={(e) =>
                  setFormData((prev) => ({ 
                    ...prev,
                    customColor: e.target.value,
                    categoryId: undefined // Reset category if custom color is chosen
                  }))
                }
                disabled={!!selectedCategory}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
              />
              {selectedCategory && (
                <div className="text-sm text-gray-500 flex items-center">
                  Utilise la couleur de la catégorie
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {initialData?.id ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};