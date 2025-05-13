"use client";
import { useEffect } from 'react';

export default function NoFlash() {
  useEffect(() => {
    // 防止 FOUC
    document.documentElement.style.visibility = 'visible';
  }, []);
  
  return null;
}