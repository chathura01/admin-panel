import React from 'react';
import { Box, H3, H5, Text, Table, TableHead, TableRow, TableCell, TableBody, Badge } from '@adminjs/design-system';

const OrderShow = (props) => {
  const { record } = props;
  
  // Custom items list injected into record.params by the server handler
  const items = record?.params?.itemsList || [];

  if (!record) return <Text>Loading...</Text>;

  const status = record.params.status;
  const STATUS_COLORS = {
    pending:   'warning',
    paid:      'success',
    shipped:   'primary',
    delivered: 'info',
    cancelled: 'danger',
  };

  return (
    <Box variant="white" padding="xl" style={{ borderRadius: '8px' }}>
      <Box flex flexDirection="row" justifyContent="space-between" alignItems="center" mb="xl">
        <Box>
          <H3 mb="sm">Order Details: {record.params.id}</H3>
          <Text color="grey60">Placed on {new Date(record.params.createdAt).toLocaleString()}</Text>
        </Box>
        <Badge variant={STATUS_COLORS[status] || 'default'}>{status.toUpperCase()}</Badge>
      </Box>

      <Box flex flexDirection="row" mb="xl" style={{ gap: '24px' }}>
        <Box variant="grey" padding="lg" style={{ borderRadius: '8px', flex: 1 }}>
          <H5 mb="sm">Order Summary</H5>
          <Box flex flexDirection="row" justifyContent="space-between" mb="xs">
            <Text>Total Amount:</Text>
            <Text variant="lg" style={{ fontWeight: 600, color: '#28a745' }}>${Number(record.params.totalAmount).toFixed(2)}</Text>
          </Box>
          <Box flex flexDirection="row" justifyContent="space-between">
            <Text>Customer ID:</Text>
            <Text>{record.params.userId}</Text>
          </Box>
        </Box>
      </Box>

      <Box mt="xl">
        <H5 mb="lg">Products Included</H5>
        {(!items || items.length === 0) ? (
          <Box padding="lg" bg="grey" style={{ borderRadius: '8px' }}>
            <Text>No items found for this order.</Text>
            <Text size="sm" mt="sm" color="grey60">Debug Info: Record ID: {record.params.id}</Text>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell style={{ textAlign: 'right' }}>Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{item.productName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                  <TableCell style={{ textAlign: 'right', fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total</TableCell>
                <TableCell style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.2rem', color: '#28a745' }}>
                  ${Number(record.params.totalAmount).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default OrderShow;
