import React, { useState, useRef, useEffect } from 'react';
import { FolderTree, ListChecks, User, Palette } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Mode } from '../types';
import { getPalette } from '../utils/paletteUtils';

interface ModeSwitcherProps {
  onColorPaletteClick?: () => void;
}

// Icon components
const getIconSVG = (iconName: string | null) => {
  const defaultIcon = (
    <>
      <path
        d="M4 11 C 4 7, 7 5, 10 7 C 13 9, 14 11, 16 13 C 18 15, 19 17, 20 19"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="opacity-100"
      />
      <path
        d="M18 17.5 L 20.5 19 L 19.2 16.8 Z"
        fill="currentColor"
        className="opacity-100"
      />
      <path
        d="M5 10 C 5 9, 6.5 8, 8 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="opacity-35"
      />
      <circle cx="11.5" cy="10" r="1.3" fill="currentColor" className="opacity-25" />
    </>
  );

  switch (iconName) {
    case 'Flowing Path with Milestones':
      return (
        <>
          <path
            d="M3 12 C 3 8, 6 6, 9 8 C 12 10, 13 12, 15 14 C 17 16, 18 18, 20 20"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="9" r="2" fill="currentColor" />
          <circle cx="13" cy="11" r="2" fill="currentColor" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
          <path d="M18 18 L 21 20 L 19.5 17.5 Z" fill="currentColor" />
        </>
      );
    case 'Growing Sprout':
      return (
        <>
          <path
            d="M12 20 C 12 16, 10 12, 8 10 C 6 8, 4 7, 4 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20 C 12 16, 14 12, 16 10 C 18 8, 20 7, 20 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10 Q 10 8, 12 10 Q 14 12, 16 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="10" cy="9" r="1.5" fill="currentColor" />
          <circle cx="14" cy="9" r="1.5" fill="currentColor" />
        </>
      );
    case 'Forward Compass':
      return (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path d="M12 3 L 12 8 M 12 16 L 12 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M3 12 L 8 12 M 16 12 L 21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M12 8 L 15 12 L 12 16 L 9 12 Z" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" className="opacity-30" />
        </>
      );
    case 'Flowing Checkmark':
      return (
        <>
          <path
            d="M6 12 C 6 10, 8 8, 10 10 C 12 12, 14 14, 16 16"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 16 L 20 12 L 18 10"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 11 Q 9 9, 11 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-50"
          />
        </>
      );
    case 'Rising Wave':
      return (
        <>
          <path
            d="M3 14 Q 6 10, 9 12 T 15 10 T 21 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M3 18 Q 6 14, 9 16 T 15 14 T 21 16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-60"
          />
          <path d="M19 12 L 22 10 L 20.5 13 Z" fill="currentColor" />
        </>
      );
    case 'Footprints Forward':
      return (
        <>
          <path
            d="M5 10 C 5 8, 7 6, 9 8 C 11 10, 12 12, 14 14 C 16 16, 17 18, 19 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse cx="7" cy="9" rx="1.5" ry="2.5" fill="currentColor" className="opacity-80" />
          <ellipse cx="11" cy="11" rx="1.5" ry="2.5" fill="currentColor" className="opacity-80" />
          <ellipse cx="16" cy="17" rx="1.5" ry="2.5" fill="currentColor" className="opacity-80" />
          <path d="M19 20 L 22 22 L 20.5 19.5 Z" fill="currentColor" />
        </>
      );
    case 'Momentum Arrow':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M15 13.5 L 19 16 L 17 11.5 Z" fill="currentColor" />
          <path
            d="M5 11 C 5 10, 6 9, 7 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-40"
          />
          <circle cx="11" cy="10" r="1.2" fill="currentColor" className="opacity-30" />
        </>
      );
    case 'Progress Path':
      return (
        <>
          <path
            d="M3 11 C 3 9, 5 7, 8 9 C 11 11, 13 13, 16 15 C 19 17, 20 19, 21 20"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="6.5" y="8.5" width="3" height="3" rx="0.5" fill="currentColor" className="opacity-70" />
          <rect x="11.5" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" className="opacity-70" />
          <rect x="16.5" y="14.5" width="3" height="3" rx="0.5" fill="currentColor" className="opacity-70" />
          <path d="M20 19 L 22.5 20.5 L 21 17.5 Z" fill="currentColor" />
        </>
      );
    case 'Ascending Steps':
      return (
        <>
          <path
            d="M4 18 L 8 14 L 12 10 L 16 6"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="6" y="16" width="4" height="2" rx="0.5" fill="currentColor" />
          <rect x="10" y="12" width="4" height="2" rx="0.5" fill="currentColor" />
          <rect x="14" y="8" width="4" height="2" rx="0.5" fill="currentColor" />
          <path d="M18 5 L 20 3 L 19 6 Z" fill="currentColor" />
        </>
      );
    case 'Flowing River':
      return (
        <>
          <path
            d="M3 10 Q 5 8, 7 10 Q 9 12, 11 10 Q 13 8, 15 10 Q 17 12, 19 10 Q 21 8, 21 10"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M3 14 Q 5 12, 7 14 Q 9 16, 11 14 Q 13 12, 15 14 Q 17 16, 19 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-60"
          />
          <circle cx="9" cy="10" r="1" fill="currentColor" className="opacity-50" />
          <circle cx="15" cy="10" r="1" fill="currentColor" className="opacity-50" />
          <path d="M19 10 L 21 8 L 20 11 Z" fill="currentColor" />
        </>
      );
    case 'Rocket Launch':
      return (
        <>
          <path
            d="M12 20 L 12 8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M10 8 L 12 4 L 14 8 Z" fill="currentColor" />
          <path
            d="M8 10 L 10 12 M 14 12 L 16 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-70"
          />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" className="opacity-50" />
          <path
            d="M9 16 Q 12 18, 15 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-40"
          />
        </>
      );
    case 'Spiral Forward':
      return (
        <>
          <path
            d="M12 20 Q 8 18, 6 14 Q 4 10, 6 6 Q 8 2, 12 4 Q 16 6, 18 10 Q 20 14, 18 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M17 17 L 19.5 19 L 18 15.5 Z" fill="currentColor" />
          <circle cx="8" cy="10" r="1" fill="currentColor" className="opacity-40" />
          <circle cx="12" cy="6" r="1" fill="currentColor" className="opacity-40" />
        </>
      );
    case 'Lightning Path':
      return (
        <>
          <path
            d="M6 8 L 10 6 L 8 12 L 14 10 L 12 16 L 18 14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6 10 L 9 8 M 14 12 L 17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-50"
          />
          <path d="M17 13 L 20 11 L 18.5 14 Z" fill="currentColor" />
        </>
      );
    case 'Mountain Peak':
      return (
        <>
          <path
            d="M4 20 L 8 12 L 12 16 L 16 8 L 20 12 L 20 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 16 L 12 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          <path d="M19 11 L 21 9 L 20 12 Z" fill="currentColor" />
        </>
      );
    case 'Butterfly Flight':
      return (
        <>
          <path
            d="M8 12 Q 10 10, 12 12 Q 14 14, 16 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8 12 Q 6 8, 4 10 M 16 12 Q 18 8, 20 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-60"
          />
          <path
            d="M12 12 L 12 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="11" r="1" fill="currentColor" className="opacity-50" />
          <circle cx="14" cy="11" r="1" fill="currentColor" className="opacity-50" />
          <path d="M19 9 L 21 7 L 20 10 Z" fill="currentColor" />
        </>
      );
    case 'Star Trail':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14 C 18 16, 19 18, 20 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 9 L 9 7 L 10 9 L 12 9 L 10 10 L 11 12 L 9 11 L 7 12 L 8 10 Z"
            fill="currentColor"
            className="opacity-80"
          />
          <path
            d="M13 11 L 14 9 L 15 11 L 17 11 L 15 12 L 16 14 L 14 13 L 12 14 L 13 12 Z"
            fill="currentColor"
            className="opacity-60"
          />
          <path d="M18 17.5 L 20.5 19 L 19.2 16.8 Z" fill="currentColor" />
        </>
      );
    case 'Wind Flow':
      return (
        <>
          <path
            d="M3 10 Q 5 8, 7 10 Q 9 12, 11 10 Q 13 8, 15 10 Q 17 12, 19 10 Q 21 8, 21 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M3 14 Q 5 12, 7 14 Q 9 16, 11 14 Q 13 12, 15 14 Q 17 16, 19 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-50"
          />
          <path
            d="M5 12 Q 7 10, 9 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-30"
          />
          <path d="M19 10 L 21 8 L 20 11 Z" fill="currentColor" />
        </>
      );
    case 'Cascading Steps':
      return (
        <>
          <path
            d="M4 18 L 7 15 L 10 12 L 13 9 L 16 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="5" y="17" width="3" height="1" rx="0.5" fill="currentColor" />
          <rect x="8" y="14" width="3" height="1" rx="0.5" fill="currentColor" />
          <rect x="11" y="11" width="3" height="1" rx="0.5" fill="currentColor" />
          <rect x="14" y="8" width="3" height="1" rx="0.5" fill="currentColor" />
          <path d="M17 5 L 19 3 L 18 6 Z" fill="currentColor" />
        </>
      );
    case 'Phoenix Rising':
      return (
        <>
          <path
            d="M12 20 C 12 16, 10 12, 8 10 C 6 8, 4 7, 4 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20 C 12 16, 14 12, 16 10 C 18 8, 20 7, 20 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 10 Q 10 8, 12 10 Q 14 12, 16 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 9 L 12 7 L 14 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <path d="M19 5 L 21 3 L 20 6 Z" fill="currentColor" />
        </>
      );
    case 'Arrow Stream':
      return (
        <>
          <path
            d="M4 10 C 4 8, 6 6, 8 8 C 10 10, 11 12, 13 14 C 15 16, 16 18, 18 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 12 C 5 10, 7 8, 9 10 C 11 12, 12 14, 14 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          <path
            d="M6 14 C 6 12, 8 10, 10 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          />
          <path d="M17 19 L 20 21 L 18.5 18.5 Z" fill="currentColor" />
        </>
      );
    case 'Goal Target':
      return (
        <>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-70" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <path
            d="M12 4 C 12 4, 8 8, 6 10 C 4 12, 4 12, 4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="opacity-50"
          />
          <path d="M4 12 L 8 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M20 12 L 16 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 4 L 12 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 20 L 12 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 'Happy Path':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14 C 18 16, 19 18, 20 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="9" r="1.5" fill="currentColor" />
          <circle cx="13" cy="11" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.5" fill="currentColor" />
          <path
            d="M8 7 Q 8 6, 9 6 Q 10 6, 10 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-80"
          />
          <path
            d="M13 9 Q 13 8, 14 8 Q 15 8, 15 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-80"
          />
          <path d="M18 16.5 L 20.5 19 L 19.2 16.8 Z" fill="currentColor" />
        </>
      );
    case 'Checklist Path':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14 C 18 16, 19 18, 20 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 9 L 9 11 L 11 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 11 L 14 13 L 16 11"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M17 17 L 19 19 L 21 17"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M19 19 L 21 21 L 20 18.5 Z" fill="currentColor" />
        </>
      );
    case 'Sunrise Path':
      return (
        <>
          <path
            d="M4 16 C 4 12, 7 10, 10 12 C 13 14, 14 16, 16 18 C 18 20, 19 22, 20 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path
            d="M8 6 L 10 4 M 16 6 L 18 4 M 12 2 L 12 0 M 12 10 L 12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-60"
          />
          <path d="M19 22 L 21.5 24 L 20.2 21.8 Z" fill="currentColor" />
        </>
      );
    case 'Clean Sunrise Path':
      return (
        <>
          <path
            d="M4 16 Q 8 13, 12 14.5 Q 16 16, 20 19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="6" r="3.5" fill="currentColor" />
          <path d="M19 18 L 21.5 20 L 20.2 17.8 Z" fill="currentColor" />
        </>
      );
    case 'Rising Sun Path':
      return (
        <>
          <path
            d="M3 15 Q 7 12.5, 11 13.5 Q 15 14.5, 19 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="7" r="3" fill="currentColor" />
          <circle cx="11" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" className="opacity-40" />
          <path d="M18 17 L 20.5 19 L 19.2 16.8 Z" fill="currentColor" />
        </>
      );
    case 'Sunrise Journey':
      return (
        <>
          <path
            d="M4 16 Q 8 13, 12 14.5 Q 16 16, 20 19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="5" r="3.5" fill="currentColor" />
          <path
            d="M12 1 L 12 2.5 M 12 7.5 L 12 9 M 8.5 5 L 7 5 M 15.5 5 L 17 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-40"
          />
          <path d="M19 18 L 21.5 20 L 20.2 17.8 Z" fill="currentColor" />
        </>
      );
    case 'Plan to Execute':
      return (
        <>
          <rect x="4" y="6" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="9" y="9" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="14" y="12" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <path
            d="M8 8 L 11 11 M 13 13 L 16 16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M18 14 C 18 14, 19 15, 20 16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 15.5 L 21.5 17.5 L 20 15 Z" fill="currentColor" />
        </>
      );
    case 'Joyful Flow':
      return (
        <>
          <path
            d="M3 12 Q 5 10, 7 12 Q 9 14, 11 12 Q 13 10, 15 12 Q 17 14, 19 12 Q 21 10, 21 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="7" cy="12" r="1.2" fill="currentColor" className="opacity-80" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" className="opacity-80" />
          <circle cx="17" cy="12" r="1.2" fill="currentColor" className="opacity-80" />
          <path
            d="M7 10 Q 7 9, 8 9 Q 9 9, 9 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-70"
          />
          <path
            d="M12 10 Q 12 9, 13 9 Q 14 9, 14 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-70"
          />
          <path
            d="M17 10 Q 17 9, 18 9 Q 19 9, 19 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-70"
          />
          <path d="M19 11 L 21 9 L 20 12 Z" fill="currentColor" />
        </>
      );
    case 'Goal Achievement':
      return (
        <>
          <path
            d="M4 14 C 4 10, 7 8, 10 10 C 13 12, 14 14, 16 16 C 18 18, 19 20, 20 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <path
            d="M9 10 L 10.5 11.5 L 12 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 8 L 7 7 M 12 8 L 13 7 M 8 12 L 7 13 M 12 12 L 13 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-60"
          />
          <path d="M19 21 L 21.5 23 L 20.2 20.8 Z" fill="currentColor" />
        </>
      );
    case 'Positive Momentum':
      return (
        <>
          <path
            d="M6 18 L 8 14 L 10 10 L 12 6"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 16 L 10 12 L 12 8 L 14 4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" className="opacity-70" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" className="opacity-70" />
          <path
            d="M9 11 Q 9 10, 10 10 Q 11 10, 11 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-60"
          />
          <path
            d="M11 7 Q 11 6, 12 6 Q 13 6, 13 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            className="opacity-60"
          />
          <path d="M13 3 L 15 1 L 14 4 Z" fill="currentColor" />
        </>
      );
    case 'Flow Chart':
      return (
        <>
          <rect x="4" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="12" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="4" y="16" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <path
            d="M9 10.5 L 12 12.5 M 9 18.5 L 12 16.5 M 17 12.5 L 20 14.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M19 14 L 21.5 16 L 20 13.5 Z" fill="currentColor" />
          <circle cx="6.5" cy="10.5" r="1" fill="currentColor" className="opacity-50" />
          <circle cx="14.5" cy="12.5" r="1" fill="currentColor" className="opacity-50" />
        </>
      );
    case 'Happy Trail':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14 C 18 16, 19 18, 20 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="9" r="2" fill="currentColor" />
          <circle cx="13" cy="11" r="2" fill="currentColor" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
          <path
            d="M7 7 Q 7 6, 8 6 Q 9 6, 9 7 Q 9 8, 8 8 Q 7 8, 7 7"
            fill="currentColor"
            className="opacity-80"
          />
          <path
            d="M12 9 Q 12 8, 13 8 Q 14 8, 14 9 Q 14 10, 13 10 Q 12 10, 12 9"
            fill="currentColor"
            className="opacity-80"
          />
          <path
            d="M17 16 Q 17 15, 18 15 Q 19 15, 19 16 Q 19 17, 18 17 Q 17 17, 17 16"
            fill="currentColor"
            className="opacity-80"
          />
          <path d="M18 18 L 21 20 L 19.5 17.5 Z" fill="currentColor" />
        </>
      );
    case 'Execution Arrow':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 14 12, 16 14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M15 13.5 L 19 16 L 17 11.5 Z" fill="currentColor" />
          <rect x="6" y="9" width="3" height="3" rx="0.5" fill="currentColor" className="opacity-60" />
          <rect x="10" y="10" width="3" height="3" rx="0.5" fill="currentColor" className="opacity-60" />
          <path
            d="M7 10.5 L 8.5 10.5 M 11 11.5 L 12.5 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-80"
          />
        </>
      );
    case 'Plan Path':
      return (
        <>
          <path
            d="M4 14 C 4 10, 7 8, 10 10 C 13 12, 14 14, 16 16 C 18 18, 19 20, 20 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <path
            d="M7 11 L 8.5 12 L 10 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-70" />
          <circle cx="18" cy="20" r="1.5" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-50" />
          <path d="M19 21 L 21.5 23 L 20.2 20.8 Z" fill="currentColor" />
        </>
      );
    case 'Success Flow':
      return (
        <>
          <path
            d="M3 12 Q 5 10, 7 12 Q 9 14, 11 12 Q 13 10, 15 12 Q 17 14, 19 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7 10 L 8 12 L 7 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 10 L 12 12 L 11 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 10 L 16 12 L 15 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M18 11 L 20 9 L 19 12 Z" fill="currentColor" />
        </>
      );
    case 'Forward Arrow':
      return (
        <>
          <path
            d="M4 12 L 18 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M14 7 L 18 12 L 14 17"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" className="opacity-60" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" className="opacity-40" />
        </>
      );
    case 'Racing Forward':
      return (
        <>
          <path
            d="M3 14 L 7 10 L 11 14 L 15 10 L 19 14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 18 L 7 14 L 11 18 L 15 14 L 19 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          <path d="M18 12 L 21 9 L 20 15 Z" fill="currentColor" />
        </>
      );
    case 'Forward Motion':
      return (
        <>
          <path
            d="M4 12 C 4 8, 7 6, 10 8 C 13 10, 15 12, 17 14"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16 13 L 20 15 L 18 11 Z" fill="currentColor" />
          <path
            d="M6 10 L 8 12 L 6 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
          <path
            d="M11 11 L 13 13 L 11 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
        </>
      );
    case 'Advancing Steps':
      return (
        <>
          <path
            d="M4 18 L 6 16 L 8 18 L 10 16 L 12 18 L 14 16 L 16 18 L 18 16 L 20 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="5" y="17" width="2" height="1" rx="0.5" fill="currentColor" />
          <rect x="9" y="17" width="2" height="1" rx="0.5" fill="currentColor" />
          <rect x="13" y="17" width="2" height="1" rx="0.5" fill="currentColor" />
          <rect x="17" y="17" width="2" height="1" rx="0.5" fill="currentColor" />
          <path d="M19 16 L 21 14 L 20 17 Z" fill="currentColor" />
        </>
      );
    case 'Forward Thrust':
      return (
        <>
          <path
            d="M4 12 L 16 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M12 6 L 16 12 L 12 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 8 L 14 12 L 12 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="opacity-60"
          />
          <path d="M15 11 L 20 12 L 15 13 Z" fill="currentColor" />
        </>
      );
    case 'Moving Forward':
      return (
        <>
          <path
            d="M3 12 L 19 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M15 8 L 19 12 L 15 16"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="6" cy="12" r="1.5" fill="currentColor" className="opacity-70" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" className="opacity-50" />
          <circle cx="13" cy="12" r="1.5" fill="currentColor" className="opacity-30" />
        </>
      );
    case 'Forward Path':
      return (
        <>
          <path
            d="M4 12 C 4 10, 6 8, 8 10 C 10 12, 12 12, 14 12 C 16 12, 18 12, 20 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 11 L 21 12 L 19 13 Z" fill="currentColor" />
          <rect x="6" y="11" width="2" height="2" rx="0.5" fill="currentColor" className="opacity-50" />
          <rect x="10" y="11" width="2" height="2" rx="0.5" fill="currentColor" className="opacity-50" />
          <rect x="14" y="11" width="2" height="2" rx="0.5" fill="currentColor" className="opacity-50" />
        </>
      );
    case 'Forward Progress':
      return (
        <>
          <path
            d="M4 12 L 8 8 L 12 12 L 16 8 L 20 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 11 L 21 12 L 19 13 Z" fill="currentColor" />
          <circle cx="6" cy="10" r="1" fill="currentColor" className="opacity-60" />
          <circle cx="10" cy="10" r="1" fill="currentColor" className="opacity-60" />
          <circle cx="14" cy="10" r="1" fill="currentColor" className="opacity-60" />
        </>
      );
    case 'Forward Drive':
      return (
        <>
          <path
            d="M4 12 L 18 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M14 6 L 18 12 L 14 18"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6 10 L 8 12 L 6 14 M 10 10 L 12 12 L 10 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
        </>
      );
    case 'Forward Journey':
      return (
        <>
          <path
            d="M4 14 C 4 10, 7 8, 10 10 C 13 12, 14 14, 16 16 C 18 18, 19 20, 20 22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 21 L 21.5 23 L 20.2 20.8 Z" fill="currentColor" />
          <path
            d="M6 12 L 8 14 L 6 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
          <path
            d="M11 13 L 13 15 L 11 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          />
        </>
      );
    case 'Forward Arrow Stream':
      return (
        <>
          <path
            d="M3 10 L 17 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M3 14 L 17 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="opacity-70"
          />
          <path
            d="M3 18 L 17 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="opacity-50"
          />
          <path d="M15 9 L 19 10 L 15 11 Z" fill="currentColor" />
          <path d="M15 13 L 19 14 L 15 15 Z" fill="currentColor" className="opacity-70" />
          <path d="M15 17 L 19 18 L 15 19 Z" fill="currentColor" className="opacity-50" />
        </>
      );
    case 'Forward Momentum':
      return (
        <>
          <path
            d="M4 12 L 6 10 L 8 12 L 10 10 L 12 12 L 14 10 L 16 12 L 18 10 L 20 12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 11 L 21 12 L 19 13 Z" fill="currentColor" />
          <circle cx="5" cy="11" r="0.8" fill="currentColor" className="opacity-50" />
          <circle cx="9" cy="11" r="0.8" fill="currentColor" className="opacity-50" />
          <circle cx="13" cy="11" r="0.8" fill="currentColor" className="opacity-50" />
        </>
      );
    default:
      return defaultIcon;
  }
};

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ onColorPaletteClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);
  const { mode, setMode } = useTaskContext();
  
  // Get selected font from localStorage
  const getSelectedFont = () => {
    try {
      const stored = localStorage.getItem('logoFont');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Default to Marck Script if nothing stored
    }
    return { name: 'Marck Script', family: "'Marck Script', cursive", italic: false };
  };

  // Get selected icon from localStorage
  const getSelectedIcon = () => {
    try {
      const stored = localStorage.getItem('logoIcon');
      if (stored) {
        const iconData = JSON.parse(stored);
        return iconData.name;
      }
    } catch (e) {
      // Default to current icon
    }
    return null;
  };
  
  const selectedFont = getSelectedFont();
  const selectedIconName = getSelectedIcon();
  
  // Get selected palette or use default golden sunrise
  const palette = getPalette();
  const primaryColor = palette?.accentColors.primary || '#F59E0B';
  const secondaryColor = palette?.accentColors.secondary || '#F97316';
  const primaryLight = palette?.accentColors.primaryLight || '#FEF3C7';
  const primaryDark = palette?.accentColors.primaryDark || '#D97706';
  const borderColor = palette?.accentColors.border || 'rgba(245, 158, 11, 0.3)';
  const containerColors = palette?.containerColors || [
    '#F59E0B', '#F97316', '#EA580C', '#DC2626', '#B91C1C', '#C2410C'
  ];
  
  // Create gradient for logo icon badge
  const iconGradient = `linear-gradient(135deg, ${containerColors[0]} 0%, ${containerColors[1]} 25%, ${containerColors[2]} 50%, ${containerColors[3] || containerColors[1]} 75%, ${containerColors[4] || containerColors[2]} 100%)`;
  
  // Create text gradient (darker version for readability)
  const textGradient = `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 30%, ${secondaryColor} 60%, ${primaryDark} 100%)`;
  
  // Create accent line gradient
  const accentGradient = `linear-gradient(90deg, transparent 0%, ${containerColors[0]} 20%, ${containerColors[1]} 50%, ${containerColors[2]} 80%, transparent 100%)`;

  const modes: { value: Mode; label: string; icon: React.ReactNode }[] = [
    {
      value: 'create',
      label: 'Create Mode',
      icon: <FolderTree size={20} />,
    },
    {
      value: 'execution',
      label: 'Execution Mode',
      icon: <ListChecks size={20} />,
    },
  ];

  // Convert hex to rgba for shadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div 
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-md overflow-visible" 
      style={{ 
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: `0 4px 6px -1px ${hexToRgba(primaryColor, 0.1)}, 0 2px 4px -1px ${hexToRgba(primaryColor, 0.06)}`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 overflow-visible">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-visible">
          <div className="flex items-center flex-shrink-0 overflow-visible">
            <div className="flex items-center gap-4 group overflow-visible">
              {/* Icon badge - professional and sleek */}
              <div 
                className="relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 group-hover:scale-[1.02] flex-shrink-0"
                style={{
                  background: iconGradient,
                  boxShadow: `0 4px 12px -2px ${hexToRgba(primaryColor, 0.25)}, 0 0 0 1px rgba(255, 255, 255, 0.15) inset`,
                }}
              >
                {/* Selected icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white relative z-10"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))' }}
                >
                  {getIconSVG(selectedIconName)}
                </svg>
                
                {/* Subtle shine overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {/* Wordmark - enhanced typography */}
              <div className="relative overflow-visible" style={{ width: 'fit-content' }}>
                <h1 
                  className="text-2xl sm:text-[40px] font-display select-none leading-[1.0] whitespace-nowrap overflow-visible relative" 
                  style={{ 
                    paddingRight: '0.5rem', 
                    fontFamily: selectedFont.family, 
                    fontStyle: selectedFont.italic ? 'italic' : 'normal',
                    fontWeight: selectedFont.name === 'Amatic SC' ? 700 : 400,
                    background: textGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  }}
                >
                  Forth
                </h1>
                {/* Enhanced accent line with gradient */}
                <div 
                  className="absolute -bottom-1.5 left-0 rounded-full"
                  style={{ 
                    right: '0.5rem',
                    height: '3px',
                    background: accentGradient,
                    boxShadow: `0 2px 4px ${hexToRgba(primaryColor, 0.3)}`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="flex gap-2 p-1 rounded-lg w-full sm:w-auto"
              style={{
                backgroundColor: `${primaryLight}80`,
                border: `1px solid ${borderColor}`,
              }}
            >
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`
                    flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md font-medium text-sm flex-1 sm:flex-initial
                    transition-all duration-200
                    ${mode === m.value
                      ? 'bg-white shadow-md'
                      : ''
                    }
                  `}
                  style={mode === m.value
                    ? {
                        color: primaryDark,
                        border: `1px solid ${borderColor}`,
                      }
                    : {
                        color: `${primaryDark}CC`,
                      }
                  }
                  onMouseEnter={(e) => {
                    if (mode !== m.value) {
                      e.currentTarget.style.backgroundColor = `${primaryLight}80`;
                      e.currentTarget.style.color = primaryDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mode !== m.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = `${primaryDark}CC`;
                    }
                  }}
                >
                  {m.icon}
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.value === 'create' ? 'Create' : 'Execute'}</span>
                </button>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: `${primaryLight}80`,
                  border: `1px solid ${borderColor}`,
                  color: primaryDark,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryLight}CC`;
                  e.currentTarget.style.borderColor = primaryColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryLight}80`;
                  e.currentTarget.style.borderColor = borderColor;
                }}
                aria-label="User menu"
              >
                <User size={20} />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50"
                  style={{
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div 
                    className="px-4 py-2"
                    style={{
                      borderBottom: `1px solid ${primaryLight}`,
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-900">User Menu</p>
                    <p className="text-xs text-gray-500 mt-0.5">Coming soon: Login</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onColorPaletteClick) {
                        onColorPaletteClick();
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                    style={{
                      color: primaryDark,
                    }}
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
                    style={{
                      borderTop: `1px solid ${primaryLight}`,
                    }}
                  >
                    <button
                      disabled
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-not-allowed opacity-50"
                      style={{
                        color: `${primaryDark}80`,
                      }}
                    >
                      <User size={18} />
                      <span>Login (Coming Soon)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
