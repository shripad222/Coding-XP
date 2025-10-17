'use client';

import VitalsStepper from './VitalsStepper';

export default function VitalsPage() {
  return (
    <div className="outer-frame">
      <div style={{ maxWidth: 760, width: '100%', padding: 8 }}>
        <VitalsStepper />
      </div>
    </div>
  );
}
