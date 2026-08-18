"use client";
import { Stats } from "@react-three/drei";

export default function PerformanceStats() {
  if (process.env.NODE_ENV === "development") {
    return <Stats showPanel={0} />;
  }
  return null;
}
