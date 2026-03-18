// ThreeBackground.jsx
// Full-screen animated particle network using Three.js.
// Completely isolated from the rest of the UI.
// Mouse movement subtly shifts the camera.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT  = 160
const CONNECTION_DIST = 2.4

export default function ThreeBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Renderer ───────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x080c14, 1)
    el.appendChild(renderer.domElement)

    // ── Scene & Camera ─────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 12)

    // ── Particles ──────────────────────────────────────────────
    // Each particle has a position + individual drift behaviour
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     (Math.random() - 0.5) * 18,
      y:     (Math.random() - 0.5) * 12,
      z:     (Math.random() - 0.5) * 5,
      vx:    (Math.random() - 0.5) * 0.003,
      vy:    (Math.random() - 0.5) * 0.003,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
    }))

    // Dot mesh
    const dotGeo = new THREE.BufferGeometry()
    const dotPos = new Float32Array(PARTICLE_COUNT * 3)
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3))
    const dotMat = new THREE.PointsMaterial({
      color: 0x7c6aee, size: 0.06,
      transparent: true, opacity: 0.8,
      sizeAttenuation: true,
    })
    const dots = new THREE.Points(dotGeo, dotMat)
    scene.add(dots)

    // Line mesh — pre-allocate for max possible connections
    const maxLines = PARTICLE_COUNT * PARTICLE_COUNT
    const lineGeo  = new THREE.BufferGeometry()
    const linePos  = new Float32Array(maxLines * 6)
    const lineCol  = new Float32Array(maxLines * 6)
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(lineCol, 3))
    const lineMesh = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.4
      })
    )
    scene.add(lineMesh)

    // ── Mouse ──────────────────────────────────────────────────
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Two accent colours for lines ───────────────────────────
    const teal   = new THREE.Color(0x2dd4bf)
    const violet = new THREE.Color(0x7c3aed)

    // ── Animation loop ─────────────────────────────────────────
    let rafId, t = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.012

      // Move each particle
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]
        p.x += p.vx + Math.sin(t * p.speed + p.phase) * 0.0015
        p.y += p.vy + Math.cos(t * p.speed + p.phase * 1.3) * 0.0015

        // Mouse slightly pushes particles
        p.x += mouse.x * 0.002
        p.y -= mouse.y * 0.002

        // Wrap around edges
        if (p.x >  9.5) p.x = -9.5
        if (p.x < -9.5) p.x =  9.5
        if (p.y >  6.5) p.y = -6.5
        if (p.y < -6.5) p.y =  6.5

        dotPos[i * 3]     = p.x
        dotPos[i * 3 + 1] = p.y
        dotPos[i * 3 + 2] = p.z
      }
      dotGeo.attributes.position.needsUpdate = true

      // Draw lines between nearby particles
      let li = 0
      for (let a = 0; a < PARTICLE_COUNT; a++) {
        for (let b = a + 1; b < PARTICLE_COUNT; b++) {
          const pa = particles[a], pb = particles[b]
          const dx   = pa.x - pb.x
          const dy   = pa.y - pb.y
          const dz   = pa.z - pb.z
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)

          if (dist < CONNECTION_DIST) {
            // Fade line out as distance increases
            const alpha = 1 - dist / CONNECTION_DIST
            // Colour shifts from teal (close) to violet (far)
            const col = teal.clone().lerp(violet, dist / CONNECTION_DIST)

            linePos[li*6]   = pa.x; linePos[li*6+1] = pa.y; linePos[li*6+2] = pa.z
            linePos[li*6+3] = pb.x; linePos[li*6+4] = pb.y; linePos[li*6+5] = pb.z

            lineCol[li*6]   = col.r * alpha
            lineCol[li*6+1] = col.g * alpha
            lineCol[li*6+2] = col.b * alpha
            lineCol[li*6+3] = col.r * alpha
            lineCol[li*6+4] = col.g * alpha
            lineCol[li*6+5] = col.b * alpha

            li++
            if (li * 6 >= maxLines * 6 - 6) break
          }
        }
        if (li * 6 >= maxLines * 6 - 6) break
      }

      lineGeo.setDrawRange(0, li * 2)
      lineGeo.attributes.position.needsUpdate = true
      lineGeo.attributes.color.needsUpdate    = true

      // Camera drifts slowly + reacts to mouse
      camera.position.x = Math.sin(t * 0.04) * 0.4 + mouse.x * 0.3
      camera.position.y = Math.cos(t * 0.03) * 0.2 - mouse.y * 0.2
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    // ── Cleanup when component unmounts ────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      dotGeo.dispose()
      dotMat.dispose()
      lineGeo.dispose()
      lineMesh.material.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}