import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Palette, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPalette } from '../utils/paletteUtils';

export type UserMenuVariant = 'header' | 'sidebar';

interface UserMenuProps {
  onColorPaletteClick?: () => void;
  variant?: UserMenuVariant;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onColorPaletteClick,
  variant = 'header',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [user?.photoURL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const palette = getPalette();
  const primaryColor = palette?.accentColors.primary || '#F59E0B';
  const primaryDark = palette?.accentColors.primaryDark || '#D97706';
  const primaryLight = palette?.accentColors.primaryLight || '#FEF3C7';
  const borderColor = palette?.accentColors.border || 'rgba(245, 158, 11, 0.3)';

  const isSidebar = variant === 'sidebar';
  const photoURL = user?.photoURL;
  const showPhoto = Boolean(photoURL && !photoLoadFailed);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center rounded-lg transition-all duration-200 overflow-hidden shrink-0 ${
          isSidebar ? 'w-9 h-9' : 'w-10 h-10'
        }`}
        style={
          showPhoto
            ? {
                border: `1px solid ${borderColor}`,
                padding: 0,
              }
            : {
                backgroundColor: `${primaryLight}80`,
                border: `1px solid ${borderColor}`,
                color: primaryDark,
              }
        }
        onMouseEnter={(e) => {
          if (showPhoto) {
            e.currentTarget.style.borderColor = primaryColor;
          } else {
            e.currentTarget.style.backgroundColor = `${primaryLight}CC`;
            e.currentTarget.style.borderColor = primaryColor;
          }
        }}
        onMouseLeave={(e) => {
          if (showPhoto) {
            e.currentTarget.style.borderColor = borderColor;
          } else {
            e.currentTarget.style.backgroundColor = `${primaryLight}80`;
            e.currentTarget.style.borderColor = borderColor;
          }
        }}
        aria-label="User menu"
        aria-expanded={open}
      >
        {showPhoto ? (
          <img
            src={photoURL!}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setPhotoLoadFailed(true)}
          />
        ) : (
          <UserIcon size={isSidebar ? 18 : 20} />
        )}
      </button>

      {open && (
        <div
          className={`absolute w-56 bg-white rounded-lg shadow-lg py-2 z-[60] ${
            isSidebar
              ? 'left-full ml-2 bottom-0'
              : 'right-0 mt-2 top-full'
          }`}
          style={{ border: `1px solid ${borderColor}` }}
        >
          <div
            className="px-4 py-2 flex items-center gap-3 min-w-0"
            style={{ borderBottom: `1px solid ${primaryLight}` }}
          >
            {showPhoto ? (
              <img
                src={photoURL!}
                alt=""
                className="h-9 w-9 rounded-full object-cover shrink-0 border border-gray-200/80"
                referrerPolicy="no-referrer"
                onError={() => setPhotoLoadFailed(true)}
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center border border-gray-200/80"
                style={{ backgroundColor: `${primaryLight}99` }}
              >
                <UserIcon size={18} style={{ color: primaryDark }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">User Menu</p>
              {user?.email && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onColorPaletteClick?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
            style={{ color: primaryDark }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Palette size={18} style={{ color: primaryColor }} />
            <span>Theme</span>
          </button>

          <div
            className="px-4 py-2 mt-1"
            style={{ borderTop: `1px solid ${primaryLight}` }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
              style={{ color: primaryDark }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={18} style={{ color: primaryColor }} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
