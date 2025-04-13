import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Pipeline } from '@/components/Pipeline';

export function PipelinePage() {
  return (
    <>
      <Helmet>
        <title>Pipeline Tracker | Sales Dashboard</title>
      </Helmet>
      <Pipeline />
    </>
  );
} 