import React from 'react';
import { Navigate } from 'react-router-dom';

// InvoicingPage redirects to the quotes sub-page as the default tab
export const InvoicingPage = () => {
  return <Navigate to="/dashboard/invoicing/quotes" replace />;
};
