import React, { useState, useEffect } from 'react';
import { Box, H2, H5, Text, Illustration, Button } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const Dashboard = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    // We can fetch custom stats from a handler, but for now we'll do static UI logic
    api.getDashboard().then((response) => {
      setData(response.data || {});
    });
  }, []);

  // Use the window.AdminJS context to check current user role
  const currentUser = window.AdminJS?.currentUser || {};
  const isAdmin = currentUser.role === 'admin';

  return (
    <Box variant="grey">
      <Box variant="white" mt="xl" padding="xl">
        <H2>Welcome, {currentUser.name || 'User'}!</H2>
        <Text>This is your personalized dashboard.</Text>
      </Box>

      {isAdmin ? (
        <Box flex flexDirection="row" mt="xl" style={{ gap: '20px' }}>
          <Box variant="white" padding="xl" flexGrow={1}>
            <H5>System Summary</H5>
            <Text mt="lg">You have full access to manage Users, Products, Orders, and Settings.</Text>
            <Button mt="lg" as="a" href="/admin/resources/User">Manage Users</Button>
          </Box>
          <Box variant="white" padding="xl" flexGrow={1}>
            <H5>Quick Stats</H5>
            <Text>Check out the latest orders and settings configurations using the sidebar menu.</Text>
          </Box>
        </Box>
      ) : (
        <Box variant="white" mt="xl" padding="xl">
          <H5>Limited Dashboard</H5>
          <Text mt="lg">Welcome to the regular user view. You can view products and your own orders here, but administrative options are hidden.</Text>
          <Illustration variant="Rocket" mt="xl" />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
