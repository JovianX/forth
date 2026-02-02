import React from 'react';
import { savePalette, updateContainerColors } from '../utils/paletteUtils';

export interface ColorPalette {
  name: string;
  description: string;
  containerColors: string[];
  backgroundGradient: string;
  accentColors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    border: string;
    hover: string;
  };
  mood: string;
}

const palettes: ColorPalette[] = [
  {
    name: 'Golden Sunrise',
    description: 'Warm, energetic, optimistic',
    containerColors: [
      '#F59E0B', '#F97316', '#EA580C', '#DC2626', '#B91C1C', '#C2410C',
      '#EAB308', '#CA8A04', '#A16207', '#92400E', '#78350F', '#F97316'
    ],
    backgroundGradient: 'from-amber-50 via-orange-50 to-red-50',
    accentColors: {
      primary: '#F59E0B',
      primaryLight: '#FEF3C7',
      primaryDark: '#D97706',
      secondary: '#F97316',
      border: 'rgba(245, 158, 11, 0.3)',
      hover: 'rgba(245, 158, 11, 0.1)'
    },
    mood: 'Energetic, warm, optimistic'
  },
  {
    name: 'Ocean Sunrise',
    description: 'Calm, professional, balanced',
    containerColors: [
      '#0EA5E9', '#06B6D4', '#14B8A6', '#3B82F6', '#6366F1', '#10B981',
      '#22D3EE', '#1E40AF', '#1E3A8A', '#60A5FA', '#818CF8', '#059669'
    ],
    backgroundGradient: 'from-blue-50 via-cyan-50 to-teal-50',
    accentColors: {
      primary: '#3B82F6',
      primaryLight: '#DBEAFE',
      primaryDark: '#2563EB',
      secondary: '#06B6D4',
      border: 'rgba(59, 130, 246, 0.3)',
      hover: 'rgba(59, 130, 246, 0.1)'
    },
    mood: 'Calm, professional, trustworthy'
  },
  {
    name: 'Forest Dawn',
    description: 'Natural, grounded, growth-oriented',
    containerColors: [
      '#10B981', '#22C55E', '#059669', '#84CC16', '#65A30D', '#A3E635',
      '#365314', '#166534', '#34D399', '#14B8A6', '#14532D', '#15803D'
    ],
    backgroundGradient: 'from-green-50 via-emerald-50 to-teal-50',
    accentColors: {
      primary: '#10B981',
      primaryLight: '#D1FAE5',
      primaryDark: '#059669',
      secondary: '#22C55E',
      border: 'rgba(16, 185, 129, 0.3)',
      hover: 'rgba(16, 185, 129, 0.1)'
    },
    mood: 'Natural, growth-oriented, peaceful'
  },
  {
    name: 'Lavender Twilight',
    description: 'Creative, soothing, elegant',
    containerColors: [
      '#A78BFA', '#9333EA', '#7C3AED', '#6366F1', '#9F1239', '#C026D3',
      '#E11D48', '#EC4899', '#C084FC', '#D946EF', '#6B21A8', '#8B5CF6'
    ],
    backgroundGradient: 'from-purple-50 via-pink-50 to-indigo-50',
    accentColors: {
      primary: '#9333EA',
      primaryLight: '#F3E8FF',
      primaryDark: '#7C3AED',
      secondary: '#EC4899',
      border: 'rgba(147, 51, 234, 0.3)',
      hover: 'rgba(147, 51, 234, 0.1)'
    },
    mood: 'Creative, soothing, elegant'
  },
  {
    name: 'Navy Professional',
    description: 'Trustworthy, focused, enterprise-grade',
    containerColors: [
      '#1E3A8A', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD',
      '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'
    ],
    backgroundGradient: 'from-slate-50 via-blue-50 to-indigo-50',
    accentColors: {
      primary: '#1E40AF',
      primaryLight: '#DBEAFE',
      primaryDark: '#1E3A8A',
      secondary: '#3B82F6',
      border: 'rgba(30, 64, 175, 0.3)',
      hover: 'rgba(30, 64, 175, 0.1)'
    },
    mood: 'Professional, trustworthy, focused'
  },
  {
    name: 'Modern Monochrome',
    description: 'Clean, minimal, professional',
    containerColors: [
      '#64748B', '#6B7280', '#374151', '#475569', '#94A3B8', '#9CA3AF',
      '#1F2937', '#111827', '#E5E7EB', '#F3F4F6', '#78716C', '#4B5563'
    ],
    backgroundGradient: 'from-gray-50 via-slate-50 to-zinc-50',
    accentColors: {
      primary: '#64748B',
      primaryLight: '#F1F5F9',
      primaryDark: '#475569',
      secondary: '#6B7280',
      border: 'rgba(100, 116, 139, 0.3)',
      hover: 'rgba(100, 116, 139, 0.1)'
    },
    mood: 'Clean, minimal, professional'
  }
];

export const ColorPalettePreview: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const handleApplyPalette = (palette: ColorPalette) => {
    // Save theme to localStorage
    savePalette(palette);
    updateContainerColors(palette.containerColors);
    
    // Close preview and reload to apply changes
    if (onClose) {
      onClose();
      // Small delay to allow state update, then reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Fallback: redirect to main page
      window.location.href = window.location.pathname;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Theme Selection</h1>
          <p className="text-gray-600">Choose a theme to apply to your application</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {palettes.map((palette) => (
            <div
              key={palette.name}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl"
            >
              {/* Preview Header */}
              <div className={`h-32 bg-gradient-to-br ${palette.backgroundGradient} p-6 flex items-center gap-4`}>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${palette.containerColors[0]} 0%, ${palette.containerColors[1]} 100%)` }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{palette.name}</h3>
                  <p className="text-sm text-gray-600">{palette.mood}</p>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">{palette.description}</p>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {palette.containerColors.slice(0, 6).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-full h-12 rounded-md shadow-sm border-2 border-white"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleApplyPalette(palette)}
                  className="w-full px-4 py-2 rounded-lg transition-colors font-medium text-white"
                  style={{ backgroundColor: palette.accentColors.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = palette.accentColors.primaryDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = palette.accentColors.primary}
                >
                  Apply Theme
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
