import React, { useState, useEffect } from 'react';
import { Box, H3, Text, Button, Input, Label, FormGroup, MessageBox } from '@adminjs/design-system';
import { ApiClient, useCurrentAdmin } from 'adminjs';

const api = new ApiClient();

const Settings = () => {
  const [currentAdmin] = useCurrentAdmin();
  const [settings, setSettings] = useState({ shopName: '', supportEmail: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Only fetch if admin
    if (currentAdmin && currentAdmin.role === 'admin') {
      fetch('/api/settings')
        .then(res => res.json())
        .then((data) => {
          setSettings(data);
        });
    }
  }, [currentAdmin]);

  const handleUpdate = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed');
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((err) => {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  // Safety fallback: if somehow a regular user gets here, show nothing or an error
  if (currentAdmin && currentAdmin.role !== 'admin') {
    return (
      <Box variant="white" padding="xl">
        <MessageBox variant="danger">
          Access Denied. You do not have permission to view this page.
        </MessageBox>
      </Box>
    );
  }

  return (
    <Box variant="white" padding="xl" style={{ borderRadius: '8px', maxWidth: '600px', margin: '20px auto' }}>
      <H3 mb="lg">Store Configuration</H3>
      <Text mb="xl" color="grey60">Manage your shop's identity and contact information.</Text>

      {message && (
        <MessageBox mb="xl" variant={message.type}>
          {message.text}
        </MessageBox>
      )}

      <FormGroup>
        <Label>Shop Name</Label>
        <Input
          value={settings.shopName || ''}
          onChange={(e) => handleUpdate('shopName', e.target.value)}
          placeholder="e.g. My Amazing Store"
        />
      </FormGroup>

      <FormGroup mt="xl">
        <Label>Support Email</Label>
        <Input
          value={settings.supportEmail || ''}
          onChange={(e) => handleUpdate('supportEmail', e.target.value)}
          placeholder="e.g. support@mystore.com"
        />
      </FormGroup>

      <Button variant="primary" onClick={handleSave} mt="xxl" style={{ width: '100%' }}>
        Save Settings
      </Button>
    </Box>
  );
};

export default Settings;
