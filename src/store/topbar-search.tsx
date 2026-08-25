import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from 'react';

type SearchConfig = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
} | null;

const TopbarSearchContext = createContext<{
  config: SearchConfig;
  setConfig: (c: SearchConfig) => void;
} | null>(null);

export function TopbarSearchProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SearchConfig>(null);
  return (
    <TopbarSearchContext.Provider value={{ config, setConfig }}>
      {children}
    </TopbarSearchContext.Provider>
  );
}

export function useTopbarSearchSlot() {
  const ctx = useContext(TopbarSearchContext);
  if (!ctx)
    throw new Error(
      'useTopbarSearchSlot must be used within TopbarSearchProvider',
    );
  return ctx;
}

// Pages call this to make the Topbar search box act on their own list.
// Registers on mount/when value or placeholder changes, clears on unmount
// so navigating to a page without search shows the empty state.
export function usePageSearch(
  placeholder: string,
  value: string,
  onChange: (value: string) => void,
) {
  const { setConfig } = useTopbarSearchSlot();

  const handleChange = useEffectEvent(onChange);

  useEffect(() => {
    setConfig({
      placeholder,
      value,
      onChange: handleChange,
    });

    return () => setConfig(null);
  }, [placeholder, value, setConfig]);
}
