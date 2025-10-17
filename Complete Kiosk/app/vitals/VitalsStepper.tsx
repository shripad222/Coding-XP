'use client';

import { useVitals } from './VitalsContext';
import Introduction from './steps/Introduction';
import Measure from './steps/Measure';
import Results from './steps/Results';

export default function VitalsStepper() {
  const { step } = useVitals();

  return (
    <div>
      {step === 0 && <Introduction />}
      {step > 0 && step <= 5 && <Measure />}
      {step === 6 && <Results />}
    </div>
  );
}
