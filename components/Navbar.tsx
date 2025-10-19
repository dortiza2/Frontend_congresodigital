"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Cpu, Menu, LogOut, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { isLoggedIn, getUser, clearSession } from "@/lib/authClient";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardButtonText, getDashboardButtonRoute, type UserProfile } from "@/lib/roleUtils";
import type { User as AuthUser } from "@/types/auth";


const CTA = {
  podiumPath: "/podio", // Ruta del Podio del Congreso (NO usar #)
  loginPath: "/inscripcion",   // Página de registro/inscripción del congreso
};

const navLinks = [
  { href: "/#congreso", label: "Congreso" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/#actividades", label: "Actividades" },
  { href: "/#ganadores", label: "Ganadores" },
  { href: "/#faq", label: "FAQ" },
  { href: "/inscripcion", label: "Inscripción" },
];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localUser, setLocalUser] = useState<{ email: string; name?: string } | null>(null);
  const router = useRouter();
  const { logout, user } = useAuth();
  const close = () => setOpen(false);

  const convertToUserProfile = (user: AuthUser): UserProfile => {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.name || '',
      profileType: user.profileType || 'student',
      staffRole: user.staffRole,
      roleLevel: user.roleLevel,
      isUmg: user.isUmg || false,
      orgName: user.organization
    };
  };

  const handleDashboard = () => {
    if (user) {
      const userProfile = convertToUserProfile(user);
      const dashboardRoute = getDashboardButtonRoute(userProfile);
      router.push(dashboardRoute);
    }
  };

  const getDashboardText = () => {
    if (user) {
      const userProfile = convertToUserProfile(user);
      return getDashboardButtonText(userProfile);
    }
    return 'Dashboard';
  };

  const shouldShowDashboard = () => {
    if (user) {
      const roleLevel = user.roleLevel ?? 0;
      return roleLevel <= 3; // Mostrar Dashboard para roles 0, 1, 2 y 3
    }
    return false;
  };

  const shouldShowAccount = () => {
    if (user) {
      const roleLevel = user.roleLevel ?? 0;
      return (roleLevel === 0 || roleLevel === 4) && router.pathname !== '/mi-cuenta';
    }
    return false;
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setLocalUser(getUser());
      } else {
        setLocalUser(null);
      }
    };
    
    checkAuth();
    // Verificar cada vez que se abre el menú
    if (open) {
      checkAuth();
    }
  }, [open]);
  
  const handleMobileInscripcionClick = () => {
    close();
    router.push(CTA.loginPath);
  };
  
  const handleMobileLogout = async () => {
    close();
    await logout();
  };
  
  const handleMobileAccount = () => {
    close();
    router.push('/mi-cuenta');
  };

  // Extract firstName from user data for mobile nav
  const firstName = user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  
  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[88vw] sm:w-[380px]">
          <nav className="mt-8 grid gap-3 text-base">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-md px-2 py-2 hover:bg-neutral-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-neutral-200" />
            <Link
              href={CTA.podiumPath}
              onClick={close}
              className="rounded-md px-2 py-2 hover:bg-neutral-50"
            >
              Podio del Congreso
            </Link>
            {user ? (
              <>
                <div className="px-2 py-2 text-neutral-600">
                  Hola, <b>{firstName}</b>
                </div>
                {shouldShowAccount() && (
                  <button
                    onClick={handleMobileAccount}
                    className="rounded-md px-2 py-2 hover:bg-neutral-50 text-left w-full cursor-pointer flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Cuenta</span>
                  </button>
                )}
                {shouldShowDashboard() && (
                  <button
                    onClick={() => { close(); handleDashboard(); }}
                    className="rounded-md px-2 py-2 hover:bg-neutral-50 text-left w-full cursor-pointer"
                  >
                    {getDashboardText()}
                  </button>
                )}
                <button
                  onClick={handleMobileLogout}
                  className="rounded-md bg-red-600 text-white px-2 py-2 hover:bg-red-700 text-left w-full cursor-pointer flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
                {user && (
                  <div className="px-2 py-1 text-xs text-neutral-500">
                    {user.email}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleMobileInscripcionClick}
                className="rounded-md px-2 py-2 hover:bg-neutral-50 text-left w-full cursor-pointer"
              >
                Login / Register
              </button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const onMyAccount = router.pathname.startsWith("/mi-cuenta");

  const convertToUserProfile = (user: any) => {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.name || 'Usuario',
      profileType: user.profileType || 'student',
      staffRole: user.staffRole,
      isUmg: user.isUmg || false,
      orgName: user.organization
    };
  };

  const handleDashboard = () => {
    if (user) {
      const userProfile = convertToUserProfile(user);
      const dashboardRoute = getDashboardButtonRoute(userProfile);
      router.push(dashboardRoute);
    }
  };

  const getDashboardText = () => {
    if (user) {
      const userProfile = convertToUserProfile(user);
      return getDashboardButtonText(userProfile);
    }
    return 'Dashboard';
  };

  const shouldShowDashboard = () => {
    if (user) {
      const roleLevel = user.roleLevel ?? 0;
      return roleLevel <= 3; // Dashboard visible para roleLevel 0,1,2,3
    }
    return false;
  };

  const shouldShowAccount = () => {
    if (user) {
      const roleLevel = user.roleLevel ?? 0;
      // Mi Cuenta visible solo para roleLevel 0 y 4
      return (roleLevel === 0 || roleLevel === 4) && !onMyAccount;
    }
    return false;
  };

  // Extract firstName from user data
  const firstName = user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "";
  

  
  const handleInscripcionClick = () => {
    router.push(CTA.loginPath);
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  const handleAccount = () => {
    router.push('/mi-cuenta');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] w-full border-b border-transparent bg-[#4A148C] text-white">
         <div className="mx-auto max-w-7xl px-4 sm:px-6">
           <div className="flex h-14 items-center justify-between gap-3">
             {/* Logo */}
             <Link
               href="/"
               className="flex min-w-0 items-center gap-2 font-semibold text-white"
             >
               <Cpu className="h-5 w-5" />
               <span className="truncate">Congreso Digital</span>
             </Link>

             {/* Desktop Navigation */}
             <nav className="hidden lg:flex items-center gap-6 text-sm text-white">
               {navLinks.map((link) => (
                 <Link
                   key={link.href}
                   href={link.href}
                   className="hover:underline underline-offset-4"
                 >
                   {link.label}
                 </Link>
               ))}
             </nav>

             {/* CTAs and Mobile Menu */}
             <div className="flex items-center gap-2">
               {/* Desktop CTAs */}
               <div className="hidden lg:flex items-center gap-3">
                 <Link
                   href={CTA.podiumPath}
                  className="inline-flex items-center rounded-md border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                 >
                   Podio
                 </Link>
                 {user ? (
                   <div className="flex items-center gap-3">
                    <span className="text-white">Hola, <b>{firstName}</b></span>
                     {shouldShowAccount() && (
                       <button
                         onClick={handleAccount}
                        className="inline-flex items-center rounded-md border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10 cursor-pointer space-x-1"
                       >
                         <User className="h-4 w-4" />
                         <span>Mi Cuenta</span>
                       </button>
                     )}
                     {shouldShowDashboard() && (
                       <button
                         onClick={handleDashboard}
                        className="inline-flex items-center rounded-md border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10 cursor-pointer"
                       >
                         <span>{getDashboardText()}</span>
                       </button>
                     )}
                     <button
                       onClick={handleLogout}
                       className="inline-flex items-center rounded-md bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700 cursor-pointer space-x-1"
                     >
                       <LogOut className="h-4 w-4" />
                       <span>Cerrar sesión</span>
                     </button>
                   </div>
                 ) : (
                   <button
                     onClick={handleInscripcionClick}
                    className="inline-flex items-center rounded-md border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/10 cursor-pointer"
                   >
                     Login / Register
                   </button>
                 )}
               </div>
               
               {/* Mobile Menu */}
               <MobileNav />
             </div>
           </div>
         </div>
       </header>
      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className="h-14" aria-hidden="true" />
    </>
  );
}
