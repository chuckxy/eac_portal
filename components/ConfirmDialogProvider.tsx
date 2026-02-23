'use client';
import React from 'react';
import { ConfirmDialog } from 'primereact/confirmdialog';

/**
 * Drop this once at the layout level so any page can call confirmDialog().
 * Usage: import { confirmDialog } from 'primereact/confirmdialog'; then call confirmDialog({...}).
 */
const ConfirmDialogProvider = () => {
    return <ConfirmDialog />;
};

export default ConfirmDialogProvider;
