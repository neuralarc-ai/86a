import React from 'react';

export default function TokenUsageCard() {
  // Hardcoded for demo
  const percentUsed = 80;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 285,
        borderRadius: 24,
        border: '1px solid #FFFFFF0F',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        margin: '0 auto',
      }}
      className="shadow-sm"
    >
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 8 }}>
          Tokens Used
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.3 }}>
          Your team has used 80% of your credits. Need more?
        </div>
        <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#fff1', overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              width: `${percentUsed}%`,
              height: '60%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #FF522A 0%, #8E8EFF 100%)',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
      <button
        style={{
          width: '100%',
          minWidth: 100,
          maxWidth: 180,
          height: 36,
          borderRadius: 12,
          border: '1px solid #FFFFFF22',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: 'white',
          background: 'none',
          cursor: 'pointer',
          margin: '0 auto',
          whiteSpace: 'nowrap',
        }}
      >
        Add Neurones / Upgrade
        <span style={{ display: 'flex', alignItems: 'center', marginLeft: 6 }}>
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 14H21" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15.5 8.5L21 14L15.5 19.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
    </div>
  );
} 