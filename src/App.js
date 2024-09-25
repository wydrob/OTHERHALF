import logo from './logo.svg';
import './App.css';
import CountdownTimer from './CountdownTimer';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    // Disable zoom with keyboard (Ctrl + / Ctrl -) and touchpad
    const preventZoom = (e) => {
      if (e.ctrlKey || e.metaKey || e.key === 'Control' || e.type === 'wheel') {
        e.preventDefault();
      }
    };

    // Disable pinch zoom on touch devices
    const preventPinchZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('wheel', preventZoom, { passive: false });
    window.addEventListener('keydown', preventZoom, { passive: false });
    window.addEventListener('gesturestart', preventPinchZoom, { passive: false });
    window.addEventListener('gesturechange', preventPinchZoom, { passive: false });

    return () => {
      // Cleanup event listeners
      window.removeEventListener('wheel', preventZoom);
      window.removeEventListener('keydown', preventZoom);
      window.removeEventListener('gesturestart', preventPinchZoom);
      window.removeEventListener('gesturechange', preventPinchZoom);
    };
  }, []);

  return (
    <div className="App">
      <CountdownTimer/>
    </div>
  );
}

export default App;
