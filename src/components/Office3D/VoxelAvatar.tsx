'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import type { Group, MeshStandardMaterial } from 'three';
import type { AgentConfig } from './agentsConfig';

interface VoxelAvatarProps {
  agent: AgentConfig;
  position: [number, number, number];
  isWorking?: boolean;
  isThinking?: boolean;
  isError?: boolean;
  isQueued?: boolean;
  isOffline?: boolean;
}

// Status label text
function statusLabel(
  isWorking: boolean,
  isThinking: boolean,
  isError: boolean,
  isQueued: boolean,
  isOffline: boolean,
): string {
  if (isWorking) return 'WORKING';
  if (isThinking) return 'THINKING';
  if (isError) return 'ERROR';
  if (isQueued) return 'QUEUED';
  if (isOffline) return 'OFFLINE';
  return 'IDLE';
}

// Status label color (matches glow color)
function statusLabelColor(
  isWorking: boolean,
  isThinking: boolean,
  isError: boolean,
  isQueued: boolean,
  isOffline: boolean,
): string {
  if (isWorking) return '#32D74B';   // green
  if (isThinking) return '#0A84FF';  // blue
  if (isError) return '#FF453A';     // red
  if (isQueued) return '#FFD60A';    // yellow
  if (isOffline) return '#8E8E93';   // gray
  return '#8E8E93';                  // idle — gray
}

export default function VoxelAvatar({
  agent,
  position,
  isWorking = false,
  isThinking = false,
  isError = false,
  isQueued = false,
  isOffline = false,
}: VoxelAvatarProps) {
  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyMaterialRef = useRef<MeshStandardMaterial>(null);

  // Animations
  useFrame((state) => {
    if (!groupRef.current) return;

    // Working: typing animation (arms moving)
    if (isWorking && leftArmRef.current && rightArmRef.current) {
      const time = state.clock.elapsedTime * 3;
      leftArmRef.current.rotation.x = Math.sin(time) * 0.3;
      rightArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.3;
    }

    // Thinking: head bobbing
    if (isThinking && headRef.current) {
      headRef.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Error: shake head
    if (isError && headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.15;
    }

    // Error: pulsing red glow on body
    if (isError && bodyMaterialRef.current) {
      bodyMaterialRef.current.emissiveIntensity =
        0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.3;
    }

    // Queued: gentle float
    if (isQueued) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
    }

    // Idle breathing (only when none of the active states apply)
    if (!isWorking && !isThinking && !isError && !isQueued && !isOffline) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.01;
    }
  });

  // Body glow color based on state
  const getBodyEmissive = (): string => {
    if (isWorking) return '#22c55e';   // green
    if (isThinking) return '#3b82f6'; // blue
    if (isError) return '#ef4444';    // red
    if (isQueued) return '#FFD60A';   // yellow
    return '#000000';                 // no glow
  };

  const getBodyEmissiveIntensity = (): number => {
    if (isWorking) return 0.3;
    if (isThinking) return 0.3;
    if (isError) return 0.2; // dynamically updated by useFrame
    if (isQueued) return 0.2;
    return 0;
  };

  const label = statusLabel(isWorking, isThinking, isError, isQueued, isOffline);
  const labelColor = statusLabelColor(isWorking, isThinking, isError, isQueued, isOffline);

  // Offline: gray body, dimmed
  const skinColor = isOffline ? '#9CA3AF' : '#ffa07a';
  const shirtColor = isOffline ? '#4B5563' : agent.color;
  const pantsColor = isOffline ? '#374151' : '#4a5568';
  const bodyOpacity = isOffline ? 0.5 : 1.0;

  return (
    <group ref={groupRef} position={position}>
      {/* Status bubble above head */}
      <Text
        position={[0, 0.72, 0]}
        fontSize={0.06}
        color={labelColor}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* HEAD */}
      <group ref={headRef} position={[0, 0.35, 0]}>
        {/* Head cube */}
        <Box args={[0.2, 0.2, 0.2]} castShadow>
          <meshStandardMaterial color={skinColor} transparent opacity={bodyOpacity} />
        </Box>

        {/* Eyes */}
        <Box args={[0.04, 0.04, 0.02]} position={[-0.05, 0.02, 0.11]} castShadow>
          <meshStandardMaterial color={isOffline ? '#6B7280' : '#1f2937'} transparent opacity={bodyOpacity} />
        </Box>
        <Box args={[0.04, 0.04, 0.02]} position={[0.05, 0.02, 0.11]} castShadow>
          <meshStandardMaterial color={isOffline ? '#6B7280' : '#1f2937'} transparent opacity={bodyOpacity} />
        </Box>

        {/* Mouth (smile or frown based on status) */}
        {!isError && !isOffline && (
          <Box args={[0.08, 0.02, 0.01]} position={[0, -0.04, 0.11]} castShadow>
            <meshStandardMaterial color="#000000" />
          </Box>
        )}
        {isError && (
          <Box args={[0.08, 0.02, 0.01]} position={[0, -0.06, 0.11]} rotation={[0, 0, Math.PI]} castShadow>
            <meshStandardMaterial color="#ef4444" />
          </Box>
        )}
        {isOffline && (
          <Box args={[0.08, 0.02, 0.01]} position={[0, -0.05, 0.11]} castShadow>
            <meshStandardMaterial color="#6B7280" transparent opacity={0.5} />
          </Box>
        )}

        {/* Emoji badge on forehead */}
        <Text
          position={[0, 0.08, 0.11]}
          fontSize={0.08}
          color={isOffline ? '#9CA3AF' : 'white'}
          anchorX="center"
          anchorY="middle"
        >
          {agent.emoji}
        </Text>

        {/* Thinking particles effect */}
        {isThinking && (
          <>
            <mesh position={[-0.15, 0.15, 0]}>
              <sphereGeometry args={[0.02]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
            </mesh>
            <mesh position={[-0.18, 0.2, 0]}>
              <sphereGeometry args={[0.03]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
            </mesh>
            <mesh position={[-0.22, 0.26, 0]}>
              <sphereGeometry args={[0.04]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
            </mesh>
          </>
        )}
      </group>

      {/* BODY */}
      <Box args={[0.2, 0.25, 0.12]} position={[0, 0.125, 0]} castShadow>
        <meshStandardMaterial
          ref={bodyMaterialRef}
          color={shirtColor}
          emissive={getBodyEmissive()}
          emissiveIntensity={getBodyEmissiveIntensity()}
          transparent
          opacity={bodyOpacity}
        />
      </Box>

      {/* ARMS */}
      <group ref={leftArmRef} position={[-0.12, 0.18, 0]}>
        <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color={shirtColor} transparent opacity={bodyOpacity} />
        </Box>
        {/* Hand */}
        <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
          <meshStandardMaterial color={skinColor} transparent opacity={bodyOpacity} />
        </Box>
      </group>

      <group ref={rightArmRef} position={[0.12, 0.18, 0]}>
        <Box args={[0.08, 0.2, 0.08]} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color={shirtColor} transparent opacity={bodyOpacity} />
        </Box>
        {/* Hand */}
        <Box args={[0.08, 0.06, 0.08]} position={[0, -0.23, 0]} castShadow>
          <meshStandardMaterial color={skinColor} transparent opacity={bodyOpacity} />
        </Box>
      </group>

      {/* LEGS */}
      <Box args={[0.09, 0.18, 0.09]} position={[-0.05, -0.09, 0]} castShadow>
        <meshStandardMaterial color={pantsColor} transparent opacity={bodyOpacity} />
      </Box>
      <Box args={[0.09, 0.18, 0.09]} position={[0.05, -0.09, 0]} castShadow>
        <meshStandardMaterial color={pantsColor} transparent opacity={bodyOpacity} />
      </Box>

      {/* SHOES */}
      <Box args={[0.09, 0.04, 0.12]} position={[-0.05, -0.2, 0.015]} castShadow>
        <meshStandardMaterial color={isOffline ? '#374151' : '#1f2937'} transparent opacity={bodyOpacity} />
      </Box>
      <Box args={[0.09, 0.04, 0.12]} position={[0.05, -0.2, 0.015]} castShadow>
        <meshStandardMaterial color={isOffline ? '#374151' : '#1f2937'} transparent opacity={bodyOpacity} />
      </Box>

      {/* Error particles (sparks) */}
      {isError && (
        <>
          <mesh position={[0.15, 0.3, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-0.15, 0.25, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </>
      )}

      {/* Queued: pulsing yellow ring at feet */}
      {isQueued && (
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial color="#FFD60A" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
