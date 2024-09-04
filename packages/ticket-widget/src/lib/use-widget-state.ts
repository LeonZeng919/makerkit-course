import { useContext } from 'react';

import { WidgetContext } from './context';

export function useWidgetState() {
  return useContext(WidgetContext);
}
