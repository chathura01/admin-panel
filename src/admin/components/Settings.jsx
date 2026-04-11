import React, { useState, useEffect } from 'react';
import { Box, H3, Text, Button, Input, Label, FormGroup, NoticeBox } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Fetch settings from our custom page handler
    api.getPage('Settings').then((response) => {
      if (response.data && response.data.settings) {
        setSettings(response.data.settings);
      }
    });
  }, []);

  const handleUpdate = (index, value) => {
    const newSettings = [...settings];
    newSettings[index].value = value;
    setSettings(newSettings);
  };

  const handleSave = () => {
    api.getPage('Settings', { method: 'post', data: { settings } })
      .then((res) => {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((err) => {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  return (
    <Box variant="white" padding="xl">
      <H3>General Settings</H3>
      <Text mb="xl">Manage the application's global key-value configuration below.</Text>

      {message && (
        <NoticeBox mb="xl" type={message.type}>
          {message.text}
        </NoticeBox>
      )}

      {settings.map((setting, index) => (
        <FormGroup key={setting.key}>
          <Label>{setting.key}</Label>
          <Input
            value={setting.value || ''}
            onChange={(e) => handleUpdate(index, e.target.value)}
          />
        </FormGroup>
      ))}

      <Button variant="primary" onClick={handleSave} mt="xl">
        Save Settings
      </Button>
    </Box>
  );
};

export default Settings;
