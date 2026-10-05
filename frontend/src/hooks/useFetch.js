import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

/**
 * GETs `path` whenever it changes. Pass null to skip fetching.
 * Returns { data, loading, error, reload }.
 */
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: !!path, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));

    api
      .get(path)
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((err) => !cancelled && setState({ data: null, loading: false, error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
