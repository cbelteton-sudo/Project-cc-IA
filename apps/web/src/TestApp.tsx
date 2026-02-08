import React from 'react';

export default function TestApp() {
    return (
        <div style={{ padding: 50, backgroundColor: '#dcfce7', color: '#166534', fontFamily: 'sans-serif' }}>
            <h1>✅ SYSTEM RECOVERY MODE</h1>
            <p>The build pipeline is functional.</p>
            <p>If you see this, the "White Screen" is caused by a crash within the App's Context Providers (Auth, Network, etc).</p>
            <button onClick={() => window.location.reload()} style={{ padding: 10, marginTop: 20 }}>Reload</button>
        </div>
    );
}
