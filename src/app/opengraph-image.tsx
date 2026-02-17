import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'FreeConvertTool — Fast & Secure File Conversion';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#f8fafc', // Slate 50
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontFamily: 'sans-serif',
                    overflow: 'hidden',
                }}
            >
                {/* Background Grid */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        opacity: 0.5,
                    }}
                />

                {/* Abstract shapes */}
                <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 500,
                        height: 500,
                        background: '#3b82f6', // Blue 500
                        borderRadius: '50%',
                        opacity: 0.1,
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -100,
                        left: -100,
                        width: 500,
                        height: 500,
                        background: '#6366f1', // Indigo 500
                        borderRadius: '50%',
                        opacity: 0.1,
                        filter: 'blur(80px)',
                    }}
                />

                {/* Card Component Simulation */}
                <div
                    style={{
                        background: 'white',
                        borderRadius: 24,
                        padding: '60px 80px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10,
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <div style={{ display: 'flex', gap: 20, marginBottom: 30, alignItems: 'center' }}>
                        <div style={{ width: 60, height: 60, background: '#3b82f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32 }}>📄</div>
                        <div style={{ fontSize: 40, color: '#94a3b8' }}>→</div>
                        <div style={{ width: 60, height: 60, background: '#10b981', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 32 }}>jpg</div>
                    </div>

                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            color: '#1e293b',
                            letterSpacing: '-0.03em',
                            lineHeight: 1,
                            textAlign: 'center',
                        }}
                    >
                        FreeConvertTool
                    </div>
                    <div
                        style={{
                            fontSize: 28,
                            color: '#64748b',
                            marginTop: 15,
                            fontWeight: 500,
                        }}
                    >
                        Fast, Secure & Free Online Converter
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
