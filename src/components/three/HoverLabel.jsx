import { Html } from '@react-three/drei'

/** Tooltip mono/âmbar usado pelos hotspots da cena. */
export function HoverLabel({ position, text }) {
  return (
    <Html position={position} center>
      <div
        style={{
          whiteSpace: 'nowrap',
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          color: '#f5a623',
          borderRadius: '2px',
          border: '1px solid rgba(245,166,35,0.3)',
        }}
      >
        {text}
      </div>
    </Html>
  )
}
