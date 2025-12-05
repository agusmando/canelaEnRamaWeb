// ...existing code...
'use client';
import React, { useEffect } from 'react';
import '../styles/globals.css';
import SuperTokens from 'supertokens-auth-react';
import { SuperTokensConfig } from '../config/config';

export default function Page() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      SuperTokens.init(SuperTokensConfig);
    }
  }, []);

  return (
    <main>
      <h1>Canela en Rama</h1>
      <p>Página inicial</p>
    </main>
  );
}
// ...existing code...