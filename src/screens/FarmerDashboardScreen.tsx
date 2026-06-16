import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

export default function FarmerDashboardScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'products'),
      where('farmerId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) }))
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setProducts(items);
      setLoading(false);
    }, err => {
      console.error('Farmer product load error:', err);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.id]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', id));
            } catch (e: any) {
              Alert.alert('Error', 'Failed to delete: ' + e.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStock = async (id: string, currentStock: number) => {
    try {
      await updateDoc(doc(db, 'products', id), {
        stock: currentStock > 0 ? 0 : 50, // Default to 50 if toggling back to in-stock
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update stock: ' + e.message);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=150' }} style={styles.image} />
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
        <Text style={styles.price}>Le {(item.price || 0).toFixed(2)}</Text>
        <View style={styles.stockRow}>
          <View style={[styles.stockIndicator, { backgroundColor: (item.stock || 0) > 0 ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.stock}>{(item.stock || 0) > 0 ? `${item.stock} in stock` : 'Out of Stock'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: (item.stock || 0) > 0 ? '#fff3e0' : '#e8f5e9' }]} onPress={() => handleToggleStock(item.id, item.stock || 0)}>
          <Ionicons name={(item.stock || 0) > 0 ? "close-circle-outline" : "checkmark-circle-outline"} size={24} color={(item.stock || 0) > 0 ? "#f57c00" : "#2e7d32"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddEditProduct', { product: item })}>
          <Ionicons name="create-outline" size={24} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.name)}>
          <Ionicons name="trash-outline" size={24} color="#e53935" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Ionicons name="cube-outline" size={24} color="#f57c00" />
        <Text style={styles.statValue}>{products.length}</Text>
        <Text style={styles.statLabel}>Products</Text>
      </View>
      <View style={styles.statBox}>
        <Ionicons name="cash-outline" size={24} color="#2e7d32" />
        <Text style={styles.statValue}>Le {totalValue.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Inventory Value</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#f57c00" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={products.length > 0 ? renderHeader : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No products yet.</Text>
              <Text style={styles.emptySubText}>Tap the + button to add your first product!</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditProduct')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', width: '100%', maxWidth: 800, alignSelf: 'center' },
  list: { padding: 16, paddingBottom: 90 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { 
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', 
    marginHorizontal: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } 
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16,
    marginVertical: 8, padding: 12, alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  image: { width: 80, height: 80, borderRadius: 12, marginRight: 14 },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 10, color: '#555', overflow: 'hidden' },
  price: { color: '#2e7d32', fontWeight: 'bold', marginTop: 6, fontSize: 15 },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  stockIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stock: { color: '#666', fontSize: 12 },
  actions: { flexDirection: 'column', justifyContent: 'space-around', height: '100%' },
  actionBtn: { padding: 8, backgroundColor: '#f9f9f9', borderRadius: 8, marginVertical: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#aaa', marginTop: 6, textAlign: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, backgroundColor: '#f57c00',
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center',
    alignItems: 'center', elevation: 6, shadowColor: '#f57c00', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
});
