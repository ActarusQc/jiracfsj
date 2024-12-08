import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useTicketStore } from '../store/ticketStore';
import { useNotificationStore } from '../store/notificationStore';
import { X } from 'lucide-react';
import { ProjectDetailsForm } from './project/ProjectDetailsForm';
import { ProjectTaskList } from './project/ProjectTaskList';

interface ProjectFormProps {
  onClose: () => void;
  projectId?: string;
  isEditing?: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ 
  onClose, 
  projectId,
  isEditing 
}) => {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#6366F1',
  });

  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskFormData[]>([]);

  const { projects, addProject, updateProject } = useProjectStore();
  const { tickets, addTicket, updateTicket, deleteTicket } = useTicketStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setProjectData({
          name: project.name,
          description: project.description,
          startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
          color: project.color,
        });

        const projectTasks = tickets
          .filter(t => t.projectId === projectId)
          .map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
            endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
          }));
        setTasks(projectTasks);
        setOriginalTasks(projectTasks);
      }
    }
  }, [projectId, projects, tickets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (projectId && isEditing) {
        updateProject(projectId, {
          ...projectData,
          startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
          endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
        });

        const deletedTasks = originalTasks.filter(original => 
          !tasks.find(current => current.id === original.id)
        );
        deletedTasks.forEach(task => {
          if (task.id) {
            deleteTicket(task.id);
          }
        });

        tasks.forEach(task => {
          if (task.id) {
            updateTicket(task.id, {
              title: task.title,
              description: task.description,
              startDate: task.startDate ? new Date(task.startDate) : undefined,
              endDate: task.endDate ? new Date(task.endDate) : undefined,
            });
          } else {
            addTicket({
              ...task,
              status: 'TODO',
              priority: 'MEDIUM',
              projectId,
              startDate: task.startDate ? new Date(task.startDate) : undefined,
              endDate: task.endDate ? new Date(task.endDate) : undefined,
            });
          }
        });

        addNotification('Projet et tâches mis à jour avec succès', 'success');
      } else {
        const newProjectId = addProject({
          ...projectData,
          startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
          endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,
        });

        tasks.forEach((taskData) => {
          addTicket({
            ...taskData,
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: newProjectId,
            startDate: taskData.startDate ? new Date(taskData.startDate) : undefined,
            endDate: taskData.endDate ? new Date(taskData.endDate) : undefined,
          });
        });
        addNotification('Projet et tâches créés avec succès', 'success');
      }
      onClose();
    } catch (error) {
      addNotification('Erreur lors de la sauvegarde du projet', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {projectId 
              ? (isEditing ? 'Modifier le projet' : 'Voir le projet') 
              : 'Nouveau projet'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <ProjectDetailsForm
            data={projectData}
            onChange={setProjectData}
            readOnly={projectId && !isEditing}
          />

          {(!projectId || isEditing) ? (
            <ProjectTaskList
              tasks={tasks}
              onAddTask={(task) => setTasks([...tasks, task])}
              onRemoveTask={(index) => setTasks(tasks.filter((_, i) => i !== index))}
              projectName={projectData.name}
              projectColor={projectData.color}
              projectStartDate={projectData.startDate}
              projectEndDate={projectData.endDate}
              readOnly={projectId && !isEditing}
            />
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">Tâches du projet</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-md"
                    style={{ borderLeft: `4px solid ${projectData.color}` }}
                  >
                    <div className="font-medium">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-500">{task.description}</div>
                    {(task.startDate || task.endDate) && (
                      <div className="text-sm text-gray-500 mt-1">
                        {task.startDate && new Date(task.startDate).toLocaleDateString()}
                        {task.startDate && task.endDate && ' - '}
                        {task.endDate && new Date(task.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    Aucune tâche pour ce projet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {projectId && !isEditing ? 'Fermer' : 'Annuler'}
          </button>
          {(!projectId || isEditing) && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={!projectData.name || (!projectId && tasks.length === 0)}
            >
              {projectId ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};