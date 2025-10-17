import Link from "next/link";
import { Cpu } from "lucide-react";

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

export default function Logo({ 
  href = "/", 
  className = "", 
  showText = true,
  size = 'md'
}: LogoProps) {
  const logoContent = (
    <>
      <Cpu className={`${sizeClasses[size]} shrink-0`} />
      {showText && (
        <span className="truncate">Congreso Digital</span>
      )}
    </>
  );

  const baseClasses = "flex min-w-0 items-center gap-2 text-slate-900 font-semibold";
  const combinedClasses = `${baseClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={combinedClasses}>
      {logoContent}
    </div>
  );
}