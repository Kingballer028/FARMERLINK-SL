import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';

export default function FarmerOrdersScreen() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all orders, then filter by those that contain this farmer's products
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      // Show active orders that contain at least one product by this farmer
      const activeMine = all.filter(order =>
        order.status !== 'Delivered' &&
        order.items?.some((item: any) => item.farmerId === user?.id)
      );
      setOrders(activeMine);
      setLoading(false);
    }, err => {
      console.error('Farmer orders error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    // Treat 'Delivering' the same as 'Processing' to handle any stuck orders
    const nextStatus = (currentStatus === 'Processing' || currentStatus === 'Delivering') ? 'Delivered' : 'Processing';

    try {
      await updateDoc(doc(db, 'orders', orderId), { status: nextStatus });
    } catch (e: any) {
      alert('Error updating status: ' + e.message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Delivered') return '#2e7d32';
    if (status === 'Delivering') return '#1976D2';
    if (status === 'Processing') return '#f57c00';
    return '#666';
  };

  const renderItem = ({ item }: any) => {
    // Only show items from this farmer
    const myItems = item.items?.filter((i: any) => i.farmerId === user?.id) || [];
    const myRevenue = myItems.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);

    return (
      <View style={styles.orderCard}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="receipt-outline" size={20} color="#2e7d32" style={{ marginRight: 6 }} />
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <Ionicons name="person-circle-outline" size={40} color="#666" />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.buyerEmail}</Text>
              <Text style={styles.customerDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${item.phoneNumber || ''}`)}>
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1976D2' }]} onPress={() => Linking.openURL(`mailto:${item.buyerEmail}`)}>
                <Ionicons name="mail" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#e53935" />
            <Text style={styles.addressText}>{item.deliveryAddress}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsLabel}>Items to Fulfill:</Text>
          {myItems.map((p: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemName}>{p.name} <Text style={styles.itemQty}>x{p.quantity}</Text></Text>
              <Text style={styles.itemPrice}>Le {(p.price * p.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.revenueLabel}>Your Revenue</Text>
            <Text style={styles.revenueValue}>Le {myRevenue.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              (item.status === 'Processing' || item.status === 'Delivering') ? styles.btnToDelivered : styles.btnToProcessing,
            ]}
            onPress={() => handleUpdateStatus(item.id, item.status)}
          >
            <Ionicons 
              name={(item.status === 'Processing' || item.status === 'Delivering') ? "checkmark-circle" : "arrow-undo"} 
              size={18} 
              color={(item.status === 'Processing' || item.status === 'Delivering') ? "#2e7d32" : "#f57c00"} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.actionText, { color: (item.status === 'Processing' || item.status === 'Delivering') ? '#2e7d32' : '#f57c00' }]}>
              {(item.status === 'Processing' || item.status === 'Delivering') ? 'Mark Delivered' : 'Mark Processing'}
            </Text>
          </TouchableOpacity>
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
            <Text style={styles.emptyText}>No incoming orders yet.</Text>
            <Text style={styles.emptySubText}>Orders from buyers will appear here.</Text>
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
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  status: { fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  customerCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 16 },
  customerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customerInfo: { flex: 1, marginLeft: 10 },
  customerName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  customerDate: { fontSize: 12, color: '#888', marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
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
  revenueLabel: { fontSize: 12, color: '#666' },
  revenueValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  actionBtn: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
  },
  btnToDelivered: { backgroundColor: '#e8f5e9' },
  btnToProcessing: { backgroundColor: '#fff3e0' },
  actionText: { fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#aaa', marginTop: 6 },
});
