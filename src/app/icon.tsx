import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
    width: 48,
    height: 48,
};
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: 28,
                    fontWeight: 900,
                }}
            >
                ⇌
            </div>
        ),
        {
            ...size,
        }
    );
}
