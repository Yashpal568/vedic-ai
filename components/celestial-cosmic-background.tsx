"use client";

import React from "react";

export default function CelestialCosmicBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top golden celestial aura */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(229,184,75,0.09),transparent_70%)] blur-3xl" />
      
      {/* Cosmic violet nebular aura */}
      <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.07),transparent_70%)] blur-3xl" />
      
      {/* Deep indigo aura at bottom-left */}
      <div className="absolute bottom-1/4 -left-40 w-[450px] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)] blur-3xl" />
    </div>
  );
}
