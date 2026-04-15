/**
 * Affective Trading — SplashScreen.jsx
 * Student: Dhruvi Soni · W1912163/3
 * 
 * 
 */

import { useState, useMemo }  from 'react';
import { useNavigate }        from 'react-router-dom';
import './Styles/Splashscreen.css'; // CSS for the splash screen animations and styles


function makeStars(n) {
  return Array.from({ length: n }, (_, i) => ({
    id:i,
    x:Math.random() * 100,
    y:Math.random() * 100,
    size:0.8 + Math.random() * 2,
    delay:Math.random() * 7,
    duration:2.5 + Math.random() * 3.5,
  }));
}

function makeSparkles(n) {
  // Only pale gold and white — soft, not colourful
  const colours = [
    'rgba(196,168,122,0.75)',
    'rgba(244,244,248,0.60)',
    'rgba(196,168,122,0.50)',
    'rgba(244,244,248,0.40)',
  ];
  return Array.from({ length: n }, (_, i) => ({
    id:i,
    angle:(360 / n) * i + Math.random() * (360 / n) * 0.5,
    distance:80 + Math.random() * 36,
    size:2 + Math.random() * 2.5,
    delay:Math.random() * 3.5,
    duration:2.2 + Math.random() * 2.5,
    colour:colours[i % colours.length],
  }));
}

export default function SplashScreen() {
  const navigate  = useNavigate();
  const [zooming, setZooming] = useState(false);

  const stars = useMemo(() => makeStars(40),[]);
  const sparkles = useMemo(() => makeSparkles(10), []);

  const handleBegin = () => {
    if (zooming) return;
    setZooming(true);
    setTimeout(() => navigate('/disclosure'), 880);
  };

  return (
    <div className="splash">
      <div className="splash_aurora splash_aurora--1" />
      <div className="splash_aurora splash_aurora--2" />
      {stars.map(s => (
        <div
          key={s.id}
          className="splash_star"
          style={{
            left:`${s.x}%`,
            top:`${s.y}%`,
            width:s.size,
            height:s.size,
            animation:`starTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <div className={`splash_content${zooming ? ' splash_content--expanding' : ''}`}>

        <p className="splash_eyebrow">W1912163 · 6COSC023W</p>

        <h1 className="splash_title">
          Affective<br />Trading
        </h1>

        <p className="splash_subtitle">An evaluation of stress &amp; decision</p>

        <div className="splash_btn-wrap">

          {sparkles.map(s => {
            const rad = (s.angle * Math.PI) / 180;
            return (
              <span
                key={s.id}
                className="splash_sparkle"
                style={{
                  left:`calc(50% + ${Math.cos(rad) * s.distance}px - ${s.size / 2}px)`,
                  top:`calc(50% + ${Math.sin(rad) * s.distance}px - ${s.size / 2}px)`,
                  width:s.size,
                  height:s.size,
                  background:s.colour,
                  boxShadow: `0 0 ${s.size * 2}px ${s.colour}`,
                  animation: `sparkleBreath ${s.duration}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            );
          })}
          <button className="splash_btn" onClick={handleBegin}>
            Begin
          </button>
        </div>

        <p className="splash_hint">click to enter</p>
      </div>
    </div>
  );
}