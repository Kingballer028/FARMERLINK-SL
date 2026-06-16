import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';

export default function FarmerDeliveredScreen() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      const delivered = all.filter(order =>
        order.status === 'Delivered' &&
        order.items?.some((item: any) => item.farmerId === user?.id)
      );
      setOrders(delivered);
      setLoading(false);
    }, err => {
      console.error('Farmer delivered error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const renderItem = ({ item }: any) => {
    const myItems = item.items?.filter((i: any) => i.farmerId === user?.id) || [];
    const myRevenue = myItems.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);

    return (
      <View style={styles.orderCard}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="checkmark-done-circle" size={20} color="#2e7d32" style={{ marginRight: 6 }} />
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.status}>DELIVERED</Text>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <Ionicons name="person-circle-outline" size={40} color="#666" />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.buyerEmail}</Text>
              <Text style={styles.customerDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#e53935" />
            <Text style={styles.addressText}>{item.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsLabel}>Delivered Items:</Text>
          {myItems.map((p: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: '#2e7d32' }]} />
              <Text style={styles.itemName}>{p.name} <Text style={styles.itemQty}>x{p.quantity}</Text></Text>
              <Text style={styles.itemPrice}>Le {(p.price * p.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <View style={styles.footerRow}>
          <Text style={styles.revenueLabel}>Revenue Earned</Text>
          <Text style={styles.revenueValue}>Le {myRevenue.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 80 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No delivered orders yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%', maxWidth: 800, alignSelf: 'center' },
  list: { padding: 12 },
  orderCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  statusBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  status: { fontWeight: 'bold', fontSize: 12, color: '#2e7d32' },
  customerCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 16 },
  customerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customerInfo: { flex: 1, marginLeft: 10 },
  customerName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  customerDate: { fontSize: 12, color: '#888', marginTop: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 8 },
  addressText: { fontSize: 13, color: '#555', marginLeft: 6, flex: 1 },
  itemsSection: { marginBottom: 10 },
  itemsLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f57c00', marginRight: 8 },
  itemName: { fontSize: 14, color: '#444', flex: 1 },
  itemQty: { fontWeight: 'bold', color: '#1a1a1a' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#2e7d32' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueLabel: { fontSize: 14, color: '#666' },
  revenueValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
});
