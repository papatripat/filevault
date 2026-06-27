import { useEffect, useRef, useState } from 'react';

export default function StatCard({ icon: Icon, value, label, prefix = '', suffix = '' }) {
  const [displayVal, setDisplayVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (num === 0) { setDisplayVal(0); return; }
    const duration = 800;
    const start = performance.now();
    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.floor(eased * num));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="stat-card" ref={ref}>
      <div className="stat-card-icon">
        <Icon size={20} />
      </div>
      <div className="stat-card-value">{prefix}{displayVal.toLocaleString()}{suffix}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
