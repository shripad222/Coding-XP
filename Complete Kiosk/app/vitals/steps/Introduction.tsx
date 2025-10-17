'use client';

import { useVitals } from '../VitalsContext';

export default function Introduction() {
  const { startMeasurement } = useVitals();

  return (
    <div className="text-center p-10">
      <h2 className="text-2xl font-bold mb-4">Choose from below options :</h2>
      {/* <button
        onClick={startMeasurement}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Start
      </button> */}
    </div>
  );
}
