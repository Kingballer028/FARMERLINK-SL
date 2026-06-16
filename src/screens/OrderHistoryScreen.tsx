import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function OrderHistoryScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
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
      // Only show Delivered (History) orders
      const deliveredItems = items.filter(o => o.status === 'Delivered');
      setOrders(deliveredItems);
      setLoading(false);
    }, (err) => {
      console.error('Order history error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    if (status === 'Delivered') return '#2e7d32';
    if (status === 'Delivering') return '#1976D2';
    if (status === 'Processing') return '#f57c00';
    return '#666';
  };
  const handleReorder = (items: any[]) => {
    items.forEach(item => {
      addToCart(item, item.quantity || 1);
    });
    Alert.alert('Added to Cart', 'Items from this order have been added to your cart.');
    navigation.navigate('Cart');
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="checkmark-circle" size={20} color="#2e7d32" style={{ marginRight: 6 }} />
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.status}>DELIVERED</Text>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.total}>Le {(item.total || 0).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item.items)}>
          <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.reorderText}>Re-order</Text>
        </TouchableOpacity>
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
            <Text style={styles.emptyText}>No order history yet.</Text>
            <Text style={styles.emptySubText}>Your delivered orders will appear here!</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  statusBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  status: { fontWeight: 'bold', fontSize: 12, color: '#2e7d32' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  date: { fontSize: 13, color: '#666', marginLeft: 6 },
  itemsContainer: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemImage: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemQty: { fontSize: 12, color: '#888' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, color: '#666' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  reorderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f57c00', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  reorderText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#aaa', marginTop: 6 },
});
