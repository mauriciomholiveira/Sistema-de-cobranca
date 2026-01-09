import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Course, Professor } from '../types';
import { api } from '../services/api';

interface ResourceContextType {
  courses: Course[];
  professors: Professor[];
  loading: boolean;
  fetchResources: () => Promise<void>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, professorsData] = await Promise.all([
        api.get<Course[]>('/cursos'),
        api.get<Professor[]>('/professores'),
      ]);
      setCourses(coursesData);
      setProfessors(professorsData);
    } catch (err) {
      console.error('Erro ao carregar recursos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ResourceContext.Provider value={{ courses, professors, loading, fetchResources }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResources must be used within ResourceProvider');
  }
  return context;
};
