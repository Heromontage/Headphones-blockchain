'use client';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO, MeshTransmissionMaterial, Text } from '@react-three/drei';
import { easing } from 'maath';

function ModeWrapper({
  text,
  htmlCanvasRef,
  modeProps = {},
}) {
  const ref = useRef<THREE.Mesh>(null);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const [canvasTex, setCanvasTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (htmlCanvasRef?.current) {
      const tex = new THREE.CanvasTexture(htmlCanvasRef.current);
      tex.minFilter = THREE.LinearFilter;
      setCanvasTex(tex);
    }
  }, [htmlCanvasRef]);

  useFrame((state, delta) => {
    if (canvasTex && htmlCanvasRef?.current) {
      canvasTex.needsUpdate = true;
    }

    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    const destX = (pointer.x * v.width) / 2;
    const destY = (pointer.y * v.height) / 2;
    
    if (ref.current) {
      easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);
      easing.damp3(ref.current.rotation, [Math.PI / 2 + pointer.y * 0.2, pointer.x * 0.2, 0], 0.15, delta);
    }

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    gl.setClearColor(0x000000, 0); 
  });

  const { scale, ior, thickness, chromaticAberration } = modeProps;

  return (
    <>
      {createPortal(
        <>
          {text && (
            <Text
              position={[0, 0, 0]}
              fontSize={vp.width * 0.12}
              color="#c87941"
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
            >
              {text}
            </Text>
          )}
          {canvasTex && (
            <mesh scale={[vp.width, vp.height, 1]}>
              <planeGeometry />
              <meshBasicMaterial map={canvasTex} />
            </mesh>
          )}
        </>,
        scene
      )}

      {/* Render text in main scene too so it's visible outside the lens */}
      {text && (
        <Text
          position={[0, 0, 0]}
          fontSize={vp.width * 0.12}
          color="#c87941"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
        >
          {text}
        </Text>
      )}

      <mesh ref={ref} scale={scale ?? 2}>
        <cylinderGeometry args={[1, 1, 0.1, 64]} />
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 5}
          chromaticAberration={chromaticAberration ?? 0.1}
          transmission={1}
          transparent={true}
          roughness={0}
          clearcoat={1}
        />
      </mesh>
    </>
  );
}

export default function FluidGlass({ text, htmlCanvasRef, lensProps = {} }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 20], fov: 15 }} 
        gl={{ alpha: true, antialias: true }} 
        style={{ pointerEvents: 'none', background: 'transparent' }}
        eventSource={typeof window !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <ambientLight intensity={1.5} />
        <ModeWrapper text={text} htmlCanvasRef={htmlCanvasRef} modeProps={lensProps} />
      </Canvas>
    </div>
  );
}
