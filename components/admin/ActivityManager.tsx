import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Edit2, Trash2, Calendar, Users, MapPin, Power, PowerOff } from 'lucide-react';
import { useActivities, createActivity, updateActivity, deleteActivity, toggleActivityStatus } from '@/hooks/useActivities';
import { useActivityStats } from '@/hooks/useActivities';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export const ActivityManager = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    isActive: undefined as boolean | undefined,
    startDate: '',
    endDate: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<any>(null);

  const { activities, total, totalPages, isLoading, error, mutate } = useActivities(
    page,
    pageSize,
    filters
  );

  const { stats } = useActivityStats();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'CONFERENCE',
    startTime: '',
    endTime: '',
    location: '',
    capacity: 0,
    speakerId: ''
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleCreate = () => {
    setEditingActivity(null);
    setFormData({
      title: '',
      description: '',
      type: 'CONFERENCE',
      startTime: '',
      endTime: '',
      location: '',
      capacity: 0,
      speakerId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      startTime: activity.startTime.slice(0, 16), // Format for datetime-local input
      endTime: activity.endTime.slice(0, 16),
      location: activity.location,
      capacity: activity.capacity,
      speakerId: activity.speakerId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (activity: any) => {
    setDeletingActivity(activity);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, formData);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await createActivity(formData);
        toast.success('Actividad creada exitosamente');
      }
      
      setIsModalOpen(false);
      mutate();
    } catch (error) {
      // Error handling is done in the service
    }
  };

  const confirmDelete = async () => {
    if (!deletingActivity) return;

    try {
      await deleteActivity(deletingActivity.id);
      setIsDeleteModalOpen(false);
      setDeletingActivity(null);
      mutate();
    } catch (error) {
      // Error handling is done in the service
    }
  };

  const handleToggleStatus = async (activityId: string) => {
    try {
      await toggleActivityStatus(activityId);
      mutate();
    } catch (error) {
      // Error handling is done in the service
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CONFERENCE': return 'bg-blue-100 text-blue-800';
      case 'WORKSHOP': return 'bg-green-100 text-green-800';
      case 'PANEL': return 'bg-purple-100 text-purple-800';
      case 'NETWORKING': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalActivities || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeActivities || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.upcomingActivities || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalCapacity || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1">
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              <SelectItem value="CONFERENCE">Conferencia</SelectItem>
              <SelectItem value="WORKSHOP">Taller</SelectItem>
              <SelectItem value="PANEL">Panel</SelectItem>
              <SelectItem value="NETWORKING">Networking</SelectItem>
              <SelectItem value="OTHER">Otro</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.isActive === undefined ? '' : filters.isActive.toString()} 
            onValueChange={(value) => handleFilterChange('isActive', value === '' ? undefined : value === 'true')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              <SelectItem value="true">Activas</SelectItem>
              <SelectItem value="false">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Activities Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actividad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-red-500">
                  Error al cargar actividades
                </TableCell>
              </TableRow>
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No se encontraron actividades
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-gray-500">{activity.description}</div>
                      {activity.speakerName && (
                        <div className="text-sm text-blue-600">Ponente: {activity.speakerName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDateTime(activity.startTime)}</div>
                      <div className="text-gray-500">a {formatDateTime(activity.endTime)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {activity.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      {activity.capacity}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={activity.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {activity.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(activity.id)}
                      >
                        {activity.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(activity)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} de {total} actividades
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
            </DialogTitle>
            <DialogDescription>
              {editingActivity ? 'Actualiza la información de la actividad' : 'Crea una nueva actividad para el congreso'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFERENCE">Conferencia</SelectItem>
                    <SelectItem value="WORKSHOP">Taller</SelectItem>
                    <SelectItem value="PANEL">Panel</SelectItem>
                    <SelectItem value="NETWORKING">Networking</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Fecha y Hora de Inicio *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">Fecha y Hora de Fin *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speakerId">ID del Ponente (opcional)</Label>
              <Input
                id="speakerId"
                value={formData.speakerId}
                onChange={(e) => setFormData(prev => ({ ...prev, speakerId: e.target.value }))}
                placeholder="ID del ponente si aplica"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingActivity ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar la actividad "{deletingActivity?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};