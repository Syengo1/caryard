import { ImageResponse } from 'next/og'; export default function Image() { return new ImageResponse(<div style={{ fontSize: 40 }}>Car Yard</div>, { width: 1200, height: 630 }); }
