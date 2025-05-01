import React from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  sizeClasses?: string; // e.g., 'w-10 h-10'
  textClasses?: string; // e.g., 'text-sm'
  className?: string;   // Optional container classes
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName,
  lastName,
  avatarUrl,
  sizeClasses = 'w-10 h-10', // Default size
  textClasses = 'text-sm', // Default text size
  className = 'rounded-lg bg-[#37bd7e]/10 border border-[#37bd7e]/20 flex items-center justify-center' // Default container style from Users.tsx
}) => {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`;

  return (
    <div className={cn(sizeClasses, className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={firstName ? `${firstName} ${lastName ?? ''}`.trim() : 'User Avatar'}
          className="w-full h-full object-cover rounded-lg" // Assuming rounded style is applied by container or here
          onError={(e) => {
            // Optional: Handle image loading errors, e.g., show initials instead
            (e.target as HTMLImageElement).style.display = 'none';
            // Could add a sibling element with initials to show on error
          }}
        />
      ) : (
        <span className={cn('font-medium text-[#37bd7e]', textClasses)}>
          {initials || '?'} {/* Show ? if no initials */}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;