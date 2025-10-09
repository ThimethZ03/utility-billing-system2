// components/Footer.jsx
import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>&copy; {new Date().getFullYear()} Smart Branch Utility Monitoring</span>
        <span className="footer__muted">Stay efficient, stay informed.</span>
      </div>
    </footer>
  );
}
