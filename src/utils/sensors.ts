import type { PointerEvent } from 'react';
import { PointerSensor, type PointerSensorOptions } from '@dnd-kit/core';

const INTERACTIVE_TAGS = ['button', 'input', 'textarea', 'select', 'option'];

function isInteractiveElement(element: Element | null): boolean {
  let cur: Element | null = element;
  while (cur) {
    if (cur instanceof HTMLElement && cur.dataset?.noDnd) return true;
    if (cur?.tagName && INTERACTIVE_TAGS.includes(cur.tagName.toLowerCase())) return true;
    cur = cur.parentElement;
  }
  return false;
}

/**
 * PointerSensor that does NOT activate when the pointer down target is a button,
 * input, or element with data-no-dnd. Prevents double-click needed for buttons inside sortables.
 */
export class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (
        reactEvent: PointerEvent,
        _options: PointerSensorOptions
      ): boolean => {
        const { isPrimary, button } = reactEvent.nativeEvent;
        if (!isPrimary || button !== 0) return false;
        if (isInteractiveElement(reactEvent.target as Element)) return false;
        return true;
      },
    },
  ];
}
