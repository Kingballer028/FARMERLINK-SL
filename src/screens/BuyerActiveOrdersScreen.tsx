import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';

export default function BuyerActiveOrdersScreen() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      // Only show Active (Processing or Delivering) orders
      const activeItems = items.filter(o => o.status !== 'Delivered');
      setOrders(activeItems);
      setLoading(false);
    }, (err) => {
      console.error('Active orders error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'Delivered' });
    } catch (e: any) {
      alert('Error confirming delivery: ' + e.message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Delivered') return '#2e7d32';
    if (status === 'Delivering') return '#1976D2';
    if (status === 'Processing') return '#f57c00';
    return '#666';
  };

  const renderTimeline = (status: string) => {
    const steps = ['Processing', 'Delivering', 'Delivered'];
    const currentIndex = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0;

    return (
      <View style={styles.timelineContainer}>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isPast = index < currentIndex;
          return (
            <View key={step} style={styles.timelineStepContainer}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineDot, isActive && styles.timelineDotActive]}>
                  {isPast && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                {index < steps.length - 1 && (
                  <View style={[styles.timelineLine, isPast && styles.timelineLineActive]} />
                )}
              </View>
              <Text style={[styles.timelineText, isActive && styles.timelineTextActive]}>{step}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: any) => (
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

      {renderTimeline(item.status)}

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.address}>{item.deliveryAddress}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="card-outline" size={16} color="#666" />
        <Text style={styles.payment}>Paid via {item.paymentMethod || 'Cash'}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items?.map((p: any, i: number) => (
          <View key={i} style={styles.itemRow}>
            <Image source={{ uri: p.image || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=100' }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{p.name}</Text>
              <Text style={styles.itemQty}>Qty: {p.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>Le {(p.price * p.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.total}>Le {(item.total || 0).toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 80 }} />;
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
            <Text style={styles.emptyText}>No active orders.</Text>
            <Text style={styles.emptySubText}>Your processing and delivering orders will appear here.</Text>
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
  timelineContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  timelineStepContainer: { alignItems: 'center', flex: 1 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  timelineDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  timelineDotActive: { backgroundColor: '#2e7d32' },
  timelineLine: { flex: 1, height: 2, backgroundColor: '#e0e0e0', marginLeft: -2, zIndex: 1 },
  timelineLineActive: { backgroundColor: '#2e7d32' },
  timelineText: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' },
  timelineTextActive: { color: '#2e7d32', fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 13, color: '#666', marginLeft: 6 },
  address: { fontSize: 13, color: '#666', marginLeft: 6 },
  payment: { fontSize: 13, color: '#1976D2', fontWeight: 'bold', marginLeft: 6 },
  itemsContainer: { marginTop: 12, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemImage: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemQty: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#666' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#aaa', marginTop: 6, textAlign: 'center' },
});
