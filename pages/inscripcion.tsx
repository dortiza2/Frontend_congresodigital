import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ActivitiesService } from '@/lib/activitiesService';
import { fetchPublicActivities, type PublicActivity } from '@/services/activities';
import { createEnrollment, type UserEnrollment, validateTimeConflictWithUserEnrollments, EnrollmentService } from '@/services/enrollments';
import { authService, login, register } from '@/services/auth';
import { getRedirectPath, handleLoginSuccess } from '@/lib/authClient';
import Logo from '@/components/Logo';
import type { ActivityUI, EnrollmentUI } from '@/types/ui';
import { Eye, EyeOff, Calendar, Clock, MapPin, Users, CheckCircle, QrCode, Mail, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import { getUserFriendlyErrorMessage } from '@/lib/errorHandler';
import { ApiError, api } from '@/lib/api';
import { formatGT, formatGTTime } from '@/lib/datetime';
import { APP_CONFIG } from '@/lib/appConfig';

// Toggle de Google: deshabilita el botón si NEXT_PUBLIC_ENABLE_GOOGLE es 'false'
const enableGoogle = (process.env.NEXT_PUBLIC_ENABLE_GOOGLE ?? 'true') !== 'false';

// Tipos para el formulario de login
interface LoginForm {
  email: string;
  password: string;
}

// Tipos para el formulario de registro
interface RegisterForm {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  institution: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface RegisterErrors {
  email?: string;
  fullName?: string;
  password?: string;
  confirmPassword?: string;
  institution?: string;
  general?: string;
}

interface GoogleLoginErrors {
  general?: string;
}

// Estados de la página
type PageState = 'login' | 'activities' | 'summary' | 'confirmation';

export default function InscripcionPage() {
  const router = useRouter();
  const { user, loading, loginEmail, loginGoogle, logout } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  // Prefetch de la landing para acelerar regreso
  useEffect(() => {
    router.prefetch('/');
  }, [router]);
  
  // Estados principales
  const [pageState, setPageState] = useState<PageState>('login');
  const [activities, setActivities] = useState<PublicActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingError, setLoadingError] = useState<string>('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentErrors, setEnrollmentErrors] = useState<string[]>([]);
  
  // Estados para validación de actividades
  const [activityErrors, setActivityErrors] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  // Estados para pestañas
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Estados del formulario de login
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  
  // Estados del formulario de registro
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ 
    email: '', 
    fullName: '', 
    password: '', 
    confirmPassword: '', 
    institution: '' 
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  // Estados del formulario de Google
  const [googleErrors, setGoogleErrors] = useState<GoogleLoginErrors>({});
  const [loggingInGoogle, setLoggingInGoogle] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Dominios permitidos para Google (desde configuración central)
  const allowedDomains = (APP_CONFIG.VALIDATION.ALLOWED_DOMAINS.length > 0
    ? APP_CONFIG.VALIDATION.ALLOWED_DOMAINS
    : ['umg.edu.gt','miumg.edu.gt']
  ).map(d => d.trim());
  const allowedDomainsText = allowedDomains.map(d => `@${d}`).join(', ');
  
  // Filtros
  const [filterKind, setFilterKind] = useState<'all' | 'taller' | 'competencia' | 'conferencia'>('all');
  
  // Estados para QR modal y envío de inscripción
  const [showQRModal, setShowQRModal] = useState<{ show: boolean; enrollment?: UserEnrollment }>({ show: false });
  const [enrollmentSubmitted, setEnrollmentSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Estados para validación de conflictos
  const [validatingConflicts, setValidatingConflicts] = useState(false);
  const [conflictValidationResult, setConflictValidationResult] = useState<{
    hasConflicts: boolean;
    conflicts: string[];
    message: string;
  } | null>(null);
  
  // Estados para validación de conflictos de tiempo con inscripciones existentes
  const [validatingTimeConflicts, setValidatingTimeConflicts] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  // Estados para validación de capacidad
  const [capacityStatus, setCapacityStatus] = useState<{
    [activityId: string]: {
      status: string;
      isFull: boolean;
      currentEnrollments: number;
      maxCapacity?: number;
      availableSpots?: number;
    }
  }>({});

  // Detectar errores de NextAuth y sesión en la URL
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      if (error === 'AccessDenied') {
        setGoogleErrors({ general: 'Solo se permiten correos de dominios institucionales autorizados.' });
      } else if (error === 'Configuration') {
        setGoogleErrors({ general: 'Error de configuración OAuth. Verifica las credenciales.' });
      } else if (error === 'session_expired') {
        setLoginErrors({ general: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' });
      } else {
        setGoogleErrors({ general: 'Error de autenticación. Intenta de nuevo.' });
      }
      // Limpiar el error de la URL
      router.replace('/inscripcion', undefined, { shallow: true });
    }
  }, [router.query.error]);

  // Cargar actividades cuando el usuario esté autenticado
  useEffect(() => {
    if (user && pageState === 'login') {
      setPageState('activities');
    }
  }, [user, pageState]);

  useEffect(() => {
    if (pageState === 'activities' && activities.length === 0) {
      loadActivities();
    }
  }, [pageState, activities.length]);

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);
      setLoadingError('');
      const data = await fetchPublicActivities();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoadingError('Error al cargar las actividades. Por favor, intenta de nuevo.');
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Manejar cambios en el formulario de login
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores
    if (loginErrors[name as keyof LoginErrors]) {
      setLoginErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Removed handleGoogleChange as we no longer need email input

  // Validar formulario de login
  const validateLogin = (): boolean => {
    const errors: LoginErrors = {};
    
    if (!loginForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      errors.email = 'Formato de email inválido';
    }
    
    if (!loginForm.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (loginForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar login con email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) return;
    
    try {
      setLoggingIn(true);
      setLoginErrors({});
      setSuccessMessage('');
      
      const result = await login(loginForm.email, loginForm.password);
      
      if (result.token) {
        // Mostrar mensaje de éxito
        setSuccessMessage('Sesión iniciada correctamente');
        
        // Actualizar AuthContext con los datos del usuario
        await loginEmail(loginForm.email, loginForm.password);
        
        // Usar la nueva función handleLoginSuccess para routing inteligente
        const nextUrl = router.query.next as string;
        
        console.log('[Login] Using handleLoginSuccess for routing');
        
        // Redirección inmediata para evitar parpadeo
        setSuccessMessage('');
        await handleLoginSuccess(router, nextUrl);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        setLoginErrors({ general: 'Correo o contraseña incorrectos' });
      } else {
        setLoginErrors({ general: 'Error de autenticación' });
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Manejar login con Google usando NextAuth
  const handleGoogleLogin = async () => {
    try {
      // Si Google está deshabilitado, no ejecutar
      if (!enableGoogle) {
        setGoogleErrors({ general: 'Inicio con Google no disponible.' });
        return;
      }
      setLoggingInGoogle(true);
      setGoogleErrors({});
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/inscripcion'
      });
      
      if (result?.error) {
        if (result.error === 'AccessDenied') {
          setGoogleErrors({ general: `Acceso denegado. Solo se permiten correos institucionales (${allowedDomainsText}).` });
        } else if (result.error === 'Signin') {
          setGoogleErrors({ general: 'Autenticación cancelada.' });
        } else {
          setGoogleErrors({ general: 'No pudimos iniciar sesión. Intenta de nuevo.' });
        }
      } else if (result && (result as { ok?: boolean }).ok) {
        // Login exitoso con Google
        setGoogleErrors({ general: 'Sesión iniciada correctamente' });
        
        // Actualizar AuthContext (Google login se maneja automáticamente)
        // El AuthContext detectará la sesión de NextAuth
        
        // Determinar redirección usando getRedirectPath con parámetro next
        const nextUrl = router.query.next as string;
        const finalRedirect = getRedirectPath(nextUrl);
        
        console.log('[Google Login] Redirecting to:', finalRedirect);
        
        // Redirección inmediata para evitar parpadeo
        router.replace(finalRedirect);
      }
    } catch (error) {
      setGoogleErrors({ general: 'No pudimos iniciar sesión. Intenta de nuevo.' });
    } finally {
      setLoggingInGoogle(false);
    }
  };

  // Manejar cambios en el formulario de registro
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores
    if (registerErrors[name as keyof RegisterErrors]) {
      setRegisterErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validar formulario de registro
  const validateRegister = (): boolean => {
    const errors: RegisterErrors = {};
    
    if (!registerForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = 'Formato de email inválido';
    }
    
    if (!registerForm.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    } else if (registerForm.fullName.trim().length < 2) {
      errors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!registerForm.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (registerForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password)) {
      errors.password = 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }
    
    if (!registerForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) return;
    
    try {
      setRegistering(true);
      setRegisterErrors({});
      setSuccessMessage('');
      
      const result = await register({
        email: registerForm.email,
        fullName: registerForm.fullName,
        password: registerForm.password,
        institution: registerForm.institution || undefined
      });
      
      if (result.token) {
        // Mostrar mensaje de éxito
        setSuccessMessage('Registro exitoso. Redirigiendo...');
        
        // Actualizar AuthContext con los datos del usuario
        await loginEmail(registerForm.email, registerForm.password);
        
        // Usar la nueva función handleLoginSuccess para routing inteligente
        const nextUrl = router.query.next as string;
        
        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(async () => {
          setSuccessMessage('');
          await handleLoginSuccess(router, nextUrl);
        }, 1000);
      }
    } catch (error) {
      if (error instanceof Error) {
        setRegisterErrors({ general: error.message });
      } else {
        setRegisterErrors({ general: 'Error en el registro' });
      }
    } finally {
      setRegistering(false);
    }
  };

  // Manejar selección de actividades
  const toggleActivity = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    // Limpiar mensajes previos
    setValidationMessage('');
    setActivityErrors(prev => ({ ...prev, [activityId]: '' }));
    
    if (selectedActivities.includes(activityId)) {
      // Deseleccionar actividad
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
      return;
    }
    
    // Verificar estado de capacidad primero
    const capacityCheck = await checkCapacityStatus([activityId]);
    const activityCapacity = capacityCheck.activities.find((a: any) => a.activityId === activityId);
    
    if (activityCapacity?.isFull) {
      setActivityErrors(prev => ({ ...prev, [activityId]: 'No hay cupos disponibles en esta actividad.' }));
      return;
    }
    
    // Verificar conflictos de horario con el backend usando validación mejorada
    const newSelection = [...selectedActivities, activityId];
    
    const validation = await validateTimeConflictsEnhanced(newSelection);
    
    if (validation.hasConflicts) {
      const conflictMessage = validation.conflicts.length > 0 
        ? `Conflicto de horario: ${validation.conflicts.join(', ')}`
        : 'Esta actividad coincide en horario con otra seleccionada.';
      setActivityErrors(prev => ({ ...prev, [activityId]: conflictMessage }));
      return;
    }
    
    // Si no hay conflictos ni problemas de capacidad, agregar la actividad
    setSelectedActivities(newSelection);
    
    // Actualizar estado de capacidad para todas las actividades seleccionadas
    await checkCapacityStatus(newSelection);
  };

  // Proceder al resumen
  const proceedToSummary = async () => {
    if (selectedActivities.length === 0) {
      alert('Debes seleccionar al menos una actividad');
      return;
    }
    
    try {
      // Validar conflictos de horario con validación mejorada
      const validation = await validateTimeConflictsEnhanced(selectedActivities);
      if (validation.hasConflicts) {
        const conflictMessage = validation.conflicts.length > 0 
          ? `Conflictos de horario detectados:\n${validation.conflicts.join('\n')}`
          : 'Se detectaron conflictos de horario entre las actividades seleccionadas.';
        alert(conflictMessage);
        return;
      }
      
      // Verificar capacidad de todas las actividades seleccionadas
      const capacityCheck = await checkCapacityStatus(selectedActivities);
      const fullActivities = capacityCheck.activities.filter((a: any) => a.isFull);
      
      if (fullActivities.length > 0) {
        const fullActivityNames = fullActivities.map((a: any) => {
          const activity = activities.find(act => act.id === a.activityId);
          return activity?.title || 'Actividad desconocida';
        });
        alert(`Las siguientes actividades ya no tienen cupos disponibles:\n${fullActivityNames.join('\n')}\n\nPor favor, deselecciona estas actividades antes de continuar.`);
        return;
      }
      
      setPageState('summary');
    } catch (error) {
      console.error('Error validating time conflicts or capacity:', error);
      alert('Error al validar conflictos de horario o capacidad. Por favor, inténtalo de nuevo.');
    }
  };

  // Validar conflictos de horario con validación mejorada
  const validateTimeConflictsEnhanced = async (activityIds: string[]) => {
    if (!activityIds || activityIds.length === 0) {
      return { hasConflicts: false, conflicts: [], message: 'No hay actividades para validar' };
    }

    try {
      setValidatingConflicts(true);
      const resp = await EnrollmentService.validateTimeConflicts({ activityIds });

      if (!resp.success) {
        const msg = resp.error?.message || 'Validación de conflictos no disponible temporalmente';
        const fallback = { hasConflicts: false, conflicts: [], message: msg };
        setConflictValidationResult(fallback);
        return fallback;
      }

      const data = resp.data || { hasConflicts: false, conflicts: [], message: undefined };
      const result = {
        hasConflicts: !!data.hasConflicts,
        conflicts: Array.isArray(data.conflicts) ? data.conflicts : [],
        message: data.message || (data.hasConflicts ? 'Se encontraron conflictos de horario' : 'No hay conflictos de horario')
      };
      
      setConflictValidationResult(result);
      return result;
    } catch (error) {
      console.warn('Error validating time conflicts:', error);
      const errorResult = { 
        hasConflicts: false, 
        conflicts: [], 
        message: 'Validación de conflictos no disponible temporalmente' 
      };
      setConflictValidationResult(errorResult);
      return errorResult;
    } finally {
      setValidatingConflicts(false);
    }
  };

  // Verificar estado de capacidad de actividades
  const checkCapacityStatus = async (activityIds: string[]) => {
    if (!activityIds || activityIds.length === 0) {
      return { activities: [] };
    }

    try {
      const result = await api.post('enrollments/check-capacity', { activityIds: activityIds.map(id => id) });
      
      // Actualizar estado de capacidad
      const newCapacityStatus: typeof capacityStatus = {};
      result.activities.forEach((activity: any) => {
        newCapacityStatus[activity.activityId] = {
          status: activity.status,
          isFull: activity.isFull,
          currentEnrollments: activity.currentEnrollments,
          maxCapacity: activity.maxCapacity,
          availableSpots: activity.availableSpots,
        };
      });
      setCapacityStatus(newCapacityStatus);
      
      return result;
    } catch (error) {
      console.warn('Error checking capacity:', error);
      return { activities: [] };
    }
  };

  // Función para inscribir a múltiples actividades
  const enrollMany = async (activityIds: string[]) => {
    const enrollments: UserEnrollment[] = [];
    const errors: string[] = [];
    
    for (const activityId of activityIds) {
      try {
        const enrollment = await createEnrollment([activityId]);
        enrollments.push(enrollment);
      } catch (error: any) {
        console.error(`Error enrolling in activity ${activityId}:`, error);
        const activity = activities.find(a => a.id === activityId);
        
        // Usar el nuevo sistema de manejo de errores
        let errorMessage = 'Error desconocido';
        if (error instanceof ApiError) {
          errorMessage = getUserFriendlyErrorMessage(error);
        } else if (error?.details?.message) {
          errorMessage = error.details.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        errors.push(`${activity?.title || 'Actividad'}: ${errorMessage}`);
        
        // Mostrar toast específico para errores críticos
        if (error instanceof ApiError) {
          if (error.status === 409) {
            showWarning(errorMessage, `Conflicto en ${activity?.title || 'actividad'}`);
          } else if (error.status === 404) {
            showError(errorMessage, `${activity?.title || 'Actividad'} no disponible`);
          } else {
            showError(errorMessage, `Error en ${activity?.title || 'actividad'}`);
          }
        }
      }
    }
    
    return {
      success: enrollments.length > 0,
      enrollments,
      errors,
      message: enrollments.length > 0 
        ? `Inscripción exitosa en ${enrollments.length} actividad${enrollments.length > 1 ? 'es' : ''}${errors.length > 0 ? ` (${errors.length} error${errors.length > 1 ? 'es' : ''})` : ''}`
        : 'No se pudo completar ninguna inscripción'
    };
  };
  
  // Manejar envío de inscripción
  const handleEnrollmentSubmission = async () => {
    if (!user || selectedActivities.length === 0) return;
    
    try {
      setEnrolling(true);
      setEnrollmentErrors([]);
      
      // 1. Llamar enrollMany
      const enrollResponse = await enrollMany(selectedActivities);
      
      if (enrollResponse.success) {
        setEnrollments(enrollResponse.enrollments);
        
        // 2. Mostrar errores si los hay
        if (enrollResponse.errors && enrollResponse.errors.length > 0) {
          setEnrollmentErrors(enrollResponse.errors);
        }
        
        // 3. Refetch actividades para actualizar contadores
        await loadActivities();
        
        // 4. Mostrar confirmación
        setEnrollmentSubmitted(true);
        setShowConfirmation(true);
        
        // Mostrar toast de éxito
        if (enrollResponse.enrollments.length > 0) {
          const successCount = enrollResponse.enrollments.length;
          const errorCount = enrollResponse.errors?.length || 0;
          
          if (errorCount === 0) {
            showSuccess(
              `Te has inscrito exitosamente en ${successCount} actividad${successCount > 1 ? 'es' : ''}`,
              'Inscripción completada'
            );
          } else {
            showWarning(
              `Inscripción parcial: ${successCount} exitosa${successCount > 1 ? 's' : ''}, ${errorCount} con error${errorCount > 1 ? 'es' : ''}`,
              'Inscripción completada con advertencias'
            );
          }
        }
        
        // Auto-ocultar confirmación después de 8 segundos
        setTimeout(() => setShowConfirmation(false), 8000);
      } else {
        setEnrollmentErrors([enrollResponse.message || 'Error en la inscripción']);
      }
    } catch (error: any) {
      console.error('Error al procesar inscripción:', error);
      
      // Usar el nuevo sistema de manejo de errores
      let errorMessage = 'Error al procesar la inscripción';
      if (error instanceof ApiError) {
        errorMessage = getUserFriendlyErrorMessage(error);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setEnrollmentErrors([errorMessage]);
      showError(errorMessage, 'Error en la inscripción');
    } finally {
      setEnrolling(false);
    }
  };

  // Confirmar inscripción con validación de conflictos de tiempo
  const confirmEnrollment = async () => {
    if (!user || selectedActivities.length === 0) return;
    
    setEnrolling(true);
    const ids = selectedActivities;

    const chk = await validateTimeConflictWithUserEnrollments(ids);
    if (chk && chk.success === false && chk.reason === "conflict") {
      showError("Ya cuenta con una actividad o charla con el mismo horario.");
      setEnrolling(false); 
      return;
    }
    
    try {
      await createEnrollment(ids);
      showSuccess("¡Inscripción confirmada!");
      router.replace("/mi-cuenta");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) { 
        showError("Tu sesión expiró. Inicia sesión nuevamente."); 
        router.replace("/inscripcion"); 
      } else { 
        showError(err.message || "No se pudo completar la inscripción."); 
      }
    } finally { 
      setEnrolling(false); 
    }
  };


  // Filtrar actividades
  const filteredActivities = activities.filter(activity => {
    if (filterKind === 'all') return true;
    return activity.kind === filterKind;
  });

  // Formatear fecha y hora usando timezone de Guatemala
  const formatDateTime = (dateString: string) => {
    return {
      date: formatGT(dateString),
      time: formatGTTime(dateString)
    };
  };

  // Renderizar página de login
  const renderLogin = () => (
    <div className="relative min-h-screen bg-congreso flex items-center justify-center p-4">
      <div className="overlay-soft pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <Logo href="/" className="justify-center text-2xl mb-4" size="lg" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900/90 tracking-tight mb-2">
            {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-slate-700/90">
            {activeTab === 'login' 
              ? 'Accede con tu cuenta para inscribirte en las actividades del congreso'
              : 'Regístrate para participar en las actividades del congreso'
            }
          </p>
        </div>

        {/* Pestañas */}
        <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'login'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-6">
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            {/* Formulario de Login */}
            {activeTab === 'login' && (
              <>
                {loginErrors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {loginErrors.general}
                  </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        loginErrors.email ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="tu.email@umg.edu.gt o correo personal"
                    />
                    {loginErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{loginErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                          loginErrors.password ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{loginErrors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn || loggingInGoogle}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </button>
                </form>
              </>
            )}

            {/* Formulario de Registro */}
            {activeTab === 'register' && (
              <>
                {registerErrors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {registerErrors.general}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="register-fullName" className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="register-fullName"
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        registerErrors.fullName ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                    {registerErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{registerErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="register-email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        registerErrors.email ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="tu.email@umg.edu.gt o correo personal"
                    />
                    {registerErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{registerErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-institution" className="block text-sm font-medium text-slate-700 mb-1">
                      Institución (Opcional)
                    </label>
                    <input
                      type="text"
                      id="register-institution"
                      name="institution"
                      value={registerForm.institution}
                      onChange={handleRegisterChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Universidad Mariano Gálvez, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        id="register-password"
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                          registerErrors.password ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{registerErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="register-confirmPassword"
                        name="confirmPassword"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                          registerErrors.confirmPassword ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{registerErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={registering || loggingInGoogle}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? 'Registrando...' : 'Crear Cuenta'}
                  </button>
                </form>
              </>
            )}

            {/* Sección de Google Login (solo para login) */}
            {activeTab === 'login' && enableGoogle && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/70 text-slate-500">O continúa con</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Acceso con Google</h3>
                  
                  {googleErrors.general && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {googleErrors.general}
                    </div>
                  )}
                  
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loggingIn || loggingInGoogle}
                    aria-busy={loggingInGoogle}
                    className="w-full bg-white border border-neutral-300 text-slate-700 py-2 px-4 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loggingInGoogle ? 'Conectando con Google...' : 'Entrar con Google (solo correos de la Universidad Mariano Gálvez)'}
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'login' && !enableGoogle && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/70 text-slate-500">O continúa con</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                    Inicio con Google deshabilitado temporalmente. Usa tu correo y contraseña.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Link de regreso */}
        <div className="text-center mt-6">
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );

  // Renderizar selección de actividades
  const renderActivities = () => (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Hola, {user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Selecciona tus Actividades</h1>
          <p className="text-slate-600">Elige las actividades en las que deseas participar durante el congreso.</p>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'taller', label: 'Talleres' },
              { key: 'competencia', label: 'Competencias' },
              { key: 'conferencia', label: 'Conferencias' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterKind(filter.key as 'all' | 'taller' | 'competencia' | 'conferencia')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterKind === filter.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje de validación general */}
        {validationMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {validationMessage}
          </div>
        )}

        {/* Lista de actividades */}
        {loadingActivities ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="mt-2 text-slate-600">Cargando actividades...</p>
          </div>
        ) : loadingError ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-red-600 mb-4">{loadingError}</p>
            <button
              onClick={loadActivities}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-4">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600">
              {activities.length === 0 
                ? 'No hay actividades disponibles por ahora.' 
                : `No hay actividades de tipo "${filterKind}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map(activity => {
              const { date, time } = formatDateTime(activity.startTime);
              const isSelected = selectedActivities.includes(activity.id);
              const isFull = activity.isFull || (Number(activity.enrolled) >= Number(activity.capacity));
              const hasError = activityErrors[activity.id];
              const capacityInfo = capacityStatus[activity.id];
              const isValidating = validatingConflicts;
              
              // Determinar el estado de capacidad
              let capacityState = 'DISPONIBLE';
              let capacityColor = 'text-green-600';
              
              if (capacityInfo) {
                capacityState = capacityInfo.status;
                switch (capacityInfo.status) {
                  case 'LLENO':
                    capacityColor = 'text-red-600';
                    break;
                  case 'CASI_LLENO':
                    capacityColor = 'text-orange-600';
                    break;
                  case 'POCOS_CUPOS':
                    capacityColor = 'text-yellow-600';
                    break;
                  case 'DISPONIBLE':
                    capacityColor = 'text-green-600';
                    break;
                  case 'SIN_LIMITE':
                    capacityColor = 'text-blue-600';
                    break;
                }
              } else if (isFull) {
                capacityState = 'LLENO';
                capacityColor = 'text-red-600';
              }
              
              // Determinar si hay conflicto de horario
              const hasTimeConflict = hasError && hasError.includes('Conflicto de horario');
              
              return (
                <div key={activity.id} className="relative">
                  <div
                    className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-md'
                        : isFull || capacityState === 'LLENO'
                        ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-75'
                        : hasTimeConflict
                        ? 'border-orange-300 bg-orange-50 shadow-sm'
                        : hasError
                        ? 'border-red-300 bg-red-50 shadow-sm'
                        : 'border-neutral-300 hover:border-slate-400 hover:shadow-sm'
                    }`}
                    onClick={() => !(isFull || capacityState === 'LLENO') && !isValidating && toggleActivity(activity.id)}
                    role="button"
                    tabIndex={(isFull || capacityState === 'LLENO') ? -1 : 0}
                    onKeyDown={(e) => {
                      if (!(isFull || capacityState === 'LLENO') && !isValidating && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        toggleActivity(activity.id);
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-disabled={isFull || capacityState === 'LLENO'}
                    aria-label={`${activity.title} - ${isSelected ? 'Seleccionada' : 'No seleccionada'}${isFull || capacityState === 'LLENO' ? ' - Actividad llena' : ''}${hasError ? ` - Error: ${hasError}` : ''}`}
                  >
                    {/* Indicador de estado en la esquina superior derecha */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {isValidating && isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full animate-pulse">
                          <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                        </div>
                      )}
                      {hasTimeConflict && (
                        <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                      )}
                      {hasError && !hasTimeConflict && (
                        <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      {isSelected && !hasError && (
                        <div className="flex items-center justify-center w-6 h-6 bg-slate-900 rounded-full">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {(isFull || capacityState === 'LLENO') && !isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between mb-3 pr-8">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        activity.kind === 'taller' ? 'bg-blue-100 text-blue-800' :
                        activity.kind === 'competencia' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {activity.kind ? activity.kind.charAt(0).toUpperCase() + activity.kind.slice(1) : 'Actividad'}
                      </span>
                    </div>
                  
                  <h3 className="font-semibold text-slate-900 mb-2">{activity.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{activity.description}</p>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className={`${capacityColor} ${(isFull || capacityState === 'LLENO') ? 'font-medium' : ''}`}>
                        {capacityInfo ? `${capacityInfo.currentEnrollments}/${capacityInfo.maxCapacity || '∞'}` : `${activity.enrolled}/${activity.capacity}`} inscritos
                      </span>
                    </div>
                  </div>
                  
                  {activity.instructor && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Instructor:</span> {activity.instructor}
                      </p>
                    </div>
                  )}
                  
                  {/* Estado de capacidad */}
                  {capacityState !== 'DISPONIBLE' && (
                    <div className="mt-3 text-center">
                      <span className={`text-sm font-medium ${capacityColor}`}>
                        {capacityState === 'LLENO' && 'Actividad llena'}
                        {capacityState === 'CASI_LLENO' && 'Casi lleno'}
                        {capacityState === 'POCOS_CUPOS' && 'Pocos cupos'}
                        {capacityState === 'SIN_LIMITE' && 'Sin límite de cupos'}
                      </span>
                    </div>
                  )}
                  
                  {/* Mensaje de error específico */}
                  {hasError && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {hasTimeConflict && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Ya cuenta con una actividad o charla con el mismo horario</span>
                        </div>
                      )}
                      {!hasTimeConflict && hasError}
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botones de acción */}
        {selectedActivities.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-300 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <div className="text-sm text-slate-600 text-center sm:text-left">
                {selectedActivities.length} actividad(es) seleccionada(s)
                {validatingConflicts && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                    <span className="text-blue-600">Validando conflictos...</span>
                  </div>
                )}
                {conflictValidationResult?.hasConflicts && (
                  <div className="flex items-center gap-1 mt-1 text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Conflictos detectados</span>
                  </div>
                )}
              </div>
              <button
                onClick={proceedToSummary}
                disabled={validatingConflicts || conflictValidationResult?.hasConflicts}
                className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
              >
                {validatingConflicts ? 'Validando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar resumen
  const renderSummary = () => {
    const selectedActivitiesData = activities.filter(a => selectedActivities.includes(a.id));
    
    return (
      <div className="min-h-screen bg-neutral-100">
        {/* Header */}
        <header className="bg-white border-b border-neutral-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <Logo />
              <button
                onClick={() => setPageState('activities')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Panel izquierdo - Resumen del participante */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tarjeta Mi Perfil */}
              <div className="bg-white rounded-lg border border-neutral-300 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Mi Perfil</h2>
                <div className="space-y-4">
                  {user?.image && (
                    <div className="flex justify-center">
                      <img 
                        src={user.image} 
                        alt={user.name || 'Foto de perfil'}
                        className="w-16 h-16 rounded-full border-2 border-neutral-200"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">Nombre</p>
                    <p className="text-slate-900">{user?.name || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Correo</p>
                    <p className="text-slate-900">{user?.email || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Institución</p>
                    <p className="text-slate-900">{user?.organization || 'No especificado'}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>

              {/* Sección Diplomas */}
              <div className="bg-white rounded-lg border border-neutral-300 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Mis Diplomas</h2>
                {(() => {
                  const attendedEnrollments = enrollments.filter(e => e.attended);
                  
                  if (attendedEnrollments.length === 0) {
                    return (
                      <p className="text-slate-500 text-center py-4">No tienes diplomas disponibles</p>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {attendedEnrollments.map(enrollment => {
                        const activity = activities.find(a => a.id === enrollment.activityId.toString());
                        if (!activity) return null;
                        
                        const { date } = formatDateTime(activity.startTime);
                        
                        return (
                          <div key={enrollment.id} className="border border-neutral-200 rounded-lg p-3">
                            <div className="mb-3">
                              <h3 className="font-medium text-slate-900 text-sm mb-1">{activity.title}</h3>
                              <p className="text-xs text-slate-600 mb-2">{activity.kind}</p>
                              <div className="space-y-1 text-xs text-slate-500">
                                <p><span className="font-medium">Participante:</span> {user?.name || 'No especificado'}</p>
                                 <p><span className="font-medium">Fecha del congreso:</span> {date}</p>
                                 <p><span className="font-medium">Asistencia:</span> <span className="text-green-600 font-medium">Confirmada</span></p>
                                 <p><span className="font-medium">Asiento:</span> {enrollment.seatNumber}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // Placeholder para generar/descargar diploma
                                alert(`Generando diploma para: ${activity.title}\n\nEsta funcionalidad se conectará al generador PDF.`);
                              }}
                              className="w-full bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              Descargar Diploma
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Listado de actividades seleccionadas */}
              <div className="bg-white rounded-lg border border-neutral-300 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Actividades Seleccionadas ({selectedActivities.length})</h2>
                {selectedActivities.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No has seleccionado actividades</p>
                ) : (
                  <div className="space-y-3">
                    {selectedActivitiesData.map(activity => {
                      const { date, time } = formatDateTime(activity.startTime);
                      const enrollment = enrollments.find(e => e.activityId.toString() === activity.id);
                      
                      return (
                        <div key={activity.id} className="border border-neutral-200 rounded-lg p-3">
                          <h3 className="font-medium text-slate-900 text-sm mb-1">{activity.title}</h3>
                          <p className="text-xs text-slate-600 mb-2">{activity.kind}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span>{date} • {time}</span>
                          </div>
                          {enrollment && (
                            <div className="flex items-center justify-between">
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">No asistió</span>
                              <button
                                onClick={() => setShowQRModal({ show: true, enrollment })}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              >
                                Mostrar QR
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {selectedActivities.length > 0 && (
                  <button
                    onClick={confirmEnrollment}
                    disabled={enrolling}
                    className="w-full mt-4 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {enrolling ? 'Enviando...' : 'Enviar Inscripción'}
                  </button>
                )}
              </div>
            </div>

            {/* Actividades seleccionadas */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-neutral-300 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">
                  Actividades Seleccionadas ({selectedActivitiesData.length})
                </h2>
                {selectedActivitiesData.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No has seleccionado actividades</p>
                ) : (
                  <div className="space-y-4">
                    {selectedActivitiesData.map(activity => {
                      const { date, time } = formatDateTime(activity.startTime);
                      
                      return (
                        <div key={activity.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-slate-900 mb-1">{activity.title}</h3>
                              <p className="text-sm text-slate-600">{activity.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              activity.kind === 'taller' ? 'bg-blue-100 text-blue-800' :
                              activity.kind === 'competencia' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {activity.kind ? activity.kind.charAt(0).toUpperCase() + activity.kind.slice(1) : 'Actividad'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center text-slate-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{time}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{activity.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200">
                            <div className="flex items-center text-sm text-slate-600">
                              <Users className="h-4 w-4 mr-2" />
                              <span>{activity.enrolled}/{activity.capacity} inscritos</span>
                            </div>
                            {activity.instructor && (
                              <div className="text-sm text-slate-600">
                                <span className="font-medium">Instructor: </span>
                                <span>{activity.instructor}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón de confirmación */}
          <div className="mt-8 text-center">
            <button
              onClick={confirmEnrollment}
              disabled={enrolling || validatingTimeConflicts}
              className="bg-slate-900 text-white px-8 py-3 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingTimeConflicts ? 'Validando conflictos...' : 
               enrolling ? 'Procesando inscripción...' : 
               'Confirmar Inscripción'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar confirmación con QR
  const renderConfirmation = () => (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <button
              onClick={logout}
              className="text-slate-600 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">¡Inscripción Exitosa!</h1>
          <p className="text-slate-600">¡Inscripción completada! Revisa tu correo para los QR.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Información de inscripción */}
          <div className="bg-white rounded-lg border border-neutral-300 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Detalles de Inscripción</h2>
            <div className="space-y-4">
              {enrollments.map(enrollment => {
                const activity = activities.find(a => a.id === enrollment.activityId.toString());
                if (!activity) return null;
                
                return (
                  <div key={enrollment.id} className="border border-neutral-200 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-2">{activity.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Asiento:</span> {enrollment.seatNumber || 'Por asignar'}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> {enrollment.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Información de Email */}
          <div className="bg-white rounded-lg border border-neutral-300 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Confirmación por Email</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Email de confirmación enviado</p>
                  <p className="text-xs text-green-700">Se ha enviado un email de confirmación con los códigos QR a tu correo electrónico.</p>
                </div>
              </div>
              
              {enrollmentErrors.length > 0 && (
                <div className="space-y-2">
                  {enrollmentErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-2">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Revisa tu bandeja de entrada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Próximos pasos</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Revisa tu email</strong> para la confirmación detallada con códigos QR</li>
                <li>• Guarda los códigos QR que recibirás por email</li>
                <li>• Llega 15 minutos antes del inicio de cada actividad</li>
                <li>• Presenta tu código QR al ingresar a cada actividad</li>
                <li>• Si no recibes el email, revisa tu carpeta de spam</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="bg-white border border-neutral-300 text-slate-700 px-6 py-2 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Volver al inicio
          </Link>
          <Link
            href="/portal"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ir a Mi Portal
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Imprimir confirmación
          </button>
        </div>
      </div>
    </div>
  );

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="relative min-h-screen bg-congreso flex items-center justify-center">
        <div className="overlay-soft pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-700/90">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Renderizar según el estado actual
  return (
    <>
      {pageState === 'login' && renderLogin()}
      {pageState === 'activities' && renderActivities()}
      {pageState === 'summary' && renderSummary()}
      {pageState === 'confirmation' && renderConfirmation()}
      
      {/* Modal de QR */}
      {showQRModal.show && showQRModal.enrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Código QR de Acceso</h3>
              <button
                onClick={() => setShowQRModal({ show: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center">
              {(() => {
                const activity = activities.find(a => a.id === showQRModal.enrollment?.activityId?.toString());
                return (
                  <>
                    <div className="inline-flex items-center justify-center w-48 h-48 bg-slate-100 rounded-lg mb-4">
                      <QrCode className="h-24 w-24 text-slate-600" />
                    </div>
                    <h4 className="font-medium text-slate-900 mb-2">{activity?.title}</h4>
                    <p className="text-sm text-slate-600 mb-1">Asiento: {showQRModal.enrollment?.seatNumber || 'Por asignar'}</p>
                    <p className="text-xs text-slate-500 font-mono">Estado: {showQRModal.enrollment?.status}</p>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Presenta este código QR al ingresar a la actividad
                      </p>
                    </div>
                  </>
                );
              })()} 
            </div>
          </div>
        </div>
      )}


      {/* Mensaje de confirmación */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">¡Inscripción completada!</p>
              <p className="text-sm opacity-90">Revisa tu correo para los QR.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const getServerSideProps = async (ctx: any) => {
  const cookie = ctx.req.headers.cookie ?? "";
  const bases = [
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL,
    'https://congreso-api.onrender.com'
  ].filter((v) => typeof v === 'string' && !!v).map((v) => (v as string).replace(/\/$/, ''));

  const safeFetch = async (path: string): Promise<Response | null> => {
    for (const b of bases) {
      try {
        const res = await fetch(b + path, { headers: { cookie }, credentials: 'include' });
        return res;
      } catch (err) {
        // Continuar con siguiente base si hay fallo de red (TypeError: fetch failed)
        console.error(`[SSR] fetch failed for ${b + path}:`, (err as any)?.message || err);
        continue;
      }
    }
    return null;
  };

  try {
    const me = await safeFetch('/api/auth/session');
    if (!me || me.status === 401) return { props: {} };

    const sum = await safeFetch('/api/enrollments/summary');
    if (sum) {
      const { count = 0 } = await sum.json().catch(() => ({ count: 0 }));
      if (count > 0) return { redirect: { destination: '/mi-cuenta', permanent: false } };
    }

    return { props: {} };
  } catch (err) {
    console.error('[SSR] getServerSideProps error:', err);
    return { props: {} };
  }
};