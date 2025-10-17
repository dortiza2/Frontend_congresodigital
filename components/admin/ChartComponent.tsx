import React from 'react';
import dynamic from 'next/dynamic';

// Importar ApexCharts dinámicamente para evitar problemas de SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartComponentProps {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  title: string;
  data: any;
  options?: any;
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  type, 
  title, 
  data, 
  options = {}, 
  height = 350 
}) => {
  const defaultOptions = {
    chart: {
      type: type,
      height: height,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    theme: {
      mode: 'light'
    },
    title: {
      text: title,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#374151'
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4
    },
    xaxis: {
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        }
      },
      axisBorder: {
        color: '#E5E7EB'
      },
      axisTicks: {
        color: '#E5E7EB'
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6B7280',
          fontSize: '12px'
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#6B7280'
      }
    },
    tooltip: {
      theme: 'light'
    },
    ...options
  };

  return (
    <div className="bg-neutral-100 rounded-lg border border-neutral-300 p-6">
      <Chart
        options={defaultOptions}
        series={data}
        type={type}
        height={height}
      />
    </div>
  );
};

export default ChartComponent;

// Componentes específicos para diferentes tipos de gráficos
export const AttendanceChart: React.FC = () => {
  const annualRegistrationsData = [
    {
      name: 'Inscripciones',
      data: [1247, 1456, 1623, 1789, 1934, 2156]
    }
  ];

  const options = {
    xaxis: {
      categories: ['2019', '2020', '2021', '2022', '2023', '2024']
    },
    yaxis: {
      title: {
        text: 'Número de Inscripciones',
        style: {
          color: '#6B7280'
        }
      },
      min: 0
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false
      }
    }
  };

  return (
    <ChartComponent
      type="bar"
      title="Inscripciones Anuales por Edición"
      data={annualRegistrationsData}
      options={options}
    />
  );
};

export const WorkshopCategoriesChart: React.FC = () => {
  const categoriesData = [
    {
      name: 'Talleres por Categoría',
      data: [12, 8, 15, 6, 10, 4, 7, 3, 5, 9]
    }
  ];

  const options = {
    xaxis: {
      categories: ['Frontend', 'Backend', 'Full Stack', 'Data Science', 'DevOps', 'Mobile', 'UX/UI', 'Blockchain', 'Cybersecurity', 'Cloud']
    },
    yaxis: {
      title: {
        text: 'Número de Talleres',
        style: {
          color: '#6B7280'
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false
      }
    }
  };

  return (
    <ChartComponent
      type="bar"
      title="Distribución de Talleres por Categoría"
      data={categoriesData}
      options={options}
    />
  );
};

export const ParticipantStatusChart: React.FC = () => {
  const statusData = [245, 89, 156, 78];
  const labels = ['Activos', 'Pendientes', 'Completados', 'Inactivos'];

  const options = {
    labels: labels,
    legend: {
      position: 'bottom' as const
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return Math.round(val) + '%';
      }
    }
  };

  return (
    <ChartComponent
      type="donut"
      title="Estado de Participantes"
      data={statusData}
      options={options}
      height={400}
    />
  );
};

export const RegistrationTrendChart: React.FC = () => {
  const registrationData = [
    {
      name: 'Inscripciones',
      data: [23, 45, 67, 89, 123, 156, 189, 234, 267, 298, 334, 378]
    },
    {
      name: 'Confirmaciones',
      data: [18, 38, 58, 76, 105, 134, 162, 201, 229, 256, 287, 325]
    }
  ];

  const options = {
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    yaxis: {
      title: {
        text: 'Número de Participantes',
        style: {
          color: '#6B7280'
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    }
  };

  return (
    <ChartComponent
      type="area"
      title="Tendencia de Inscripciones vs Confirmaciones"
      data={registrationData}
      options={options}
    />
  );
};