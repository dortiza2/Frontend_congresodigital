import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
      {children}
    </div>
  );
};

// Skeleton específicos para el dashboard
export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-neutral-300 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-48"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </td>
  </tr>
);

export const SpeakerCardSkeleton: React.FC = () => (
  <div className="border border-neutral-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
    <div className="flex space-x-2">
      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-neutral-300 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      <div className="flex items-end space-x-2 h-32">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t w-8"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-8"></div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton para tarjetas de actividades
export const ActivityCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex space-x-4">
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

// Skeleton para lista de inscripciones
export const EnrollmentListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

// Skeleton para el podio
export const PodiumSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-12 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para formularios
export const FormSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// Skeleton para página completa
export const PageSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ActivityCardSkeleton />
        <ActivityCardSkeleton />
        <ActivityCardSkeleton />
      </div>
      <div className="space-y-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    </div>
  </div>
);