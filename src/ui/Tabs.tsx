import { useId, type ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: string;
}

/** Controlled tabs. Render panel content yourself and wrap it in <TabPanel>. className hooks: .tabs .tabs__tab */
export function Tabs({ tabs, active, onChange }: { tabs: TabDef[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          className="tabs__tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <div role="tabpanel" id={id}>
      {children}
    </div>
  );
}
